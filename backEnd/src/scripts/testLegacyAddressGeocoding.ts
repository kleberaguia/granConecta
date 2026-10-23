import "reflect-metadata";

import { AppDataSource } from "../config/data-source";
import { Endereco } from "../models/EnderecoModel";
import geocodingService from "../services/address/GeocodingService";

const IDS_TESTE = [
  33,
  35,
  70,
  71,
  73,
  74,
  75,
];

async function main(): Promise<void> {
  console.log(
    "[TestLegacyAddressGeocoding] Iniciando diagnóstico."
  );

  console.log(
    "[TestLegacyAddressGeocoding] BANCO SERÁ ALTERADO: NÃO"
  );

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();

      console.log(
        "[TestLegacyAddressGeocoding] Banco conectado."
      );
    }

    const enderecoRepository =
      AppDataSource.getRepository(Endereco);

    const enderecos = await enderecoRepository
      .createQueryBuilder("endereco")
      .where("endereco.id IN (:...ids)", {
        ids: IDS_TESTE,
      })
      .orderBy("endereco.id", "ASC")
      .getMany();

    console.log(
      "[TestLegacyAddressGeocoding] Registros encontrados:",
      enderecos.length
    );

    let confirmados = 0;
    let naoConfirmados = 0;
    let ignorados = 0;
    let erros = 0;

    for (const endereco of enderecos) {
      console.log(
        "\n========================================"
      );

      console.log("[ENDEREÇO]", {
        id: endereco.id,
        usuarioId: endereco.usuarioId,
        logradouro: endereco.logradouro || null,
        numero: endereco.numero || null,
        bairro: endereco.bairro || null,
        cidade: endereco.cidade || null,
        uf: endereco.uf || null,
        cep: endereco.cep || null,
      });

      if (
        !endereco.logradouro ||
        !endereco.numero
      ) {
        ignorados++;

        console.log(
          "[IGNORADO] Logradouro ou número ausente."
        );

        console.log(
          "BANCO ALTERADO: NÃO"
        );

        continue;
      }

      try {
        /*
         * IMPORTANTE:
         *
         * cidade e UF são enviados como string vazia
         * somente para este diagnóstico.
         *
         * O GeocodingService usa filter(Boolean),
         * portanto esses valores não entram na consulta
         * enviada ao Nominatim.
         */
        const resultado =
          await geocodingService.geocodificar({
            logradouro:
              endereco.logradouro,

            numero:
              String(endereco.numero),

            bairro:
              endereco.bairro || null,

            cidade:
              endereco.cidade || "",

            uf:
              endereco.uf || "",

            cep:
              endereco.cep || null,
          });

        if (!resultado) {
          naoConfirmados++;

          console.log(
            "[RESULTADO] NÃO CONFIRMADO"
          );

          console.log({
            id: endereco.id,
            endereco:
              `${endereco.logradouro}, ${endereco.numero}`,
          });

          console.log(
            "BANCO ALTERADO: NÃO"
          );

          continue;
        }

        confirmados++;

        console.log(
          "[RESULTADO] ENDEREÇO CONFIRMADO"
        );

        console.log({
          id: endereco.id,

          endereco:
            `${endereco.logradouro}, ${endereco.numero}`,

          cepEncontrado:
            resultado.cep,

          latitude:
            resultado.latitude,

          longitude:
            resultado.longitude,

          provider:
            resultado.provider,
        });

        console.log(
          "BANCO ALTERADO: NÃO"
        );
      } catch (error) {
        erros++;

        console.error(
          "[ERRO AO TESTAR ENDEREÇO]",
          {
            id: endereco.id,

            erro:
              error instanceof Error
                ? error.message
                : String(error),
          }
        );
      }

      /*
       * Pequeno intervalo entre requisições.
       *
       * Evita disparar várias consultas imediatamente
       * contra o serviço público do Nominatim.
       */
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1200);
      });
    }

    console.log(
      "\n========================================"
    );

    console.log(
      "[TestLegacyAddressGeocoding] DIAGNÓSTICO CONCLUÍDO",
      {
        solicitados: IDS_TESTE.length,
        encontrados: enderecos.length,
        confirmados,
        naoConfirmados,
        ignorados,
        erros,
        bancoAlterado: false,
      }
    );
  } catch (error) {
    console.error(
      "[TestLegacyAddressGeocoding] ERRO FATAL:",
      error
    );

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();

      console.log(
        "[TestLegacyAddressGeocoding] Conexão encerrada."
      );
    }
  }
}

void main();