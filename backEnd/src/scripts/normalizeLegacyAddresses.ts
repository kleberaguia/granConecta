import "reflect-metadata";

import { AppDataSource } from "../config/data-source";
import { Endereco } from "../models/EnderecoModel";
import legacyAddressNormalizerService from "../services/address/LegacyAddressNormalizerService";

async function main(): Promise<void> {
  console.log(
    "[NormalizeLegacyAddresses] Iniciando NORMALIZAÇÃO CONTROLADA..."
  );

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();

      console.log(
        "[NormalizeLegacyAddresses] Banco conectado."
      );
    }

    const enderecoRepository =
      AppDataSource.getRepository(Endereco);

    /**
     * Lote previamente revisado no dry-run.
     *
     * Somente estes IDs poderão ser alterados
     * nesta execução.
     */
    const idsValidados = new Set<number>([
      33,
      35,
      70,
      71,
      73,
      74,
      75,
    ]);

    /**
     * Buscamos endereços legados que:
     *
     * - possuem logradouro;
     * - ainda não possuem número separado;
     * - continuam sem coordenadas.
     *
     * A proteção por idsValidados abaixo impede
     * que outros registros sejam modificados.
     */
    const enderecos = await enderecoRepository
      .createQueryBuilder("endereco")
      .where("endereco.logradouro IS NOT NULL")
      .andWhere("TRIM(endereco.logradouro) <> ''")
      .andWhere(
        "(endereco.numero IS NULL OR TRIM(endereco.numero) = '')"
      )
      .andWhere(
        "(endereco.latitude IS NULL OR endereco.longitude IS NULL)"
      )
      .orderBy("endereco.id", "ASC")
      .getMany();

    console.log(
      "[NormalizeLegacyAddresses] Candidatos encontrados:",
      enderecos.length
    );

    let alterados = 0;
    let ignorados = 0;
    let erros = 0;

    for (const enderecoOriginal of enderecos) {
      /**
       * PROTEÇÃO PRINCIPAL:
       *
       * nenhum endereço fora do lote previamente
       * validado poderá chegar ao save().
       */
      if (!idsValidados.has(enderecoOriginal.id)) {
        ignorados++;

        console.warn(
          "[NormalizeLegacyAddresses] IGNORADO - fora do lote validado:",
          {
            enderecoId: enderecoOriginal.id,
            usuarioId: enderecoOriginal.usuarioId,
          }
        );

        continue;
      }

      try {
        /**
         * salvar = true
         *
         * A normalização será efetivamente
         * persistida no banco.
         */
        const resultado =
          await legacyAddressNormalizerService.normalizarEndereco(
            enderecoOriginal.id,
            true
          );

        if (!resultado.alterado) {
          ignorados++;

          console.log("\n[IGNORADO]", {
            enderecoId: enderecoOriginal.id,
            usuarioId: enderecoOriginal.usuarioId,
            motivo:
              "Nenhuma normalização segura encontrada.",
            logradouro: enderecoOriginal.logradouro,
            numero: enderecoOriginal.numero || null,
          });

          continue;
        }

        alterados++;

        console.log(
          "\n========================================"
        );

        console.log(
          "[NORMALIZAÇÃO REALIZADA]"
        );

        console.log({
          enderecoId: enderecoOriginal.id,
          usuarioId: enderecoOriginal.usuarioId,
          camposAlterados:
            resultado.camposAlterados,
        });

        console.log("ANTES:", {
          condominio_id:
            enderecoOriginal.condominio_id || null,

          cep:
            enderecoOriginal.cep || null,

          logradouro:
            enderecoOriginal.logradouro || null,

          numero:
            enderecoOriginal.numero || null,

          bairro:
            enderecoOriginal.bairro || null,

          cidade:
            enderecoOriginal.cidade || null,

          uf:
            enderecoOriginal.uf || null,
        });

        console.log("DEPOIS:", {
          condominio_id:
            resultado.endereco.condominio_id ||
            null,

          cep:
            resultado.endereco.cep || null,

          logradouro:
            resultado.endereco.logradouro ||
            null,

          numero:
            resultado.endereco.numero || null,

          bairro:
            resultado.endereco.bairro || null,

          cidade:
            resultado.endereco.cidade || null,

          uf:
            resultado.endereco.uf || null,
        });

        console.log(
          "SALVO NO BANCO: SIM"
        );

        console.log(
          "========================================"
        );
      } catch (error) {
        erros++;

        console.error(
          "[NormalizeLegacyAddresses] ERRO",
          {
            enderecoId: enderecoOriginal.id,
            usuarioId: enderecoOriginal.usuarioId,

            erro:
              error instanceof Error
                ? error.message
                : String(error),
          }
        );
      }
    }

    console.log(
      "\n[NormalizeLegacyAddresses] NORMALIZAÇÃO concluída.",
      {
        totalCandidatos: enderecos.length,
        loteValidado: idsValidados.size,
        alterados,
        ignorados,
        erros,
        bancoAlterado: alterados > 0,
      }
    );
  } catch (error) {
    console.error(
      "[NormalizeLegacyAddresses] Erro fatal:",
      error
    );

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();

      console.log(
        "[NormalizeLegacyAddresses] Conexão encerrada."
      );
    }
  }
}

void main();