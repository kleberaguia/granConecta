import "reflect-metadata";

import { AppDataSource } from "../config/data-source";
import { Endereco } from "../models/EnderecoModel";
import GeocodingService from "../services/address/GeocodingService";

/**
 * LOTE CONTROLADO
 *
 * Estes são SOMENTE os registros que passaram pelo DRY-RUN
 * e cuja Avenida Aparecida do Rio Negro foi identificada
 * de forma não ambígua.
 *
 * IDs 35 e 70 NÃO fazem parte deste lote.
 */
const IDS_VALIDADOS = new Set<number>([
  33,
  71,
  73,
  74,
  75,
]);

/**
 * Dados que já foram confirmados no DRY-RUN.
 *
 * IMPORTANTE:
 *
 * - não salvamos latitude/longitude da VIA;
 * - não salvamos bairro nesta etapa;
 * - não alteramos geocoding_status;
 * - não alteramos geocoding_precision;
 * - somente campos vazios poderão ser preenchidos.
 */
const DADOS_VALIDADOS = {
  cep: "05144085",
  cidade: "São Paulo",
  uf: "SP",
} as const;

function vazio(
  valor: string | null | undefined
): boolean {
  return !String(valor || "").trim();
}

async function main(): Promise<void> {
  console.log(
    "[EnrichLegacyAddresses] Iniciando GRAVAÇÃO CONTROLADA..."
  );

  console.log(
    "[EnrichLegacyAddresses] BANCO SERÁ ALTERADO: SIM"
  );

  console.log(
    "[EnrichLegacyAddresses] IDs autorizados:",
    Array.from(IDS_VALIDADOS)
  );

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();

      console.log(
        "[EnrichLegacyAddresses] Banco conectado."
      );
    }

    const repository =
      AppDataSource.getRepository(Endereco);

    /**
     * A consulta também está limitada explicitamente
     * aos cinco IDs autorizados.
     */
    const enderecos = await repository
      .createQueryBuilder("endereco")
      .where("endereco.id IN (:...ids)", {
        ids: Array.from(IDS_VALIDADOS),
      })
      .orderBy("endereco.id", "ASC")
      .getMany();

    console.log(
      "[EnrichLegacyAddresses] Registros encontrados:",
      enderecos.length
    );

    /**
     * Proteção adicional:
     *
     * se algum ID esperado não estiver no banco,
     * o script informa, mas não tenta criar nada.
     */
    const idsEncontrados = new Set(
      enderecos.map((endereco) =>
        Number(endereco.id)
      )
    );

    const idsNaoEncontrados =
      Array.from(IDS_VALIDADOS).filter(
        (id) => !idsEncontrados.has(id)
      );

    if (idsNaoEncontrados.length > 0) {
      console.warn(
        "[EnrichLegacyAddresses] ATENÇÃO - IDs não encontrados:",
        idsNaoEncontrados
      );
    }

    let processados = 0;
    let alterados = 0;
    let semAlteracao = 0;
    let rejeitados = 0;
    let erros = 0;

    for (const endereco of enderecos) {
      console.log(
        "\n========================================"
      );

      console.log("[ENDEREÇO]", {
        id: endereco.id,
        usuarioId: endereco.usuarioId,
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        uf: endereco.uf,
        cep: endereco.cep,
        latitude: endereco.latitude,
        longitude: endereco.longitude,
        geocoding_status:
          endereco.geocoding_status,
        geocoding_precision:
          endereco.geocoding_precision,
      });

      /**
       * Segunda trava.
       *
       * Mesmo que futuramente a consulta seja modificada
       * por engano, nenhum ID fora deste Set será salvo.
       */
      if (!IDS_VALIDADOS.has(Number(endereco.id))) {
        rejeitados++;

        console.error(
          "[BLOQUEADO] Registro fora do lote autorizado.",
          {
            enderecoId: endereco.id,
          }
        );

        continue;
      }

      if (
        !endereco.logradouro ||
        !endereco.numero
      ) {
        rejeitados++;

        console.warn(
          "[IGNORADO] Endereço sem logradouro ou número.",
          {
            enderecoId: endereco.id,
          }
        );

        continue;
      }

      processados++;

      try {
        /**
         * Fazemos novamente a descoberta da VIA.
         *
         * Isso evita confiar cegamente apenas no resultado
         * da execução anterior.
         */
        const resultado =
          await GeocodingService.descobrirDadosDaVia({
            logradouro:
              endereco.logradouro,

            numero:
              endereco.numero,

            bairro:
              endereco.bairro,

            cidade:
              endereco.cidade || undefined,

            uf:
              endereco.uf || undefined,

            cep:
              endereco.cep,
          });

        if (!resultado) {
          rejeitados++;

          console.warn(
            "[NÃO ALTERADO]",
            {
              enderecoId: endereco.id,
              motivo:
                "Via não encontrada com segurança ou resultado ambíguo nesta nova validação.",
            }
          );

          continue;
        }

        /**
         * Validamos novamente os dados fundamentais
         * encontrados pelo provider.
         *
         * Não basta simplesmente resultado != null.
         */
        const cepEncontrado =
          String(resultado.cep || "")
            .replace(/\D/g, "");

        const cidadeEncontrada =
          String(resultado.cidade || "")
            .trim()
            .toLocaleLowerCase("pt-BR");

        const ufEncontrada =
          String(resultado.uf || "")
            .trim()
            .toUpperCase();

        const cepEsperado =
          DADOS_VALIDADOS.cep;

        const cidadeEsperada =
          DADOS_VALIDADOS.cidade
            .trim()
            .toLocaleLowerCase("pt-BR");

        const ufEsperada =
          DADOS_VALIDADOS.uf;

        if (
          cepEncontrado !== cepEsperado ||
          cidadeEncontrada !== cidadeEsperada ||
          ufEncontrada !== ufEsperada
        ) {
          rejeitados++;

          console.error(
            "[BLOQUEADO] Provider retornou dados diferentes dos validados.",
            {
              enderecoId:
                endereco.id,

              esperado: {
                cep:
                  DADOS_VALIDADOS.cep,
                cidade:
                  DADOS_VALIDADOS.cidade,
                uf:
                  DADOS_VALIDADOS.uf,
              },

              recebido: {
                cep:
                  resultado.cep,
                cidade:
                  resultado.cidade,
                uf:
                  resultado.uf,
              },
            }
          );

          continue;
        }

        /**
         * Guardamos o estado anterior para auditoria.
         */
        const antes = {
          cep:
            endereco.cep || null,

          bairro:
            endereco.bairro || null,

          cidade:
            endereco.cidade || null,

          uf:
            endereco.uf || null,

          latitude:
            endereco.latitude || null,

          longitude:
            endereco.longitude || null,

          geocoding_status:
            endereco.geocoding_status || null,

          geocoding_precision:
            endereco.geocoding_precision || null,
        };

        const camposAlterados: string[] = [];

        /**
         * SOMENTE campos vazios são preenchidos.
         *
         * Nenhum dado existente é sobrescrito.
         */
        if (vazio(endereco.cep)) {
          endereco.cep =
            DADOS_VALIDADOS.cep;

          camposAlterados.push("cep");
        }

        if (vazio(endereco.cidade)) {
          endereco.cidade =
            DADOS_VALIDADOS.cidade;

          camposAlterados.push("cidade");
        }

        if (vazio(endereco.uf)) {
          endereco.uf =
            DADOS_VALIDADOS.uf;

          camposAlterados.push("uf");
        }

        /**
         * BAIRRO:
         *
         * deliberadamente NÃO alteramos.
         *
         * O Nominatim retornou "Grand Reserva Paulista",
         * mas não vamos assumir que esse valor representa
         * o bairro postal canônico.
         */

        /**
         * COORDENADAS:
         *
         * deliberadamente NÃO copiamos:
         *
         * resultado.latitudeReferencia
         * resultado.longitudeReferencia
         *
         * porque possuem precision = VIA.
         */

        console.log("ANTES:", antes);

        console.log("VALIDAÇÃO DA VIA:", {
          cep:
            resultado.cep,

          bairroRetornado:
            resultado.bairro,

          cidade:
            resultado.cidade,

          uf:
            resultado.uf,

          latitudeReferencia:
            resultado.latitudeReferencia,

          longitudeReferencia:
            resultado.longitudeReferencia,

          precision:
            resultado.precision,
        });

        console.log(
          "CAMPOS AUTORIZADOS PARA ALTERAÇÃO:",
          camposAlterados
        );

        if (camposAlterados.length === 0) {
          semAlteracao++;

          console.log(
            "[SEM ALTERAÇÃO] Os campos autorizados já estavam preenchidos."
          );

          continue;
        }

        /**
         * Aqui acontece a gravação real.
         *
         * A entidade contém os mesmos valores anteriores
         * para latitude, longitude, bairro e geocoding.
         */
        await repository.save(endereco);

        /**
         * Não confiamos apenas no objeto em memória.
         *
         * Relemos o registro diretamente do banco
         * para comprovar o resultado da gravação.
         */
        const salvo =
          await repository.findOne({
            where: {
              id: endereco.id,
            },
          });

        if (!salvo) {
          throw new Error(
            `ENDERECO_${endereco.id}_NAO_ENCONTRADO_APOS_SAVE`
          );
        }

        alterados++;

        console.log(
          "[SALVO COM SUCESSO]",
          {
            enderecoId:
              salvo.id,

            usuarioId:
              salvo.usuarioId,

            camposAlterados,

            depois: {
              cep:
                salvo.cep || null,

              bairro:
                salvo.bairro || null,

              cidade:
                salvo.cidade || null,

              uf:
                salvo.uf || null,

              latitude:
                salvo.latitude || null,

              longitude:
                salvo.longitude || null,

              geocoding_status:
                salvo.geocoding_status || null,

              geocoding_precision:
                salvo.geocoding_precision || null,
            },
          }
        );

        /**
         * Proteção pós-save.
         *
         * Neste estágio não esperamos que coordenadas
         * sejam criadas pelo script.
         *
         * Se já existiam antes, elas são preservadas.
         */
        const latitudeAntes =
          antes.latitude === null
            ? null
            : String(antes.latitude);

        const longitudeAntes =
          antes.longitude === null
            ? null
            : String(antes.longitude);

        const latitudeDepois =
          salvo.latitude == null
            ? null
            : String(salvo.latitude);

        const longitudeDepois =
          salvo.longitude == null
            ? null
            : String(salvo.longitude);

        if (
          latitudeAntes !== latitudeDepois ||
          longitudeAntes !== longitudeDepois
        ) {
          console.error(
            "[ALERTA] Latitude/longitude mudaram inesperadamente!",
            {
              enderecoId:
                salvo.id,

              antes: {
                latitude:
                  latitudeAntes,
                longitude:
                  longitudeAntes,
              },

              depois: {
                latitude:
                  latitudeDepois,
                longitude:
                  longitudeDepois,
              },
            }
          );

          throw new Error(
            `COORDENADAS_ALTERADAS_INESPERADAMENTE_${salvo.id}`
          );
        }
      } catch (error) {
        erros++;

        console.error(
          "[EnrichLegacyAddresses] ERRO",
          {
            enderecoId:
              endereco.id,

            usuarioId:
              endereco.usuarioId,

            erro:
              error instanceof Error
                ? error.message
                : String(error),
          }
        );
      }
    }

    console.log(
      "\n========================================"
    );

    console.log(
      "[EnrichLegacyAddresses] GRAVAÇÃO CONTROLADA CONCLUÍDA",
      {
        autorizados:
          IDS_VALIDADOS.size,

        encontrados:
          enderecos.length,

        idsNaoEncontrados,

        processados,

        alterados,

        semAlteracao,

        rejeitados,

        erros,

        bancoAlterado:
          alterados > 0,
      }
    );
  } catch (error) {
    console.error(
      "[EnrichLegacyAddresses] ERRO FATAL:",
      error
    );

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();

      console.log(
        "[EnrichLegacyAddresses] Conexão encerrada."
      );
    }
  }
}

void main();