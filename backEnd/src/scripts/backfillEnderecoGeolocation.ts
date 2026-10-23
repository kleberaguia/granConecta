import "reflect-metadata";

import { AppDataSource } from "../config/data-source";
import {
  Endereco,
  EnderecoGeocodingStatus,
} from "../models/EnderecoModel";
import enderecoGeolocationService from "../services/EnderecoGeolocationService";

async function main(): Promise<void> {
  console.log(
    "[BackfillEnderecoGeolocation] Iniciando..."
  );

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();

      console.log(
        "[BackfillEnderecoGeolocation] Banco conectado."
      );
    }

    const enderecoRepository =
      AppDataSource.getRepository(Endereco);

    /*
     * Pegamos endereços que ainda não possuem
     * coordenadas válidas ou continuam pendentes.
     *
     * Não alteramos localizacao_publica.
     */
    const enderecos = await enderecoRepository
      .createQueryBuilder("endereco")
      .where(
        `
        endereco.geocoding_status = :pendente
        OR endereco.latitude IS NULL
        OR endereco.longitude IS NULL
        `,
        {
          pendente: EnderecoGeocodingStatus.PENDENTE,
        }
      )
      .orderBy("endereco.id", "ASC")
      .getMany();

    console.log(
      "[BackfillEnderecoGeolocation] Endereços encontrados:",
      enderecos.length
    );

    let localizados = 0;
    let pendentes = 0;
    let falhas = 0;

    for (const endereco of enderecos) {
      console.log(
        "[BackfillEnderecoGeolocation] Processando:",
        {
          enderecoId: endereco.id,
          usuarioId: endereco.usuarioId,
          condominioId:
            endereco.condominio_id || null,
          cep: endereco.cep || null,
        }
      );

      try {
        const resultado =
          await enderecoGeolocationService.geolocalizarEndereco(
            endereco.id
          );

        const possuiCoordenadas =
          resultado.latitude !== null &&
          resultado.latitude !== undefined &&
          resultado.longitude !== null &&
          resultado.longitude !== undefined;

        if (
          resultado.geocoding_status ===
            EnderecoGeocodingStatus.LOCALIZADO &&
          possuiCoordenadas
        ) {
          localizados++;

          console.log(
            "[BackfillEnderecoGeolocation] LOCALIZADO",
            {
              enderecoId: resultado.id,
              usuarioId: resultado.usuarioId,
              latitude: resultado.latitude,
              longitude: resultado.longitude,
              precision:
                resultado.geocoding_precision,
            }
          );
        } else {
          pendentes++;

          console.warn(
            "[BackfillEnderecoGeolocation] PENDENTE",
            {
              enderecoId: resultado.id,
              usuarioId: resultado.usuarioId,
              condominioId:
                resultado.condominio_id || null,
              status:
                resultado.geocoding_status,
              precision:
                resultado.geocoding_precision,
            }
          );
        }
      } catch (error) {
        falhas++;

        console.error(
          "[BackfillEnderecoGeolocation] ERRO",
          {
            enderecoId: endereco.id,
            usuarioId: endereco.usuarioId,
            erro:
              error instanceof Error
                ? error.message
                : String(error),
          }
        );
      }
    }

    console.log(
      "[BackfillEnderecoGeolocation] Concluído.",
      {
        total: enderecos.length,
        localizados,
        pendentes,
        falhas,
      }
    );
  } catch (error) {
    console.error(
      "[BackfillEnderecoGeolocation] Erro fatal:",
      error
    );

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();

      console.log(
        "[BackfillEnderecoGeolocation] Conexão encerrada."
      );
    }
  }
}

void main();