import { AppDataSource } from "../../config/data-source";

import {
  Endereco,
  EnderecoGeocodingPrecision,
  EnderecoGeocodingStatus,
} from "../../models/EnderecoModel";

import {
  Condominio,
  CondominioGeocodingPrecision,
  CondominioGeocodingStatus,
} from "../../models/condominiosModels";

export type Coordenada = {
  latitude: number;
  longitude: number;
};

export type DistanciaUsuarioResultado = {
  usuarioOrigemId: string;
  usuarioDestinoId: string;
  distanciaKm: number;
};

export type OrigemCoordenada =
  | "ENDERECO"
  | "CONDOMINIO"
  | "CEP";

export type LocalizacaoUsuario = {
  usuarioId: string;

  condominioId: string | null;

  coordenada: Coordenada | null;

  origem: OrigemCoordenada | null;

  precisao:
    | EnderecoGeocodingPrecision
    | CondominioGeocodingPrecision
    | null;
};

export class ProximityService {
  /**
   * Não inicializamos os repositories como propriedade da classe.
   *
   * Isso evita problemas caso o singleton deste serviço seja
   * importado antes de AppDataSource.initialize().
   */
  private get enderecoRepository() {
    return AppDataSource.getRepository(Endereco);
  }

  private get condominioRepository() {
    return AppDataSource.getRepository(Condominio);
  }

  /**
   * Raio médio da Terra em quilômetros.
   */
  private readonly RAIO_TERRA_KM = 6371.0088;

  /**
   * Converte graus para radianos.
   */
  private grausParaRadianos(graus: number): number {
    return (graus * Math.PI) / 180;
  }

  /**
   * Valida latitude/longitude.
   */
  public coordenadasValidas(
    latitude: unknown,
    longitude: unknown
  ): boolean {
    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return false;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  /**
   * Calcula a distância geográfica em linha reta
   * entre dois pontos usando Haversine.
   *
   * IMPORTANTE:
   * Isso NÃO representa distância pelas ruas.
   */
  public calcularDistanciaKm(
    origem: Coordenada,
    destino: Coordenada
  ): number {
    if (
      !this.coordenadasValidas(
        origem.latitude,
        origem.longitude
      ) ||
      !this.coordenadasValidas(
        destino.latitude,
        destino.longitude
      )
    ) {
      throw new Error("COORDENADAS_INVALIDAS");
    }

    const lat1 = this.grausParaRadianos(
      origem.latitude
    );

    const lat2 = this.grausParaRadianos(
      destino.latitude
    );

    const deltaLat = this.grausParaRadianos(
      destino.latitude - origem.latitude
    );

    const deltaLng = this.grausParaRadianos(
      destino.longitude - origem.longitude
    );

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLng / 2) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    const distancia =
      this.RAIO_TERRA_KM * c;

    return Number(distancia.toFixed(2));
  }

  /**
   * Verifica se um endereço possui coordenadas utilizáveis.
   */
  private enderecoPossuiCoordenadas(
    endereco: Endereco
  ): boolean {
    return (
      endereco.geocoding_status ===
        EnderecoGeocodingStatus.LOCALIZADO &&
      this.coordenadasValidas(
        endereco.latitude,
        endereco.longitude
      )
    );
  }

  /**
   * Verifica se um condomínio possui coordenadas utilizáveis.
   */
  private condominioPossuiCoordenadas(
    condominio: Condominio
  ): boolean {
    return (
      condominio.geocoding_status ===
        CondominioGeocodingStatus.LOCALIZADO &&
      this.coordenadasValidas(
        condominio.latitude,
        condominio.longitude
      )
    );
  }

  /**
   * Busca a localização interna de um usuário.
   *
   * PRIORIDADE:
   *
   * 1. Endereço individual com precisão ENDERECO.
   *
   * 2. Condomínio vinculado e localizado.
   *
   * 3. Endereço individual localizado apenas por CEP.
   *
   * 4. Sem localização confiável -> coordenada null.
   *
   * IMPORTANTE:
   * A regra "mesmo condomínio = 0 km" é aplicada
   * posteriormente em calcularDistanciaEntreUsuarios().
   */
  public async obterLocalizacaoUsuario(
    usuarioId: string
  ): Promise<LocalizacaoUsuario | null> {
    const endereco =
      await this.enderecoRepository.findOne({
        where: {
          usuarioId,
        },

        select: {
          id: true,
          usuarioId: true,
          condominio_id: true,
          latitude: true,
          longitude: true,
          geocoding_status: true,
          geocoding_precision: true,
        },
      });

    if (!endereco) {
      return null;
    }

    const condominioId =
      endereco.condominio_id || null;

    /**
     * ==========================================================
     * PRIORIDADE 1
     * ENDEREÇO INDIVIDUAL PRECISO
     * ==========================================================
     */
    if (
      endereco.geocoding_precision ===
        EnderecoGeocodingPrecision.ENDERECO &&
      this.enderecoPossuiCoordenadas(endereco)
    ) {
      return {
        usuarioId,
        condominioId,

        coordenada: {
          latitude: Number(endereco.latitude),
          longitude: Number(endereco.longitude),
        },

        origem: "ENDERECO",

        precisao:
          EnderecoGeocodingPrecision.ENDERECO,
      };
    }

    /**
     * ==========================================================
     * PRIORIDADE 2
     * COORDENADA DO CONDOMÍNIO
     * ==========================================================
     *
     * Se o usuário pertence a um condomínio, a coordenada
     * institucional do condomínio é preferida em relação
     * à coordenada aproximada de CEP do endereço individual.
     */
    if (condominioId) {
      const condominio =
        await this.condominioRepository.findOne({
          where: {
            id: condominioId,
          },

          select: {
            id: true,
            latitude: true,
            longitude: true,
            geocoding_status: true,
            geocoding_precision: true,
          },
        });

      if (
        condominio &&
        this.condominioPossuiCoordenadas(
          condominio
        )
      ) {
        return {
          usuarioId,
          condominioId,

          coordenada: {
            latitude: Number(
              condominio.latitude
            ),

            longitude: Number(
              condominio.longitude
            ),
          },

          origem: "CONDOMINIO",

          precisao:
            condominio.geocoding_precision,
        };
      }
    }

    /**
     * ==========================================================
     * PRIORIDADE 3
     * COORDENADA APROXIMADA PELO CEP
     * ==========================================================
     *
     * É utilizada somente como fallback.
     *
     * Não representa a posição exata do imóvel.
     */
    if (
      endereco.geocoding_precision ===
        EnderecoGeocodingPrecision.CEP &&
      this.enderecoPossuiCoordenadas(endereco)
    ) {
      return {
        usuarioId,
        condominioId,

        coordenada: {
          latitude: Number(endereco.latitude),
          longitude: Number(endereco.longitude),
        },

        origem: "CEP",

        precisao:
          EnderecoGeocodingPrecision.CEP,
      };
    }

    /**
     * Temos o endereço cadastrado, mas não temos
     * coordenadas utilizáveis.
     *
     * Ainda retornamos condominioId porque essa
     * informação pode ser suficiente para detectar
     * dois usuários do mesmo condomínio.
     */
    return {
      usuarioId,
      condominioId,
      coordenada: null,
      origem: null,
      precisao: null,
    };
  }

  /**
   * Mantido por compatibilidade com o código existente.
   *
   * Outros serviços podem já estar chamando:
   *
   * obterCoordenadasUsuario(usuarioId)
   *
   * Por isso não removemos este método.
   */
  public async obterCoordenadasUsuario(
    usuarioId: string
  ): Promise<Coordenada | null> {
    const localizacao =
      await this.obterLocalizacaoUsuario(
        usuarioId
      );

    return localizacao?.coordenada || null;
  }

  /**
   * Calcula a distância entre dois usuários.
   *
   * REGRA PRINCIPAL DO GRANCONECTA:
   *
   * Se os dois usuários pertencem ao mesmo condomínio,
   * a distância operacional é considerada 0 km.
   *
   * Isso é proposital.
   *
   * Não estamos tentando medir a distância física entre
   * duas torres ou apartamentos dentro do condomínio.
   * Para busca de prestadores/moradores, ambos estão
   * dentro da mesma comunidade.
   */
  public async calcularDistanciaEntreUsuarios(
    usuarioOrigemId: string,
    usuarioDestinoId: string
  ): Promise<DistanciaUsuarioResultado | null> {
    const [origem, destino] =
      await Promise.all([
        this.obterLocalizacaoUsuario(
          usuarioOrigemId
        ),

        this.obterLocalizacaoUsuario(
          usuarioDestinoId
        ),
      ]);

    if (!origem || !destino) {
      return null;
    }

    /**
     * ==========================================================
     * MESMO CONDOMÍNIO
     * ==========================================================
     */
    if (
      origem.condominioId &&
      destino.condominioId &&
      origem.condominioId ===
        destino.condominioId
    ) {
      return {
        usuarioOrigemId,
        usuarioDestinoId,
        distanciaKm: 0,
      };
    }

    /**
     * Condomínios diferentes ou algum usuário externo.
     *
     * Agora precisamos de coordenadas.
     */
    if (
      !origem.coordenada ||
      !destino.coordenada
    ) {
      return null;
    }

    return {
      usuarioOrigemId,
      usuarioDestinoId,

      distanciaKm:
        this.calcularDistanciaKm(
          origem.coordenada,
          destino.coordenada
        ),
    };
  }

  /**
   * Informa se uma distância está dentro
   * do raio solicitado pelo usuário.
   */
  public dentroDoRaio(
    distanciaKm: number,
    raioKm?: number | null
  ): boolean {
    if (
      raioKm === undefined ||
      raioKm === null
    ) {
      return true;
    }

    if (
      !Number.isFinite(raioKm) ||
      raioKm < 0
    ) {
      return false;
    }

    return distanciaKm <= raioKm;
  }
}

export default new ProximityService();