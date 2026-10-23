import "reflect-metadata";

import { AppDataSource } from "../config/data-source";
import proximityService from "../services/address/ProximityService";

const SARAH = {
  nome: "Sarah Prates",
  usuarioId:
    "9d3a0213-ef3c-420e-9c78-a9bb5bec8b0e",
};

const RENATA = {
  nome: "Renata Prates",
  usuarioId:
    "31a74354-06d1-42eb-a3b9-e32744122ec6",
};

const KAITTO = {
  nome: "kaitto",
  usuarioId:
    "ee2299e5-dbb1-42b2-a0ab-cbfac63a4477",
};

const USUARIOS = [
  SARAH,
  RENATA,
  KAITTO,
];

async function main(): Promise<void> {
  console.log(
    "[TestProximityService] Iniciando diagnóstico..."
  );

  console.log(
    "[TestProximityService] BANCO SERÁ ALTERADO: NÃO"
  );

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();

      console.log(
        "[TestProximityService] Banco conectado."
      );
    }

    console.log(
      "\n========================================"
    );

    console.log(
      "[1] LOCALIZAÇÃO INDIVIDUAL DOS USUÁRIOS"
    );

    console.log(
      "========================================"
    );

    for (const usuario of USUARIOS) {
      const localizacao =
        await proximityService.obterLocalizacaoUsuario(
          usuario.usuarioId
        );

      console.log(`\n${usuario.nome}:`);

      console.dir(localizacao, {
        depth: null,
      });
    }

    console.log(
      "\n========================================"
    );

    console.log(
      "[2] DISTÂNCIA SARAH -> RENATA"
    );

    console.log(
      "========================================"
    );

    const distanciaSarahRenata =
      await proximityService.calcularDistanciaEntreUsuarios(
        SARAH.usuarioId,
        RENATA.usuarioId
      );

    console.dir(distanciaSarahRenata, {
      depth: null,
    });

    console.log(
      "\n========================================"
    );

    console.log(
      "[3] DISTÂNCIA SARAH -> KAITTO"
    );

    console.log(
      "========================================"
    );

    const distanciaSarahKaitto =
      await proximityService.calcularDistanciaEntreUsuarios(
        SARAH.usuarioId,
        KAITTO.usuarioId
      );

    console.dir(distanciaSarahKaitto, {
      depth: null,
    });

    console.log(
      "\n========================================"
    );

    console.log(
      "[4] DISTÂNCIA RENATA -> KAITTO"
    );

    console.log(
      "========================================"
    );

    const distanciaRenataKaitto =
      await proximityService.calcularDistanciaEntreUsuarios(
        RENATA.usuarioId,
        KAITTO.usuarioId
      );

    console.dir(distanciaRenataKaitto, {
      depth: null,
    });

    console.log(
      "\n========================================"
    );

    console.log(
      "[TestProximityService] Diagnóstico concluído."
    );

    console.log(
      "[TestProximityService] BANCO ALTERADO: NÃO"
    );
  } catch (error) {
    console.error(
      "[TestProximityService] ERRO:",
      error
    );

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();

      console.log(
        "[TestProximityService] Conexão encerrada."
      );
    }
  }
}

void main();