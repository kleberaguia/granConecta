import fs from "fs";
import path from "path";

type LayoutBase = {
  id: string;
  name: string;
  pageKind: "servico" | "loja";
  segmentFamily: string;

  selectionHints?: {
    keywords?: string[];
    businessTypes?: string[];
  };

  [key: string]: any;
};

export class LayoutBaseService {
  private static getServiceFolder(): string {
    return path.resolve(
      process.cwd(),
      "dist",
      "services",
      "jsons",
      "layout-bases",
      "servico",
    );
  }

  /**
   * Normaliza textos para comparação:
   * - remove acentos
   * - transforma em minúsculo
   * - remove espaços extras
   */
  private static normalize(value?: string | null): string {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Permite encontrar variações como:
   *
   * psicopedagogia
   * psicopedagoga
   * psicopedagogo
   * psicopedagógica
   *
   * sem precisar cadastrar cada palavra individualmente.
   */
  private static matchesKeyword(
    text: string,
    keyword: string,
  ): boolean {
    const normalizedText = this.normalize(text);
    const normalizedKeyword = this.normalize(keyword);

    if (!normalizedText || !normalizedKeyword) {
      return false;
    }

    /**
     * 1. Comparação direta.
     *
     * Exemplo:
     * texto contém "psicopedagogia"
     */
    if (normalizedText.includes(normalizedKeyword)) {
      return true;
    }

    /**
     * 2. Radicais conhecidos.
     *
     * Isso evita depender de flexões específicas.
     */
    const roots: Record<string, string[]> = {
      // =========================
      // SAÚDE / BEM-ESTAR
      // =========================
      psicopedagogia: ["psicopedagog"],
      psicopedagogo: ["psicopedagog"],
      psicopedagoga: ["psicopedagog"],

      psicologia: ["psicolog"],
      psicologo: ["psicolog"],
      psicologa: ["psicolog"],

      terapia: ["terap", "terapeut"],
      terapeuta: ["terap", "terapeut"],

      fonoaudiologia: ["fonoaudiolog"],
      fonoaudiologo: ["fonoaudiolog"],
      fonoaudiologa: ["fonoaudiolog"],

      fisioterapia: ["fisioterap"],
      fisioterapeuta: ["fisioterap"],

      nutricao: ["nutric"],
      nutricionista: ["nutric"],

      pedagogia: ["pedagog"],
      pedagogo: ["pedagog"],
      pedagoga: ["pedagog"],

      // =========================
      // BELEZA / ESTÉTICA
      // =========================
      estetica: ["estetic"],
      esteticista: ["estetic"],

      beleza: ["beleza"],

      manicure: ["manicur"],
      pedicure: ["pedicur"],

      cabeleireiro: ["cabeleir"],
      cabeleireira: ["cabeleir"],

      maquiagem: ["maquiag"],
      maquiador: ["maquiag"],
      maquiadora: ["maquiag"],

      sobrancelha: ["sobrancelh"],

      depilacao: ["depil"],

      // =========================
      // OBRAS / REFORMAS
      // =========================
      construcao: ["construc"],
      construtor: ["construt"],

      reforma: ["reform"],

      marcenaria: ["marcen"],
      marceneiro: ["marcen"],

      pintura: ["pintur"],
      pintor: ["pintor"],

      eletrica: ["eletric"],
      eletricista: ["eletric"],

      hidraulica: ["hidraul"],
      encanador: ["encan"],

      pedreiro: ["pedreir"],

      instalacao: ["instal"],
      instalador: ["instal"],
    };

    const keywordRoots =
      roots[normalizedKeyword] || [];

    if (
      keywordRoots.some((root) =>
        normalizedText.includes(root),
      )
    ) {
      return true;
    }

    /**
     * 3. Fallback por radical automático para palavras maiores.
     *
     * Exemplo:
     *
     * keyword:
     * psicopedagogia
     *
     * radical:
     * psicopedagog
     *
     * encontra:
     * psicopedagoga
     */
    if (normalizedKeyword.length >= 8) {
      const automaticRoot =
        normalizedKeyword.slice(
          0,
          Math.max(6, normalizedKeyword.length - 2),
        );

      if (
        automaticRoot.length >= 6 &&
        normalizedText.includes(automaticRoot)
      ) {
        return true;
      }
    }

    return false;
  }

  static loadServiceBases(): LayoutBase[] {
    const folder = this.getServiceFolder();

    if (!fs.existsSync(folder)) {
      console.warn(
        "[LayoutBaseService] Pasta não encontrada:",
        folder,
      );

      return [];
    }

    const files = fs
      .readdirSync(folder)
      .filter((file) =>
        file.toLowerCase().endsWith(".json"),
      );

    const bases: LayoutBase[] = [];

    for (const file of files) {
      try {
        const fullPath = path.join(folder, file);

        const raw = fs.readFileSync(
          fullPath,
          "utf-8",
        );

        const parsed = JSON.parse(
          raw,
        ) as LayoutBase;

        if (!parsed?.id) {
          console.warn(
            "[LayoutBaseService] JSON ignorado por não possuir id:",
            file,
          );

          continue;
        }

        /**
         * Segurança adicional:
         * aqui queremos somente layouts de serviço.
         */
        if (
          parsed.pageKind &&
          parsed.pageKind !== "servico"
        ) {
          continue;
        }

        bases.push(parsed);
      } catch (error) {
        console.error(
          "[LayoutBaseService] Erro ao carregar:",
          file,
          error,
        );
      }
    }

    return bases;
  }

  static findById(
    id: string,
  ): LayoutBase | null {
    const key = String(id || "")
      .trim()
      .toUpperCase();

    if (!key) {
      return null;
    }

    return (
      this.loadServiceBases().find(
        (base) =>
          String(base.id || "").toUpperCase() ===
          key,
      ) || null
    );
  }

  static resolveServiceBase(input: {
    categoryName?: string;
    businessSegment?: string;
    businessType?: string;
    descricao?: string;
  }): LayoutBase | null {
    const bases = this.loadServiceBases();

    if (!bases.length) {
      return null;
    }

    /**
     * Criamos um único texto de pesquisa usando tudo
     * o que o Gerador conseguiu descobrir.
     */
    const searchable = this.normalize(
      [
        input.categoryName,
        input.businessSegment,
        input.businessType,
        input.descricao,
      ]
        .filter(Boolean)
        .join(" "),
    );

    if (!searchable) {
      console.warn(
        "[LayoutBaseService] Nenhuma informação disponível para selecionar layout.",
      );

      return null;
    }

    let bestBase: LayoutBase | null = null;
    let bestScore = 0;

    const scoreDetails: Array<{
      id: string;
      name: string;
      score: number;
      matchedKeywords: string[];
    }> = [];

    for (const base of bases) {
      const keywords =
        base.selectionHints?.keywords || [];

      const matchedKeywords: string[] = [];

      let score = 0;

      /**
       * Keywords têm peso maior.
       */
      for (const keyword of keywords) {
        if (
          this.matchesKeyword(
            searchable,
            keyword,
          )
        ) {
          score += 10;

          matchedKeywords.push(keyword);
        }
      }

      /**
       * BusinessType serve apenas como sinal complementar.
       *
       * Não pode sozinho decidir Saúde x Beleza x Construção,
       * pois normalmente ele virá como "servico".
       */
      const businessTypes =
        base.selectionHints?.businessTypes || [];

      if (
        input.businessType &&
        businessTypes.some(
          (type) =>
            this.normalize(type) ===
            this.normalize(input.businessType),
        )
      ) {
        score += 2;
      }

      scoreDetails.push({
        id: base.id,
        name: base.name,
        score,
        matchedKeywords,
      });

      if (score > bestScore) {
        bestScore = score;
        bestBase = base;
      }
    }

    console.log(
      "[LayoutBaseService] Resultado da análise:",
      {
        searchable,
        bases: scoreDetails,
        selected:
          bestScore > 0 && bestBase
            ? {
                id: bestBase.id,
                name: bestBase.name,
                segmentFamily:
                  bestBase.segmentFamily,
                score: bestScore,
              }
            : null,
      },
    );

    return bestScore > 0
      ? bestBase
      : null;
  }
}