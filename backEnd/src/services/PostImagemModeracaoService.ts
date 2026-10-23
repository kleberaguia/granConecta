import fs from "node:fs/promises";
import path from "node:path";

export type PostImagemModeracaoTipo =
  | "FOTO_COMUNITARIA"
  | "VENDA_OCASIONAL"
  | "ATIVIDADE_COMERCIAL"
  | "PRESTACAO_SERVICO"
  | "CONTEUDO_IMPROPRIO"
  | "INDETERMINADO";

export type PostImagemModeracaoResultado = {
  tipo: PostImagemModeracaoTipo;
  permitidoNoMural: boolean;
  motivo: string;
  destino:
  | "MURAL"
  | "CLASSIFICADOS"
  | "EMPREENDEDOR"
  | "PRESTADOR"
  | "BLOQUEADO"
  | "ANALISE";
  arquivo?: string;
};

type RespostaIA = {
  classificacao?: string;
  motivo?: string;
};

type PostImagemContexto = {
  titulo?: string;
  descricao?: string;
  categoria?: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export class PostImagemModeracaoService {
  async analisarArquivos(
    files: Express.Multer.File[] | undefined,
    contexto?: PostImagemContexto
  ): Promise<PostImagemModeracaoResultado[]> {
    if (!files?.length) {
      return [];
    }

    const resultados: PostImagemModeracaoResultado[] = [];

    // Evita abuso/custo excessivo.
    const arquivos = files.slice(0, 8);

    for (const file of arquivos) {
      if (!file.mimetype?.startsWith("image/")) {
        continue;
      }

      const resultado = await this.analisarImagem(
        file,
        contexto
      );

      resultados.push({
        ...resultado,
        arquivo: file.originalname,
      });

      /**
       * Podemos interromper imediatamente nos casos mais graves.
       */
      if (
        resultado.tipo === "CONTEUDO_IMPROPRIO" ||
        resultado.tipo === "ATIVIDADE_COMERCIAL" ||
        resultado.tipo === "PRESTACAO_SERVICO"
      ) {
        break;
      }
    }

    return resultados;
  }

  async analisarImagem(
    file: Express.Multer.File,
    contexto?: PostImagemContexto
  ): Promise<PostImagemModeracaoResultado> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error(
        "[POST IMAGEM MODERACAO] OPENROUTER_API_KEY não configurada."
      );

      return this.indeterminado(
        "Não foi possível analisar a imagem automaticamente."
      );
    }

    try {
      const buffer = await this.obterBuffer(file);

      if (!buffer?.length) {
        return this.indeterminado(
          "Não foi possível carregar a imagem para análise."
        );
      }

      const mimeType =
        file.mimetype?.startsWith("image/")
          ? file.mimetype
          : "image/jpeg";

      const dataUrl =
        `data:${mimeType};base64,${buffer.toString("base64")}`;

      return await this.analisarComIA(
        dataUrl,
        file.originalname,
        apiKey,
        contexto
      );
    } catch (error) {
      console.error(
        "[POST IMAGEM MODERACAO] Erro:",
        file.originalname,
        error
      );

      // Fail closed: erro de IA não libera imagem automaticamente.
      return this.indeterminado(
        "A análise automática da imagem está temporariamente indisponível."
      );
    }
  }

  private async obterBuffer(
    file: Express.Multer.File
  ): Promise<Buffer> {
    /**
     * Multer memoryStorage
     */
    if (file.buffer?.length) {
      return file.buffer;
    }

    /**
     * Multer diskStorage / arquivo processado pelo Sharp.
     */
    const filePath = (file as any).path;

    if (!filePath) {
      throw new Error("POST_IMAGEM_SEM_BUFFER_OU_PATH");
    }

    const resolved = path.resolve(filePath);

    return await fs.readFile(resolved);
  }

  private async analisarComIA(
    dataUrl: string,
    nomeArquivo: string,
    apiKey: string,
    contexto?: PostImagemContexto
  ): Promise<PostImagemModeracaoResultado> {
    const model =
      process.env.POST_VISION_MODEL ||
      process.env.CLASSIFICADO_VISION_MODEL ||
      "openai/gpt-4o-mini";

    const prompt = `
Você é o moderador visual do Mural comunitário da plataforma GranConecta.

Analise a imagem anexada a um recado de morador.
CONTEXTO INFORMADO PELO MORADOR:

Categoria do post:
${contexto?.categoria || "NÃO INFORMADA"}

Título:
${contexto?.titulo || "NÃO INFORMADO"}

Descrição:
${contexto?.descricao || "NÃO INFORMADA"}

Analise a imagem EM CONJUNTO com o título, a descrição e a categoria.

A imagem não precisa, sozinha, demonstrar se o objeto está sendo
vendido, doado, encontrado ou anunciado quando essa intenção já
estiver claramente informada no texto do post.

Se a imagem for visualmente compatível com o contexto declarado,
não use INDETERMINADO apenas porque a intenção não pode ser
descoberta olhando somente a fotografia.

Exemplo:

Categoria: DESAPEGA
Título: "Doação de um celular"
Imagem: fotografia normal de um celular

Nesse caso, a imagem é compatível com a comunicação comunitária.
Classifique como FOTO_COMUNITARIA.

Outro exemplo:

Categoria: DESAPEGA
Título: "Doação de um celular"
Imagem: flyer com vários celulares, preços, estoque, WhatsApp,
"faça seu pedido" ou elementos claros de comércio recorrente.

Nesse caso, a imagem contradiz o contexto comunitário e deve ser
classificada como ATIVIDADE_COMERCIAL.

O Mural NÃO deve funcionar como área de propaganda, catálogo,
classificados ou divulgação profissional.

Classifique a imagem em EXATAMENTE UMA categoria:

FOTO_COMUNITARIA
VENDA_OCASIONAL
ATIVIDADE_COMERCIAL
PRESTACAO_SERVICO
CONTEUDO_IMPROPRIO
INDETERMINADO


==================================================
FOTO_COMUNITARIA
==================================================

Imagem normal compatível com comunicação entre moradores.

Exemplos:

- foto de evento;
- área do condomínio;
- objeto encontrado;
- animal encontrado/perdido;
- problema em área comum;
- reunião;
- foto cotidiana;
- imagem informativa sem finalidade comercial.

IMPORTANTE:

A simples presença de produtos, alimentos, marcas, embalagens,
logotipos ou textos NÃO significa atividade comercial.

Exemplo:

uma mesa de festa contendo salgados é FOTO_COMUNITARIA.

Uma embalagem de celular fotografada casualmente não é
automaticamente propaganda.


==================================================
VENDA_OCASIONAL
==================================================

Imagem destinada aparentemente à venda ocasional de um bem pessoal.

Exemplos:

- sofá usado fotografado para venda;
- bicicleta usada;
- celular usado;
- móvel;
- eletrodoméstico usado.

Se houver apenas a fotografia normal de um objeto e NÃO for possível
determinar que está sendo vendido, prefira FOTO_COMUNITARIA.

Use VENDA_OCASIONAL quando houver sinais visuais claros de anúncio
de venda ocasional.


==================================================
ATIVIDADE_COMERCIAL
==================================================

Imagem de propaganda ou venda recorrente de produtos.

Procure combinação de sinais como:

- preços;
- "faça seu pedido";
- "encomendas";
- "promoção";
- cardápio;
- catálogo;
- tabela de preços;
- telefone para pedidos;
- WhatsApp;
- QR Code comercial;
- @ de rede social;
- chamada para compra;
- entrega;
- estoque;
- vários produtos organizados como catálogo;
- flyer publicitário;
- arte promocional;
- logo + produto + preço + contato;
- menu/cardápio de alimentos.

Exemplos:

"COXINHA R$ 5,00 — FAÇA SEU PEDIDO — WhatsApp..."

"Bolos por encomenda — consulte nosso catálogo"

"Cardápio de hoje — pedidos pelo WhatsApp"

IMPORTANTE:

Não classifique como comercial somente porque existe texto,
marca ou telefone na imagem.

Analise a intenção visual geral.


==================================================
PRESTACAO_SERVICO
==================================================

Imagem divulgando serviço ou atividade profissional.

Exemplos:

"Eletricista — instalações e manutenção — WhatsApp..."

"Manicure — agenda aberta"

"Limpeza residencial — faça seu orçamento"

"Psicopedagogia — agende sua consulta"

Flyer profissional com chamada para contratação deve entrar aqui.


==================================================
CONTEUDO_IMPROPRIO
==================================================

Conteúdo visual claramente incompatível com o ambiente comunitário,
incluindo quando aplicável:

- nudez sexual explícita;
- pornografia;
- violência gráfica;
- ameaça explícita;
- discurso de ódio visual;
- conteúdo claramente criminoso;
- anúncio claramente ilegal ou perigoso.


==================================================
INDETERMINADO
==================================================

Use somente quando a imagem não puder ser interpretada com segurança,
estiver ilegível ou não houver informação visual suficiente.


==================================================
REGRA FUNDAMENTAL
==================================================

Não classifique usando uma única palavra ou objeto.

Analise o conjunto visual e a intenção aparente.

Uma foto contendo coxinhas em uma festa:
FOTO_COMUNITARIA

Um flyer escrito:

"COXINHAS
R$ 5,00
FAÇA SEU PEDIDO
WhatsApp 11..."
ATIVIDADE_COMERCIAL


Uma foto casual de uma furadeira:
FOTO_COMUNITARIA

Uma arte:

"ELETRICISTA
INSTALAÇÕES E REPAROS
ORÇAMENTO
WhatsApp..."
PRESTACAO_SERVICO


Arquivo:
${nomeArquivo}


Responda SOMENTE JSON válido:

{
  "classificacao": "FOTO_COMUNITARIA",
  "motivo": "Explicação curta e objetiva."
}

Não use markdown.
Não escreva nada antes ou depois do JSON.
`.trim();

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model,
          temperature: 0,

          messages: [
            {
              role: "user",

              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: dataUrl,
                  },
                },
              ],
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

    return this.normalizar(parsed);
  }

  private parseResposta(content: string): RespostaIA {
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned) as RespostaIA;
    } catch {
      console.error(
        "[POST IMAGEM MODERACAO] JSON inválido:",
        content
      );

      throw new Error("POST_IMAGEM_MODERACAO_JSON_INVALIDO");
    }
  }

  private normalizar(
    resposta: RespostaIA
  ): PostImagemModeracaoResultado {
    const classificacao = String(
      resposta.classificacao ?? ""
    )
      .trim()
      .toUpperCase();

    const motivo =
      String(resposta.motivo ?? "").trim() ||
      "Imagem analisada automaticamente.";

    switch (classificacao) {
      case "FOTO_COMUNITARIA":
        return {
          tipo: "FOTO_COMUNITARIA",
          permitidoNoMural: true,
          destino: "MURAL",
          motivo,
        };

      case "VENDA_OCASIONAL":
        return {
          tipo: "VENDA_OCASIONAL",
          permitidoNoMural: false,
          destino: "CLASSIFICADOS",
          motivo,
        };

      case "ATIVIDADE_COMERCIAL":
        return {
          tipo: "ATIVIDADE_COMERCIAL",
          permitidoNoMural: false,
          destino: "EMPREENDEDOR",
          motivo,
        };

      case "PRESTACAO_SERVICO":
        return {
          tipo: "PRESTACAO_SERVICO",
          permitidoNoMural: false,
          destino: "PRESTADOR",
          motivo,
        };

      case "CONTEUDO_IMPROPRIO":
        return {
          tipo: "CONTEUDO_IMPROPRIO",
          permitidoNoMural: false,
          destino: "BLOQUEADO",
          motivo,
        };
      case "INDETERMINADO":
        return {
          tipo: "INDETERMINADO",
          permitidoNoMural: false,
          destino: "ANALISE",
          motivo,
        };


      default:
        return this.indeterminado(
          classificacao
            ? `Classificação visual não reconhecida: ${classificacao}.`
            : motivo
        );
    }
  }

  private indeterminado(
    motivo: string
  ): PostImagemModeracaoResultado {
    return {
      tipo: "INDETERMINADO",
      permitidoNoMural: false,
      destino: "ANALISE",
      motivo,
    };
  }
}

export default PostImagemModeracaoService;