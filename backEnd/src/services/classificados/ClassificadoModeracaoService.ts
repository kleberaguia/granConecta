export type ClassificadoDestinoModeracao =
  | "EMPREENDEDOR"
  | "PRESTADOR"
  | null;

export type ClassificadoClassificacaoModeracao =
  | "VENDA_OCASIONAL"
  | "ATIVIDADE_COMERCIAL"
  | "PRESTACAO_SERVICO"
  | "CONTEUDO_SUSPEITO";

export type ClassificadoMotivoModeracao =
  | "WHATSAPP_INFORMADO"
  | "TELEFONE_INFORMADO"
  | "CONTATO_DIRETO"
  | "ENCOMENDAS"
  | "PEDIDOS"
  | "ORCAMENTO"
  | "PRESTACAO_SERVICO"
  | "ATIVIDADE_RECORRENTE"
  | "PRODUCAO_COMERCIAL"
  | "DIVULGACAO_COMERCIAL"
  | "REDE_SOCIAL_COMERCIAL"
  | "MULTIPLOS_SINAIS_COMERCIAIS";

export type ClassificadoModeracaoInput = {
  titulo: string;
  descricao: string;

  /**
   * Quantidade de classificados criados pelo
   * usuário dentro da janela que definirmos
   * posteriormente (ex.: últimos 30 dias).
   *
   * Não bloqueia sozinho.
   */
  quantidadeAnunciosRecentes?: number;
};

export type ClassificadoModeracaoResultado = {
  permitido: boolean;

  classificacao:
    ClassificadoClassificacaoModeracao;

  destino:
    ClassificadoDestinoModeracao;

  motivos:
    ClassificadoMotivoModeracao[];

  scoreComercial: number;

  mensagem: string;
};

/**
 * Sinal encontrado durante a análise.
 */
type SinalModeracao = {
  motivo:
    ClassificadoMotivoModeracao;

  peso: number;

  destino?:
    Exclude<
      ClassificadoDestinoModeracao,
      null
    >;
};

/**
 * ============================================================
 * CLASSIFICADO MODERAÇÃO SERVICE
 * ============================================================
 *
 * Objetivo:
 *
 * Separar:
 *
 * 1. venda ocasional de um bem pessoal;
 * 2. atividade comercial;
 * 3. prestação de serviço.
 *
 * IMPORTANTE:
 *
 * A recorrência isoladamente NÃO bloqueia o usuário.
 *
 * Exemplo:
 *
 * "Estou vendendo meu notebook porque comprei outro."
 *
 * deve continuar sendo permitido mesmo que o morador
 * tenha vendido outro objeto recentemente.
 */
export class ClassificadoModeracaoService {
  /**
   * Score a partir do qual entendemos que existem
   * sinais suficientemente fortes de atividade
   * comercial.
   */
  private readonly SCORE_BLOQUEIO = 5;

  /**
   * ==========================================================
   * NORMALIZAÇÃO
   * ==========================================================
   */

  private normalizarTexto(
    valor: unknown
  ): string {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * ==========================================================
   * TELEFONE / WHATSAPP
   * ==========================================================
   */

  private detectarTelefone(
    texto: string
  ): boolean {
    /**
     * Exemplos:
     *
     * 11999998888
     * 11 99999-8888
     * (11) 99999-8888
     * +55 11 99999-8888
     */
    const regex =
      /(?:\+?55\s*)?(?:\(?\d{2}\)?[\s.-]*)?(?:9?\d{4})[\s.-]?\d{4}/;

    return regex.test(texto);
  }

  /**
   * ==========================================================
   * EXPRESSÕES
   * ==========================================================
   */

  private contemAlgumaExpressao(
    texto: string,
    expressoes: string[]
  ): boolean {
    return expressoes.some(
      (expressao) =>
        texto.includes(
          this.normalizarTexto(
            expressao
          )
        )
    );
  }

  /**
   * ==========================================================
   * DETECÇÃO DOS SINAIS
   * ==========================================================
   */

  private detectarSinais(
    titulo: string,
    descricao: string,
    quantidadeAnunciosRecentes: number
  ): SinalModeracao[] {
    const texto =
      this.normalizarTexto(
        `${titulo} ${descricao}`
      );

    const sinais:
      SinalModeracao[] = [];

    /**
     * --------------------------------------------------------
     * WHATSAPP
     * --------------------------------------------------------
     */

    if (
      this.contemAlgumaExpressao(
        texto,
        [
          "whatsapp",
          "whats app",
          "chama no whats",
          "chamar no whats",
          "me chama no whats",
          "falar no whats",
        ]
      )
    ) {
      sinais.push({
        motivo:
          "WHATSAPP_INFORMADO",

        peso: 2,
      });
    }

    /**
     * --------------------------------------------------------
     * TELEFONE
     * --------------------------------------------------------
     */

    if (
      this.detectarTelefone(
        texto
      )
    ) {
      sinais.push({
        motivo:
          "TELEFONE_INFORMADO",

        peso: 2,
      });
    }

    /**
     * --------------------------------------------------------
     * CONTATO DIRETO
     * --------------------------------------------------------
     */

    if (
      this.contemAlgumaExpressao(
        texto,
        [
          "ligue para",
          "liga para",
          "entre em contato",
          "fale comigo",
          "chame no privado",
          "chama no privado",
          "me chama",
          "chamar no privado",
        ]
      )
    ) {
      sinais.push({
        motivo:
          "CONTATO_DIRETO",

        peso: 1,
      });
    }

    /**
     * --------------------------------------------------------
     * ENCOMENDAS
     * --------------------------------------------------------
     */

    if (
      this.contemAlgumaExpressao(
        texto,
        [
          "aceito encomendas",
          "aceitamos encomendas",
          "faco encomendas",
          "fazemos encomendas",
          "sob encomenda",
          "encomendas abertas",
          "encomende",
          "encomenda pelo",
        ]
      )
    ) {
      sinais.push({
        motivo:
          "ENCOMENDAS",

        peso: 4,

        destino:
          "EMPREENDEDOR",
      });
    }

    /**
     * --------------------------------------------------------
     * PEDIDOS
     * --------------------------------------------------------
     */

    if (
      this.contemAlgumaExpressao(
        texto,
        [
          "faca seu pedido",
          "faça seu pedido",
          "pedidos pelo",
          "aceito pedidos",
          "aceitamos pedidos",
          "pedidos abertos",
          "peca agora",
          "peça agora",
        ]
      )
    ) {
      sinais.push({
        motivo:
          "PEDIDOS",

        peso: 4,

        destino:
          "EMPREENDEDOR",
      });
    }

    /**
     * --------------------------------------------------------
     * PRODUÇÃO / VENDA COMERCIAL
     * --------------------------------------------------------
     */

    if (
      this.contemAlgumaExpressao(
        texto,
        [
          "vendo salgados",
          "vendo doces",
          "vendo bolos",
          "vendo marmitas",
          "vendo trufas",
          "vendo brigadeiros",
          "vendo roupas",
          "vendo semijoias",
          "vendo semi joias",
          "vendo produtos",
          "temos pronta entrega",
          "pronta entrega",
          "fabricacao propria",
          "produção própria",
          "producao propria",
        ]
      )
    ) {
      sinais.push({
        motivo:
          "PRODUCAO_COMERCIAL",

        peso: 5,

        destino:
          "EMPREENDEDOR",
      });
    }

    /**
     * --------------------------------------------------------
     * SERVIÇOS
     * --------------------------------------------------------
     */

    if (
      this.contemAlgumaExpressao(
        texto,
        [
          "presto servico",
          "presto serviço",
          "prestamos servico",
          "prestamos serviço",
          "faco instalacao",
          "faço instalação",
          "fazemos instalacao",
          "fazemos instalação",
          "faco manutencao",
          "faço manutenção",
          "servicos eletricos",
          "serviços elétricos",
          "servico de eletricista",
          "serviço de eletricista",
          "servico de encanador",
          "serviço de encanador",
          "servico de pedreiro",
          "serviço de pedreiro",
          "servico de limpeza",
          "serviço de limpeza",
          "atendimento domiciliar",
          "atendo em domicilio",
          "atendo em domicílio",
        ]
      )
    ) {
      sinais.push({
        motivo:
          "PRESTACAO_SERVICO",

        peso: 6,

        destino:
          "PRESTADOR",
      });
    }

    /**
     * --------------------------------------------------------
     * ORÇAMENTO
     * --------------------------------------------------------
     */

    if (
      this.contemAlgumaExpressao(
        texto,
        [
          "faca seu orcamento",
          "faça seu orçamento",
          "orcamento sem compromisso",
          "orçamento sem compromisso",
          "solicite seu orcamento",
          "solicite seu orçamento",
          "peca seu orcamento",
          "peça seu orçamento",
        ]
      )
    ) {
      sinais.push({
        motivo:
          "ORCAMENTO",

        peso: 4,

        destino:
          "PRESTADOR",
      });
    }

    /**
     * --------------------------------------------------------
     * DIVULGAÇÃO
     * --------------------------------------------------------
     */

    if (
      this.contemAlgumaExpressao(
        texto,
        [
          "divulgo meu trabalho",
          "conheca meu trabalho",
          "conheça meu trabalho",
          "divulgando meu trabalho",
          "meu negocio",
          "meu negócio",
          "minha loja",
          "nossa loja",
        ]
      )
    ) {
      sinais.push({
        motivo:
          "DIVULGACAO_COMERCIAL",

        peso: 4,

        destino:
          "EMPREENDEDOR",
      });
    }

    /**
     * --------------------------------------------------------
     * REDES SOCIAIS
     * --------------------------------------------------------
     */

    if (
      this.contemAlgumaExpressao(
        texto,
        [
          "instagram.com/",
          "facebook.com/",
          "tiktok.com/",
          "siga no instagram",
          "siga nosso instagram",
          "nosso instagram",
          "minha loja no instagram",
        ]
      )
    ) {
      sinais.push({
        motivo:
          "REDE_SOCIAL_COMERCIAL",

        peso: 2,

        destino:
          "EMPREENDEDOR",
      });
    }

    /**
     * --------------------------------------------------------
     * RECORRÊNCIA
     * --------------------------------------------------------
     *
     * Importante:
     *
     * não bloqueia isoladamente.
     *
     * Serve apenas como agravante quando existem
     * outros sinais comerciais.
     */

    if (
      quantidadeAnunciosRecentes >=
      2
    ) {
      sinais.push({
        motivo:
          "ATIVIDADE_RECORRENTE",

        peso: 1,
      });
    }

    return sinais;
  }

  /**
   * ==========================================================
   * DESTINO
   * ==========================================================
   */

  private resolverDestino(
    sinais: SinalModeracao[]
  ): ClassificadoDestinoModeracao {
    const prestador =
      sinais.filter(
        (sinal) =>
          sinal.destino ===
          "PRESTADOR"
      );

    const empreendedor =
      sinais.filter(
        (sinal) =>
          sinal.destino ===
          "EMPREENDEDOR"
      );

    const scorePrestador =
      prestador.reduce(
        (total, sinal) =>
          total + sinal.peso,
        0
      );

    const scoreEmpreendedor =
      empreendedor.reduce(
        (total, sinal) =>
          total + sinal.peso,
        0
      );

    if (
      scorePrestador === 0 &&
      scoreEmpreendedor === 0
    ) {
      return null;
    }

    if (
      scorePrestador >
      scoreEmpreendedor
    ) {
      return "PRESTADOR";
    }

    return "EMPREENDEDOR";
  }

  /**
   * ==========================================================
   * ANÁLISE
   * ==========================================================
   */

  public analisar(
    input: ClassificadoModeracaoInput
  ): ClassificadoModeracaoResultado {
    const titulo =
      String(
        input.titulo ?? ""
      ).trim();

    const descricao =
      String(
        input.descricao ?? ""
      ).trim();

    const quantidadeAnunciosRecentes =
      Math.max(
        0,
        Number(
          input.quantidadeAnunciosRecentes ??
            0
        ) || 0
      );

    const sinais =
      this.detectarSinais(
        titulo,
        descricao,
        quantidadeAnunciosRecentes
      );

    const scoreComercial =
      sinais.reduce(
        (total, sinal) =>
          total + sinal.peso,
        0
      );

    const destino =
      this.resolverDestino(
        sinais
      );

    /**
     * Serviço é um sinal forte o suficiente
     * para bloquear diretamente.
     */
    const possuiPrestacaoServico =
      sinais.some(
        (sinal) =>
          sinal.motivo ===
          "PRESTACAO_SERVICO"
      );

    /**
     * Produção comercial explícita também.
     */
    const possuiProducaoComercial =
      sinais.some(
        (sinal) =>
          sinal.motivo ===
          "PRODUCAO_COMERCIAL"
      );

    const bloqueado =
      possuiPrestacaoServico ||
      possuiProducaoComercial ||
      scoreComercial >=
        this.SCORE_BLOQUEIO;

    /**
     * --------------------------------------------------------
     * VENDA OCASIONAL
     * --------------------------------------------------------
     */

    if (!bloqueado) {
      return {
        permitido: true,

        classificacao:
          "VENDA_OCASIONAL",

        destino: null,

        motivos:
          sinais.map(
            (sinal) =>
              sinal.motivo
          ),

        scoreComercial,

        mensagem:
          "O anúncio pode seguir como classificado.",
      };
    }

    /**
     * --------------------------------------------------------
     * PRESTAÇÃO DE SERVIÇO
     * --------------------------------------------------------
     */

    if (
      destino === "PRESTADOR"
    ) {
      return {
        permitido: false,

        classificacao:
          "PRESTACAO_SERVICO",

        destino:
          "PRESTADOR",

        motivos:
          sinais.map(
            (sinal) =>
              sinal.motivo
          ),

        scoreComercial,

        mensagem:
          "Este conteúdo apresenta características de prestação de serviço. Para divulgar serviços no GranConecta, utilize um perfil de prestador.",
      };
    }

    /**
     * --------------------------------------------------------
     * ATIVIDADE COMERCIAL
     * --------------------------------------------------------
     */

    if (
      destino === "EMPREENDEDOR"
    ) {
      return {
        permitido: false,

        classificacao:
          "ATIVIDADE_COMERCIAL",

        destino:
          "EMPREENDEDOR",

        motivos:
          sinais.map(
            (sinal) =>
              sinal.motivo
          ),

        scoreComercial,

        mensagem:
          "Este conteúdo apresenta características de atividade comercial. Para divulgar produtos ou vendas recorrentes no GranConecta, utilize um perfil de empreendedor.",
      };
    }

    /**
     * --------------------------------------------------------
     * SINAIS COMERCIAIS SEM DESTINO CLARO
     * --------------------------------------------------------
     */

    return {
      permitido: false,

      classificacao:
        "CONTEUDO_SUSPEITO",

      destino: null,

      motivos: [
        ...sinais.map(
          (sinal) =>
            sinal.motivo
        ),

        "MULTIPLOS_SINAIS_COMERCIAIS",
      ],

      scoreComercial,

      mensagem:
        "O anúncio apresenta características comerciais e precisa ser revisado antes de ser publicado.",
    };
  }
}

export default new ClassificadoModeracaoService();