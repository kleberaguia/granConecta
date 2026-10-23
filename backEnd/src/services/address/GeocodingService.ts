export interface GeocodingAddressInput {
  logradouro: string;
  numero: string;
  bairro?: string | null;
  cidade: string;
  uf: string;
  cep?: string | null;
}

export interface RoadEnrichmentResult {
  logradouro: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;

  latitudeReferencia: string | null;
  longitudeReferencia: string | null;

  provider: "NOMINATIM";
  precision: "VIA";
}

export interface GeocodingResult {
  latitude: string;
  longitude: string;

  /**
   * CEP retornado pelo Nominatim.
   *
   * Pode ser null quando o endereço foi confirmado,
   * mas o provider não informou postcode.
   */
  cep: string | null;

  provider: "NOMINATIM";
}

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  residential?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
  country_code?: string;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
  type?: string;
  addresstype?: string;
  address?: NominatimAddress;
};

type GeocodingDiagnosticReason =
  | "SEM_RESULTADOS"
  | "SEM_COORDENADAS"
  | "SEM_ADDRESS_DETAILS"
  | "SEM_HOUSE_NUMBER"
  | "NUMERO_DIFERENTE"
  | "PAIS_DIFERENTE"
  | "CEP_DIFERENTE"
  | "CIDADE_DIFERENTE"
  | "ENDERECO_CONFIRMADO";

type GeocodingValidation = {
  valido: boolean;
  motivo: GeocodingDiagnosticReason;
  numeroRetornado?: string;
  cepRetornado?: string;
  cidadeRetornada?: string;
};

export class GeocodingService {
  private static readonly TIMEOUT_MS = 5000;

  /**
   * Normaliza texto para comparações.
   *
   * Exemplo:
   * "São Paulo" -> "SAO PAULO"
   */
  private normalizarTexto(valor?: string | null): string {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();
  }

  /**
   * Mantém somente os números do CEP.
   *
   * Exemplo:
   * 05144-085 -> 05144085
   */
  private normalizarCep(valor?: string | null): string {
    return String(valor || "").replace(/\D/g, "");
  }

  /**
   * Normaliza o número do imóvel.
   *
   * Exemplos:
   * "478"   -> "478"
   * "478 A" -> "478A"
   */
  private normalizarNumero(valor?: string | null): string {
    return String(valor || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9/-]/g, "");
  }

  /**
   * Valida um candidato retornado pelo Nominatim.
   *
   * Para que o resultado seja considerado ENDEREÇO:
   *
   * - precisa possuir coordenadas;
   * - precisa possuir address details;
   * - precisa possuir house_number;
   * - house_number precisa coincidir;
   * - país precisa ser Brasil;
   * - CEP não pode divergir quando ambos existem;
   * - cidade não pode divergir quando ambas existem.
   */
  private validarResultado(
    resultado: NominatimResult,
    endereco: GeocodingAddressInput
  ): GeocodingValidation {
    if (
      !resultado?.lat ||
      !resultado?.lon ||
      !Number.isFinite(Number(resultado.lat)) ||
      !Number.isFinite(Number(resultado.lon))
    ) {
      return {
        valido: false,
        motivo: "SEM_COORDENADAS",
      };
    }

    const address = resultado.address;

    if (!address) {
      return {
        valido: false,
        motivo: "SEM_ADDRESS_DETAILS",
      };
    }

    const numeroEsperado =
      this.normalizarNumero(endereco.numero);

    const numeroRetornado =
      this.normalizarNumero(address.house_number);

    /**
     * Sem house_number não podemos afirmar
     * que a coordenada representa o imóvel.
     */
    if (!numeroRetornado) {
      return {
        valido: false,
        motivo: "SEM_HOUSE_NUMBER",
      };
    }

    /**
     * O número precisa ser exatamente
     * o número solicitado.
     */
    if (numeroRetornado !== numeroEsperado) {
      return {
        valido: false,
        motivo: "NUMERO_DIFERENTE",
        numeroRetornado,
      };
    }

    /**
     * O resultado precisa pertencer ao Brasil.
     */
    if (
      address.country_code &&
      this.normalizarTexto(address.country_code) !== "BR"
    ) {
      return {
        valido: false,
        motivo: "PAIS_DIFERENTE",
        numeroRetornado,
      };
    }

    const cepSolicitado =
      this.normalizarCep(endereco.cep);

    const cepRetornado =
      this.normalizarCep(address.postcode);

    /**
     * Se já conhecemos o CEP e o Nominatim
     * retorna outro CEP, rejeitamos.
     */
    if (
      cepSolicitado &&
      cepRetornado &&
      cepSolicitado !== cepRetornado
    ) {
      return {
        valido: false,
        motivo: "CEP_DIFERENTE",
        numeroRetornado,
        cepRetornado,
      };
    }

    const cidadeSolicitada =
      this.normalizarTexto(endereco.cidade);

    const cidadeRetornada =
      this.normalizarTexto(
        address.city ||
          address.town ||
          address.village ||
          address.municipality
      );

    /**
     * Se as duas cidades existem,
     * elas precisam coincidir.
     */
    if (
      cidadeSolicitada &&
      cidadeRetornada &&
      cidadeSolicitada !== cidadeRetornada
    ) {
      return {
        valido: false,
        motivo: "CIDADE_DIFERENTE",
        numeroRetornado,
        cepRetornado,
        cidadeRetornada,
      };
    }

    return {
      valido: true,
      motivo: "ENDERECO_CONFIRMADO",
      numeroRetornado,
      cepRetornado: cepRetornado || undefined,
      cidadeRetornada:
        cidadeRetornada || undefined,
    };
  }

  /**
   * Log padronizado para diagnóstico.
   */
  private logDiagnostico(
    endereco: GeocodingAddressInput,
    motivo: GeocodingDiagnosticReason,
    totalCandidatos: number,
    detalhes?: GeocodingValidation
  ): void {
    console.info("[GeocodingService]", {
      motivo,

      numeroSolicitado:
        endereco.numero,

      cepSolicitado:
        this.normalizarCep(endereco.cep) ||
        undefined,

      cidadeSolicitada:
        endereco.cidade || undefined,

      totalCandidatos,

      numeroRetornado:
        detalhes?.numeroRetornado,

      cepRetornado:
        detalhes?.cepRetornado,

      cidadeRetornada:
        detalhes?.cidadeRetornada,
    });
  }

  /**
   * Descobre dados estruturados da VIA.
   *
   * IMPORTANTE:
   *
   * - este método NÃO confirma o número do imóvel;
   * - latitude/longitude são apenas referência da via;
   * - nunca devem ser tratadas como precisão ENDERECO;
   * - resultados territorialmente ambíguos são rejeitados.
   *
   * Este método é útil para endereços antigos que possuem:
   *
   * Avenida Aparecida do Rio Negro
   * número 478
   *
   * mas ainda não possuem:
   *
   * CEP
   * bairro
   * cidade
   * UF
   */
  public async descobrirDadosDaVia(
    endereco: Pick<
      GeocodingAddressInput,
      "logradouro" | "numero"
    > &
      Partial<
        Pick<
          GeocodingAddressInput,
          "bairro" | "cidade" | "uf" | "cep"
        >
      >
  ): Promise<RoadEnrichmentResult | null> {
    /**
     * Nesta busca NÃO enviamos o número.
     *
     * Estamos tentando identificar a VIA,
     * não confirmar o imóvel.
     */
    const query = [
      endereco.logradouro,
      endereco.bairro || "",
      endereco.cidade || "",
      endereco.uf || "",
      endereco.cep || "",
      "Brasil",
    ]
      .filter(Boolean)
      .join(", ");

    const baseUrl =
      process.env.GEOCODING_NOMINATIM_URL ||
      "https://nominatim.openstreetmap.org/search";

    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "5",
      countrycodes: "br",
      addressdetails: "1",
    });

    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      GeocodingService.TIMEOUT_MS
    );

    try {
      const response = await fetch(
        `${baseUrl}?${params.toString()}`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",

            "User-Agent":
              process.env.GEOCODING_USER_AGENT ||
              "GranConecta/1.0 (geocoding)",
          },

          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          `GEOCODING_ROAD_HTTP_${response.status}`
        );
      }

      const data =
        (await response.json()) as NominatimResult[];

      if (
        !Array.isArray(data) ||
        data.length === 0
      ) {
        console.info(
          "[GeocodingService.descobrirDadosDaVia] SEM_RESULTADOS",
          {
            logradouro:
              endereco.logradouro,

            numero:
              endereco.numero,
          }
        );

        return null;
      }

      /**
       * Primeiro filtro:
       *
       * - precisa ter coordenadas;
       * - precisa ter address;
       * - precisa ser Brasil;
       * - nome da via precisa coincidir.
       */
      const candidatos = data.filter((item) => {
        if (
          !item.lat ||
          !item.lon ||
          !item.address
        ) {
          return false;
        }

        if (
          item.address.country_code &&
          this.normalizarTexto(
            item.address.country_code
          ) !== "BR"
        ) {
          return false;
        }

        const viaRetornada =
          item.address.road ||
          item.address.pedestrian ||
          item.address.residential ||
          "";

        if (!viaRetornada) {
          return false;
        }

        return (
          this.normalizarTexto(viaRetornada) ===
          this.normalizarTexto(
            endereco.logradouro
          )
        );
      });

      if (candidatos.length === 0) {
        console.info(
          "[GeocodingService.descobrirDadosDaVia] SEM_VIA_COMPATIVEL",
          {
            logradouro:
              endereco.logradouro,

            numero:
              endereco.numero,
          }
        );

        return null;
      }

      /**
       * Agrupamos candidatos por território.
       *
       * Uma mesma rua pode existir em várias cidades.
       *
       * Por isso NÃO podemos simplesmente utilizar
       * o primeiro resultado retornado.
       */
      const territorios =
        new Map<string, NominatimResult>();

      for (const candidato of candidatos) {
        const address =
          candidato.address!;

        const cidade =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          "";

        const cep =
          this.normalizarCep(
            address.postcode
          );

        const chave = [
          this.normalizarTexto(cidade),
          cep,
        ].join("|");

        if (!territorios.has(chave)) {
          territorios.set(
            chave,
            candidato
          );
        }
      }

      /**
       * Mais de um território possível:
       *
       * não escolhemos automaticamente.
       */
      if (territorios.size !== 1) {
        console.warn(
          "[GeocodingService.descobrirDadosDaVia] VIA_AMBIGUA",
          {
            logradouro:
              endereco.logradouro,

            numero:
              endereco.numero,

            candidatos:
              candidatos.map((item) => ({
                display_name:
                  item.display_name,

                cidade:
                  item.address?.city ||
                  item.address?.town ||
                  item.address?.village ||
                  item.address?.municipality,

                cep:
                  item.address?.postcode,

                latitude:
                  item.lat,

                longitude:
                  item.lon,
              })),
          }
        );

        return null;
      }

      const candidato =
        Array.from(
          territorios.values()
        )[0];

      if (!candidato) {
        return null;
      }

      const address =
        candidato.address!;

      const via =
        address.road ||
        address.pedestrian ||
        address.residential ||
        null;

      const bairro =
        address.neighbourhood ||
        address.suburb ||
        null;

      const cidade =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        null;

      /**
       * O Nominatim normalmente retorna
       * o nome completo do estado.
       *
       * Nosso banco trabalha com UF.
       */
      const mapaEstados: Record<
        string,
        string
      > = {
        ACRE: "AC",
        ALAGOAS: "AL",
        AMAPA: "AP",
        AMAZONAS: "AM",
        BAHIA: "BA",
        CEARA: "CE",
        "DISTRITO FEDERAL": "DF",
        "ESPIRITO SANTO": "ES",
        GOIAS: "GO",
        MARANHAO: "MA",
        "MATO GROSSO": "MT",
        "MATO GROSSO DO SUL": "MS",
        "MINAS GERAIS": "MG",
        PARA: "PA",
        PARAIBA: "PB",
        PARANA: "PR",
        PERNAMBUCO: "PE",
        PIAUI: "PI",
        "RIO DE JANEIRO": "RJ",
        "RIO GRANDE DO NORTE": "RN",
        "RIO GRANDE DO SUL": "RS",
        RONDONIA: "RO",
        RORAIMA: "RR",
        "SANTA CATARINA": "SC",
        "SAO PAULO": "SP",
        SERGIPE: "SE",
        TOCANTINS: "TO",
      };

      const estadoNormalizado =
        this.normalizarTexto(
          address.state
        );

      const uf =
        mapaEstados[
          estadoNormalizado
        ] || null;

      const cep =
        this.normalizarCep(
          address.postcode
        ) || null;

      console.info(
        "[GeocodingService.descobrirDadosDaVia] VIA_IDENTIFICADA",
        {
          logradouroSolicitado:
            endereco.logradouro,

          numeroSolicitado:
            endereco.numero,

          logradouroEncontrado:
            via,

          bairro,

          cidade,

          uf,

          cep,

          latitudeReferencia:
            candidato.lat,

          longitudeReferencia:
            candidato.lon,
        }
      );

      /**
       * IMPORTANTE:
       *
       * estas coordenadas NÃO representam
       * necessariamente o número informado.
       *
       * Portanto retornamos precision = VIA.
       */
      return {
        logradouro:
          via,

        bairro,

        cidade,

        uf,

        cep,

        latitudeReferencia:
          candidato.lat || null,

        longitudeReferencia:
          candidato.lon || null,

        provider:
          "NOMINATIM",

        precision:
          "VIA",
      };
    } catch (error) {
      console.warn(
        "[GeocodingService.descobrirDadosDaVia] Falha ao consultar via.",
        error instanceof Error
          ? error.message
          : error
      );

      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Geocodifica o endereço completo.
   *
   * DIFERENTE de descobrirDadosDaVia(),
   * este método tenta confirmar o imóvel.
   *
   * Regras:
   *
   * - resultado sem house_number não é ENDERECO;
   * - house_number diferente é rejeitado;
   * - país diferente de BR é rejeitado;
   * - CEP divergente é rejeitado quando ambos existem;
   * - cidade divergente é rejeitada quando ambas existem;
   * - falha é não fatal;
   * - quando houver postcode no candidato confirmado,
   *   o CEP é devolvido ao chamador;
   * - ao retornar null, o chamador deve preservar
   *   coordenadas obtidas anteriormente por CEP/VIA.
   */
  public async geocodificar(
    endereco: GeocodingAddressInput
  ): Promise<GeocodingResult | null> {
    const query = [
      `${endereco.logradouro}, ${endereco.numero}`,
      endereco.bairro || "",
      endereco.cidade || "",
      endereco.uf || "",
      endereco.cep || "",
      "Brasil",
    ]
      .filter(Boolean)
      .join(", ");

    const baseUrl =
      process.env.GEOCODING_NOMINATIM_URL ||
      "https://nominatim.openstreetmap.org/search";

    const params =
      new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "5",
        countrycodes: "br",
        addressdetails: "1",
      });

    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      GeocodingService.TIMEOUT_MS
    );

    try {
      const response = await fetch(
        `${baseUrl}?${params.toString()}`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            "User-Agent":
              process.env
                .GEOCODING_USER_AGENT ||
              "GranConecta/1.0 (geocoding)",
          },

          signal:
            controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          `GEOCODING_HTTP_${response.status}`
        );
      }

      const data =
        (await response.json()) as NominatimResult[];

      if (
        !Array.isArray(data) ||
        data.length === 0
      ) {
        this.logDiagnostico(
          endereco,
          "SEM_RESULTADOS",
          0
        );

        return null;
      }

      let ultimoDiagnostico:
        | GeocodingValidation
        | null = null;

      for (const resultado of data) {
        const validacao =
          this.validarResultado(
            resultado,
            endereco
          );

        if (validacao.valido) {
          this.logDiagnostico(
            endereco,
            "ENDERECO_CONFIRMADO",
            data.length,
            validacao
          );

          /**
           * O CEP precisa vir exatamente
           * do candidato que passou pela validação.
           */
          const cepRetornado =
            this.normalizarCep(
              resultado.address?.postcode
            );

          return {
            latitude:
              resultado.lat!,

            longitude:
              resultado.lon!,

            cep:
              cepRetornado || null,

            provider:
              "NOMINATIM",
          };
        }

        ultimoDiagnostico =
          validacao;
      }

      if (ultimoDiagnostico) {
        this.logDiagnostico(
          endereco,
          ultimoDiagnostico.motivo,
          data.length,
          ultimoDiagnostico
        );
      }

      return null;
    } catch (error) {
      console.warn(
        "[GeocodingService] Não foi possível confirmar o endereço completo.",
        error instanceof Error
          ? error.message
          : error
      );

      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
  /**
   * Fallback aproximado por CEP, sem afirmar a posição do imóvel.
   * BrasilAPI CEP v2 pode retornar coordenadas; nem todos os CEPs possuem.
   */
  public async geocodificarPorCep(endereco: {
    cep?: string | null;
    cidade?: string | null;
    uf?: string | null;
  }): Promise<{ latitude: string; longitude: string; precision: "CEP"; provider: "BRASILAPI" } | null> {
    const cep = this.normalizarCep(endereco.cep);
    if (cep.length !== 8) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GeocodingService.TIMEOUT_MS);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) {
        console.info("[GeocodingService.CEP] Consulta indisponível", { cep, status: response.status });
        return null;
      }
      const data = (await response.json()) as {
        cep?: string;
        city?: string;
        state?: string;
        location?: { coordinates?: { latitude?: string | number; longitude?: string | number } };
      };
      const cepCompativel = this.normalizarCep(data.cep) === cep;
      const cidadeCompativel = !endereco.cidade?.trim() || this.normalizarTexto(data.city) === this.normalizarTexto(endereco.cidade);
      const ufCompativel = !endereco.uf?.trim() || this.normalizarTexto(data.state) === this.normalizarTexto(endereco.uf);
      if (!cepCompativel || !cidadeCompativel || !ufCompativel) {
        console.warn("[GeocodingService.CEP] Território divergente", { cep, cepCompativel, cidadeCompativel, ufCompativel });
        return null;
      }
      const latitude = Number(data.location?.coordinates?.latitude);
      const longitude = Number(data.location?.coordinates?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
          latitude === 0 || longitude === 0 ||
          latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        console.info("[GeocodingService.CEP] Sem coordenadas utilizáveis", { cep });
        return null;
      }
      console.info("[GeocodingService.CEP] Localização aproximada encontrada", { cep });
      return { latitude: String(latitude), longitude: String(longitude), precision: "CEP", provider: "BRASILAPI" };
    } catch (error) {
      console.warn("[GeocodingService.CEP] Falha na consulta", error instanceof Error ? error.message : error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

}

export default new GeocodingService();