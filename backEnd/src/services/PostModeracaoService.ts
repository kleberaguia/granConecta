type PostModeracaoTipo =
  | "COMUNITARIO"
  | "VENDA_OCASIONAL"
  | "ATIVIDADE_COMERCIAL"
  | "PRESTACAO_SERVICO"
  | "CONTEUDO_IMPROPRIO"
  | "INDETERMINADO";

export type PostModeracaoResultado = {
  tipo: PostModeracaoTipo;
  permitidoNoMural: boolean;
  motivo: string;
  destino:
    | "MURAL"
    | "CLASSIFICADOS"
    | "EMPREENDEDOR"
    | "PRESTADOR"
    | "BLOQUEADO"
    | "ANALISE";
};

type ModerarPostInput = {
  titulo?: string | null;
  descricao?: string | null;
  categoria?: string | null;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type RespostaIA = {
  classificacao?: string;
  motivo?: string;
};

export class PostModeracaoService {
  /**
   * Faz a triagem de um novo conteúdo antes de ele entrar no Mural.
   *
   * IMPORTANTE:
   * O Mural deve ser usado para comunicação comunitária.
   *
   * Venda ocasional de objeto -> Classificados
   * Comércio recorrente -> Empreendedor
   * Prestação de serviço -> Prestador
   * Conteúdo impróprio -> Bloqueado
   */
  async analisar(input: ModerarPostInput): Promise<PostModeracaoResultado> {
    const titulo = String(input.titulo ?? "").trim();
    const descricao = String(input.descricao ?? "").trim();
    const categoria = String(input.categoria ?? "").trim();

    const textoCompleto = [titulo, descricao]
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!textoCompleto) {
      return {
        tipo: "INDETERMINADO",
        permitidoNoMural: false,
        motivo: "Não há conteúdo suficiente para analisar o post.",
        destino: "ANALISE",
      };
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error(
        "[POST MODERACAO] OPENROUTER_API_KEY não configurada."
      );

      return {
        tipo: "INDETERMINADO",
        permitidoNoMural: false,
        motivo:
          "Não foi possível analisar o conteúdo automaticamente.",
        destino: "ANALISE",
      };
    }

    try {
      const resultado = await this.analisarComIA({
        titulo,
        descricao,
        categoria,
        apiKey,
      });

      console.log("[POST MODERACAO] Resultado:", {
        titulo,
        categoria,
        resultado,
      });

      return resultado;
    } catch (error) {
      console.error(
        "[POST MODERACAO] Erro ao analisar post:",
        error
      );

      /**
       * Fail closed:
       *
       * Se a IA estiver indisponível, NÃO publicamos automaticamente
       * conteúdo que ainda não foi moderado.
       */
      return {
        tipo: "INDETERMINADO",
        permitidoNoMural: false,
        motivo:
          "A análise automática está temporariamente indisponível.",
        destino: "ANALISE",
      };
    }
  }

  private async analisarComIA(input: {
    titulo: string;
    descricao: string;
    categoria: string;
    apiKey: string;
  }): Promise<PostModeracaoResultado> {
    const model =
      process.env.POST_MODERATION_MODEL ||
      process.env.CLASSIFICADO_VISION_MODEL ||
      "openai/gpt-4o-mini";

    const prompt = `
Você é o sistema de moderação do Mural comunitário da plataforma GranConecta.

O GranConecta conecta moradores de condomínios.

Sua tarefa é analisar um NOVO POST antes da publicação no Mural.

O MURAL é destinado principalmente à comunicação entre moradores e assuntos
comunitários.

Você deve classificar o conteúdo em EXATAMENTE UMA destas categorias:

COMUNITARIO
VENDA_OCASIONAL
ATIVIDADE_COMERCIAL
PRESTACAO_SERVICO
CONTEUDO_IMPROPRIO
INDETERMINADO


==================================================
1. COMUNITARIO
==================================================

Use COMUNITARIO quando o conteúdo for uma comunicação normal entre moradores.

Exemplos:

- avisos;
- perguntas aos vizinhos;
- objetos encontrados ou perdidos;
- eventos comunitários;
- pedidos de indicação;
- comunicação sobre o condomínio;
- pedido de ajuda;
- empréstimo de objetos;
- doações;
- assuntos de convivência;
- perguntas sobre onde comprar algo;
- perguntas sobre quem vende determinado produto;
- perguntas sobre profissionais.

Exemplos:

"Alguém conhece um eletricista?"

"Alguém está vendendo um berço?"

"Encontrei uma chave perto da piscina."

"Alguém tem uma furadeira para emprestar?"

"Vai ter reunião do condomínio hoje?"

IMPORTANTE:

Perguntar se alguém vende algo NÃO significa que o autor esteja vendendo.


==================================================
2. VENDA_OCASIONAL
==================================================

Use VENDA_OCASIONAL quando um morador estiver vendendo um bem próprio,
usado, seminovo ou eventualmente novo, de maneira ocasional.

Esses conteúdos devem ir para CLASSIFICADOS.

Exemplos:

"Vendo meu sofá usado por R$ 500."

"Estou vendendo meu iPhone."

"Vendo bicicleta infantil que meu filho não usa mais."

"Tenho uma mesa usada para vender."

Não classifique automaticamente como atividade comercial apenas porque
existem as palavras "vendo", "venda", "preço" ou um valor em reais.

Analise o contexto.


==================================================
3. ATIVIDADE_COMERCIAL
==================================================

Use ATIVIDADE_COMERCIAL quando o autor estiver oferecendo produtos como
atividade comercial, empreendimento, produção recorrente ou negócio.

Exemplos:

"Vendo coxinhas. Faça sua encomenda."

"Temos bolos por encomenda."

"Hoje temos marmitas, peça a sua."

"Faço doces para festas."

"Temos semijoias disponíveis."

"Cardápio de hoje..."

"Faça seu pedido pelo WhatsApp."

"Encomendas abertas."

Também são sinais comerciais, quando aparecem dentro de um contexto
de oferta de produtos:

- encomendas;
- cardápio;
- entregas;
- estoque;
- catálogo;
- pedidos;
- produção;
- vários produtos;
- promoção;
- atendimento comercial;
- chamada para comprar;
- telefone ou WhatsApp para realizar pedidos.

ATENÇÃO:

Telefone ou WhatsApp SOZINHOS não tornam uma mensagem comercial.

O contexto precisa demonstrar oferta comercial.


==================================================
4. PRESTACAO_SERVICO
==================================================

Use PRESTACAO_SERVICO quando o autor estiver oferecendo seu próprio
trabalho ou serviço profissional.

Exemplos:

"Faço instalação elétrica."

"Sou manicure e tenho horários disponíveis."

"Faço limpeza de apartamentos."

"Pedreiro disponível para reformas."

"Faço manutenção de ar-condicionado."

"Atendimento psicopedagógico com horário disponível."

Um morador PEDINDO indicação de profissional é COMUNITARIO.

Exemplo:

"Alguém conhece uma manicure?"

é COMUNITARIO e não PRESTACAO_SERVICO.


==================================================
5. CONTEUDO_IMPROPRIO
==================================================

Use CONTEUDO_IMPROPRIO quando houver conteúdo claramente incompatível
com o ambiente comunitário ou potencialmente ilegal/perigoso, incluindo
quando aplicável:

- ameaças;
- violência explícita;
- assédio grave;
- conteúdo sexual explícito;
- discurso de ódio;
- tentativa clara de fraude;
- comercialização claramente ilegal;
- conteúdo explicitamente criminoso.

Não use esta classificação apenas porque existe uma venda.


==================================================
6. INDETERMINADO
==================================================

Use INDETERMINADO somente quando realmente não houver contexto suficiente
para decidir com segurança.


==================================================
REGRAS IMPORTANTES
==================================================

Analise a intenção da mensagem, não apenas palavras isoladas.

NÃO bloqueie uma pergunta comunitária porque contém palavras como:

"vende"
"comprar"
"WhatsApp"
"telefone"
"preço"
"serviço"

Diferencie:

"Alguém vende coxinha aqui no condomínio?"
=> COMUNITARIO

de:

"Vendo coxinha, faça seu pedido pelo WhatsApp."
=> ATIVIDADE_COMERCIAL


Diferencie:

"Alguém conhece eletricista?"
=> COMUNITARIO

de:

"Sou eletricista, faço instalações. Chame no WhatsApp."
=> PRESTACAO_SERVICO


Diferencie:

"Vendo meu sofá usado."
=> VENDA_OCASIONAL

de:

"Temos sofás novos, vários modelos, consulte nosso catálogo."
=> ATIVIDADE_COMERCIAL


==================================================
POST A SER ANALISADO
==================================================

Categoria informada:
${input.categoria || "NÃO INFORMADA"}

Título:
${input.titulo || "NÃO INFORMADO"}

Descrição:
${input.descricao || "NÃO INFORMADA"}


==================================================
RESPOSTA
==================================================

Responda SOMENTE JSON válido.

Não use markdown.
Não use bloco de código.
Não escreva nenhum texto antes ou depois.

Formato:

{
  "classificacao": "COMUNITARIO",
  "motivo": "Explicação curta e objetiva."
}
`.trim();

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model,

          temperature: 0,

          messages: [
            {
              role: "system",
              content:
                "Você é um classificador de conteúdo. Responda exclusivamente JSON válido.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `OPENROUTER_HTTP_${response.status}: ${body.slice(0, 500)}`
      );
    }

    const data =
      (await response.json()) as OpenRouterResponse;

    const content =
      data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("OPENROUTER_RESPOSTA_VAZIA");
    }

    const parsed = this.parseResposta(content);

    return this.normalizarResultado(parsed);
  }

  private parseResposta(content: string): RespostaIA {
    /**
     * Embora o prompt peça JSON puro, alguns modelos eventualmente
     * devolvem ```json ... ```. Removemos somente essa embalagem.
     */
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned) as RespostaIA;
    } catch {
      console.error(
        "[POST MODERACAO] Resposta inválida da IA:",
        content
      );

      throw new Error("POST_MODERACAO_JSON_INVALIDO");
    }
  }

  private normalizarResultado(
    resposta: RespostaIA
  ): PostModeracaoResultado {
    const classificacao = String(
      resposta.classificacao ?? ""
    )
      .trim()
      .toUpperCase();

    const motivo =
      String(resposta.motivo ?? "").trim() ||
      "Conteúdo analisado automaticamente.";

    switch (classificacao) {
      case "COMUNITARIO":
        return {
          tipo: "COMUNITARIO",
          permitidoNoMural: true,
          motivo,
          destino: "MURAL",
        };

      case "VENDA_OCASIONAL":
        return {
          tipo: "VENDA_OCASIONAL",
          permitidoNoMural: false,
          motivo,
          destino: "CLASSIFICADOS",
        };

      case "ATIVIDADE_COMERCIAL":
        return {
          tipo: "ATIVIDADE_COMERCIAL",
          permitidoNoMural: false,
          motivo,
          destino: "EMPREENDEDOR",
        };

      case "PRESTACAO_SERVICO":
        return {
          tipo: "PRESTACAO_SERVICO",
          permitidoNoMural: false,
          motivo,
          destino: "PRESTADOR",
        };

      case "CONTEUDO_IMPROPRIO":
        return {
          tipo: "CONTEUDO_IMPROPRIO",
          permitidoNoMural: false,
          motivo,
          destino: "BLOQUEADO",
        };

      case "INDETERMINADO":
      default:
        return {
          tipo: "INDETERMINADO",
          permitidoNoMural: false,
          motivo:
            classificacao && classificacao !== "INDETERMINADO"
              ? `Classificação não reconhecida pela moderação: ${classificacao}.`
              : motivo,
          destino: "ANALISE",
        };
    }
  }
}

export default PostModeracaoService;