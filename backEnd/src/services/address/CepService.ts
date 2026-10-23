export interface CepAddressResult {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;

  /**
   * Coordenadas aproximadas fornecidas pelo provedor do CEP.
   *
   * IMPORTANTE:
   * estas coordenadas NÃO representam necessariamente
   * o número exato do endereço.
   */
  latitude: string | null;
  longitude: string | null;

  /**
   * Deixa explícito para os consumidores que as
   * coordenadas, quando existentes, possuem precisão de CEP.
   */
  coordenadasPrecisao: "CEP" | "NENHUMA";

  provider: "BRASIL_API" | "VIA_CEP";
}

type BrasilApiCepV2Response = {
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;

  location?: {
    type?: string;
    coordinates?: {
      longitude?: string | number;
      latitude?: string | number;
    };
  };
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export class CepService {
  private static readonly TIMEOUT_MS = 5000;

  /**
   * Remove qualquer formatação do CEP.
   *
   * 01310-930 -> 01310930
   */
  private normalizarCep(cep: string): string {
    return String(cep || "").replace(/\D/g, "");
  }

  private validarCep(cep: string): void {
    if (!/^\d{8}$/.test(cep)) {
      throw new Error("CEP_INVALIDO");
    }
  }

  /**
   * Verifica se latitude/longitude retornadas pelo
   * provedor são numericamente válidas.
   */
  private coordenadasValidas(
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
   * Consulta principal.
   *
   * 1. BrasilAPI CEP V2
   *    - endereço associado ao CEP;
   *    - eventualmente latitude/longitude;
   *    - coordenadas são consideradas precisão CEP.
   *
   * 2. ViaCEP como fallback
   *    - endereço;
   *    - sem coordenadas.
   *
   * IMPORTANTE:
   * latitude/longitude retornadas por este serviço
   * NÃO devem ser interpretadas como coordenadas
   * confirmadas do número do imóvel.
   */
  public async consultar(
    cepInformado: string
  ): Promise<CepAddressResult> {
    const cep = this.normalizarCep(cepInformado);

    this.validarCep(cep);

    try {
      return await this.consultarBrasilApi(cep);
    } catch (error) {
      console.warn(
        `[CepService] BrasilAPI indisponível para CEP ${cep}. Tentando ViaCEP.`,
        error instanceof Error
          ? error.message
          : error
      );
    }

    try {
      return await this.consultarViaCep(cep);
    } catch (error) {
      console.error(
        `[CepService] Falha também no ViaCEP para CEP ${cep}.`,
        error instanceof Error
          ? error.message
          : error
      );

      throw new Error("CEP_NAO_ENCONTRADO");
    }
  }

  private async consultarBrasilApi(
    cep: string
  ): Promise<CepAddressResult> {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      CepService.TIMEOUT_MS
    );

    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cep/v2/${cep}`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",
          },

          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          `BRASIL_API_HTTP_${response.status}`
        );
      }

      const data =
        (await response.json()) as BrasilApiCepV2Response;

      if (
        !data.cep ||
        !data.city ||
        !data.state
      ) {
        throw new Error(
          "BRASIL_API_RESPOSTA_INVALIDA"
        );
      }

      const latitudeBruta =
        data.location?.coordinates?.latitude;

      const longitudeBruta =
        data.location?.coordinates?.longitude;

      const possuiCoordenadas =
        this.coordenadasValidas(
          latitudeBruta,
          longitudeBruta
        );

      const latitude =
        possuiCoordenadas
          ? String(latitudeBruta)
          : null;

      const longitude =
        possuiCoordenadas
          ? String(longitudeBruta)
          : null;

      console.info(
        "[CepService] CEP consultado via BrasilAPI.",
        {
          cep: this.normalizarCep(data.cep),

          cidade: String(
            data.city || ""
          ).trim(),

          uf: String(
            data.state || ""
          )
            .trim()
            .toUpperCase(),

          possuiCoordenadas,

          coordenadasPrecisao:
            possuiCoordenadas
              ? "CEP"
              : "NENHUMA",

          /**
           * Não logamos como ENDERECO porque
           * o provedor está sendo consultado
           * somente pelo CEP.
           */
          latitude,
          longitude,
        }
      );

      return {
        cep: this.normalizarCep(data.cep),

        logradouro: String(
          data.street || ""
        ).trim(),

        bairro: String(
          data.neighborhood || ""
        ).trim(),

        cidade: String(
          data.city || ""
        ).trim(),

        uf: String(
          data.state || ""
        )
          .trim()
          .toUpperCase(),

        latitude,

        longitude,

        coordenadasPrecisao:
          possuiCoordenadas
            ? "CEP"
            : "NENHUMA",

        provider: "BRASIL_API",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async consultarViaCep(
    cep: string
  ): Promise<CepAddressResult> {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      CepService.TIMEOUT_MS
    );

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",
          },

          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          `VIA_CEP_HTTP_${response.status}`
        );
      }

      const data =
        (await response.json()) as ViaCepResponse;

      if (
        data.erro === true ||
        !data.cep ||
        !data.localidade ||
        !data.uf
      ) {
        throw new Error(
          "VIA_CEP_NAO_ENCONTRADO"
        );
      }

      return {
        cep: this.normalizarCep(data.cep),

        logradouro: String(
          data.logradouro || ""
        ).trim(),

        bairro: String(
          data.bairro || ""
        ).trim(),

        cidade: String(
          data.localidade || ""
        ).trim(),

        uf: String(
          data.uf || ""
        )
          .trim()
          .toUpperCase(),

        latitude: null,

        longitude: null,

        coordenadasPrecisao: "NENHUMA",

        provider: "VIA_CEP",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export default new CepService();