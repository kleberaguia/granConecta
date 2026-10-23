import { AppDataSource } from "../../config/data-source";
import {
  Endereco,
  EnderecoGeocodingStatus,
} from "../../models/EnderecoModel";

export type Coordenada = {
  latitude: number;
  longitude: number;
};

export type DistanciaUsuarioResultado = {
  usuarioOrigemId: string;
  usuarioDestinoId: string;
  distanciaKm: number;
};

export class ProximityService {
  private enderecoRepository =
    AppDataSource.getRepository(Endereco);

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
   * Calcula distância geográfica em linha reta
   * entre dois pontos usando Haversine.
   *
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
   * Retorna as coordenadas internas de um usuário.
   *
   * localizacao_publica NÃO é verificada aqui porque
   * essa informação é utilizada internamente para
   * cálculo de distância.
   */
  public async obterCoordenadasUsuario(
    usuarioId: string
  ): Promise<Coordenada | null> {
    const endereco =
      await this.enderecoRepository.findOne({
        where: {
          usuarioId,
        },
        select: {
          id: true,
          usuarioId: true,
          latitude: true,
          longitude: true,
          geocoding_status: true,
        },
      });

    if (!endereco) {
      return null;
    }

    if (
      endereco.geocoding_status !==
      EnderecoGeocodingStatus.LOCALIZADO
    ) {
      return null;
    }

    if (
      !this.coordenadasValidas(
        endereco.latitude,
        endereco.longitude
      )
    ) {
      return null;
    }

    return {
      latitude: Number(endereco.latitude),
      longitude: Number(endereco.longitude),
    };
  }

  /**
   * Calcula a distância entre dois usuários.
   */
  public async calcularDistanciaEntreUsuarios(
    usuarioOrigemId: string,
    usuarioDestinoId: string
  ): Promise<DistanciaUsuarioResultado | null> {
    const [origem, destino] =
      await Promise.all([
        this.obterCoordenadasUsuario(
          usuarioOrigemId
        ),
        this.obterCoordenadasUsuario(
          usuarioDestinoId
        ),
      ]);

    if (!origem || !destino) {
      return null;
    }

    return {
      usuarioOrigemId,
      usuarioDestinoId,
      distanciaKm:
        this.calcularDistanciaKm(
          origem,
          destino
        ),
    };
  }

  /**
   * Informa se uma distância está dentro do
   * raio solicitado pelo usuário.
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