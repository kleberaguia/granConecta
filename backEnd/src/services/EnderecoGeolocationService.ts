import { AppDataSource } from "../config/data-source";
import {
  Endereco,
  EnderecoGeocodingPrecision,
  EnderecoGeocodingStatus,
} from "../models/EnderecoModel";
import { Condominio } from "../models/condominiosModels";
import geocodingService from "./address/GeocodingService";

type CondominioFallback = {
  latitude: string;
  longitude: string;
  cep?: string | null;
  logradouro?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
};

export class EnderecoGeolocationService {
  private enderecoRepository =
    AppDataSource.getRepository(Endereco);

  private condominioRepository =
    AppDataSource.getRepository(Condominio);

  private normalizarCep(cep?: string | null): string {
    return String(cep || "").replace(/\D/g, "");
  }

  private coordenadasValidas(
    latitude?: string | number | null,
    longitude?: string | number | null
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
   * Quando o usuário está vinculado a um condomínio já
   * geolocalizado, podemos usar a coordenada do condomínio
   * como fallback. Isso é especialmente útil para moradores
   * e negócios localizados dentro do condomínio.
   */
  private async obterFallbackDoCondominio(
    endereco: Endereco
  ): Promise<CondominioFallback | null> {
    if (!endereco.condominio_id) {
      return null;
    }

    const condominio = await this.condominioRepository.findOne({
      where: { id: endereco.condominio_id },
    });

    if (!condominio) {
      console.warn("[EnderecoGeolocationService] Condomínio não encontrado.", {
        enderecoId: endereco.id,
        condominioId: endereco.condominio_id,
      });
      return null;
    }

    if (
      !this.coordenadasValidas(
        condominio.latitude,
        condominio.longitude
      )
    ) {
      console.warn(
        "[EnderecoGeolocationService] Condomínio sem coordenadas válidas.",
        {
          enderecoId: endereco.id,
          condominioId: endereco.condominio_id,
          latitude: condominio.latitude,
          longitude: condominio.longitude,
        }
      );
      return null;
    }

    return {
      latitude: String(condominio.latitude),
      longitude: String(condominio.longitude),
      cep: condominio.cep || null,
      logradouro: condominio.logradouro || null,
      bairro: condominio.bairro || null,
      cidade: condominio.cidade || null,
      uf: condominio.uf || null,
    };
  }

  private enriquecerComCondominio(
    endereco: Endereco,
    fallback: CondominioFallback
  ): void {
    if (!this.normalizarCep(endereco.cep) && fallback.cep) {
      endereco.cep = this.normalizarCep(fallback.cep) || null;
    }

    if (!endereco.logradouro?.trim() && fallback.logradouro) {
      endereco.logradouro = fallback.logradouro;
    }

    if (!endereco.bairro?.trim() && fallback.bairro) {
      endereco.bairro = fallback.bairro;
    }

    if (!endereco.cidade?.trim() && fallback.cidade) {
      endereco.cidade = fallback.cidade;
    }

    if (!endereco.uf?.trim() && fallback.uf) {
      endereco.uf = String(fallback.uf).trim().toUpperCase();
    }
  }

  /**
   * Geolocaliza um endereço já persistido.
   *
   * Regra:
   * 1. preserva coordenada existente como fallback;
   * 2. se houver condomínio geolocalizado, pode usar sua
   *    coordenada como fallback;
   * 3. tenta confirmar o endereço completo pelo GeocodingService;
   * 4. só promove para ENDERECO quando o GeocodingService
   *    confirmar o número;
   * 5. falha no geocoder não apaga coordenadas existentes.
   */
  public async geolocalizarEndereco(
    enderecoId: number
  ): Promise<Endereco> {
    const endereco = await this.enderecoRepository.findOne({
      where: { id: enderecoId },
    });

    if (!endereco) {
      throw new Error("ENDERECO_NAO_ENCONTRADO");
    }

    const possuiCoordenadaAtual =
      this.coordenadasValidas(
        endereco.latitude,
        endereco.longitude
      );

    const fallbackCondominio =
      await this.obterFallbackDoCondominio(endereco);

    if (fallbackCondominio) {
      this.enriquecerComCondominio(
        endereco,
        fallbackCondominio
      );

      if (!possuiCoordenadaAtual) {
        endereco.latitude =
          fallbackCondominio.latitude;
        endereco.longitude =
          fallbackCondominio.longitude;
        endereco.geocoding_status =
          EnderecoGeocodingStatus.LOCALIZADO;
        endereco.geocoding_precision =
          EnderecoGeocodingPrecision.CEP;

        console.info(
          "[EnderecoGeolocationService] Fallback do condomínio aplicado.",
          {
            enderecoId: endereco.id,
            usuarioId: endereco.usuarioId,
            condominioId: endereco.condominio_id,
            precision: EnderecoGeocodingPrecision.CEP,
          }
        );
      }
    }

    const podeTentarEnderecoCompleto =
      Boolean(endereco.logradouro?.trim()) &&
      Boolean(endereco.numero?.trim()) &&
      Boolean(endereco.cidade?.trim()) &&
      Boolean(endereco.uf?.trim());

    if (podeTentarEnderecoCompleto) {
      const resultado =
        await geocodingService.geocodificar({
          logradouro: endereco.logradouro!,
          numero: endereco.numero!,
          bairro: endereco.bairro || null,
          cidade: endereco.cidade!,
          uf: endereco.uf!,
          cep: this.normalizarCep(endereco.cep) || null,
        });

      if (
        resultado &&
        this.coordenadasValidas(
          resultado.latitude,
          resultado.longitude
        )
      ) {
        endereco.latitude = resultado.latitude;
        endereco.longitude = resultado.longitude;
        endereco.geocoding_status =
          EnderecoGeocodingStatus.LOCALIZADO;
        endereco.geocoding_precision =
          EnderecoGeocodingPrecision.ENDERECO;

        return this.enderecoRepository.save(endereco);
      }
    }

    // Fallback de precisão VIA: nunca confundir referência da rua
    // com a localização exata do número do imóvel.
    if (
      !this.coordenadasValidas(endereco.latitude, endereco.longitude) &&
      Boolean(endereco.logradouro?.trim()) &&
      Boolean(endereco.cidade?.trim()) &&
      Boolean(endereco.uf?.trim())
    ) {
      const via = await geocodingService.descobrirDadosDaVia({
        logradouro: endereco.logradouro!,
        numero: endereco.numero || "",
        bairro: endereco.bairro || null,
        cidade: endereco.cidade!,
        uf: endereco.uf!,
        cep: this.normalizarCep(endereco.cep) || null,
      });

      const normalizar = (valor?: string | null): string =>
        String(valor || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toUpperCase();

      const cidadeConfere =
        Boolean(via?.cidade) &&
        normalizar(via?.cidade) === normalizar(endereco.cidade);
      const ufConfere =
        Boolean(via?.uf) &&
        normalizar(via?.uf) === normalizar(endereco.uf);
      const cepSolicitado = this.normalizarCep(endereco.cep);
      const cepDaVia = this.normalizarCep(via?.cep);
      const cepConfere =
        !cepSolicitado || !cepDaVia || cepSolicitado === cepDaVia;

      if (
        via &&
        cidadeConfere &&
        ufConfere &&
        cepConfere &&
        this.coordenadasValidas(
          via.latitudeReferencia,
          via.longitudeReferencia
        )
      ) {
        endereco.latitude = String(via.latitudeReferencia);
        endereco.longitude = String(via.longitudeReferencia);
        endereco.geocoding_status = EnderecoGeocodingStatus.LOCALIZADO;
        endereco.geocoding_precision = EnderecoGeocodingPrecision.VIA;
        console.info("[EnderecoGeolocationService] Referência de via localizada.", {
          enderecoId: endereco.id,
          precision: "VIA",
        });
        return this.enderecoRepository.save(endereco);
      }

      console.info("[EnderecoGeolocationService] Via não confirmada; endereço pendente.", {
        enderecoId: endereco.id,
        encontrouVia: Boolean(via),
        cidadeConfere,
        ufConfere,
        cepConfere,
      });
    }

    // Última alternativa: coordenada aproximada confirmada pelo CEP.
    // Nunca substituir uma coordenada válida ou promover CEP a ENDERECO.
    if (!this.coordenadasValidas(endereco.latitude, endereco.longitude)) {
      const referenciaCep = await geocodingService.geocodificarPorCep({
        cep: endereco.cep,
        cidade: endereco.cidade,
        uf: endereco.uf,
      });
      if (referenciaCep) {
        endereco.latitude = referenciaCep.latitude;
        endereco.longitude = referenciaCep.longitude;
        endereco.geocoding_status = EnderecoGeocodingStatus.LOCALIZADO;
        endereco.geocoding_precision = EnderecoGeocodingPrecision.CEP;
        return this.enderecoRepository.save(endereco);
      }
    }

    if (
      this.coordenadasValidas(
        endereco.latitude,
        endereco.longitude
      )
    ) {
      endereco.geocoding_status =
        EnderecoGeocodingStatus.LOCALIZADO;

      if (
        endereco.geocoding_precision ===
        EnderecoGeocodingPrecision.NENHUMA
      ) {
        endereco.geocoding_precision =
          EnderecoGeocodingPrecision.CEP;
      }
    } else {
      endereco.geocoding_status =
        EnderecoGeocodingStatus.PENDENTE;
      endereco.geocoding_precision =
        EnderecoGeocodingPrecision.NENHUMA;
    }

    return this.enderecoRepository.save(endereco);
  }

  public async geolocalizarPorUsuario(
    usuarioId: string
  ): Promise<Endereco> {
    const endereco = await this.enderecoRepository.findOne({
      where: { usuarioId },
    });

    if (!endereco) {
      throw new Error("ENDERECO_NAO_ENCONTRADO");
    }

    return this.geolocalizarEndereco(endereco.id);
  }
}

export default new EnderecoGeolocationService();
