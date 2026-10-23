import fs from "node:fs/promises";
import path from "node:path";

export type ClassificadoImagemClassificacao =
  | "FOTO_PRODUTO"
  | "ATIVIDADE_COMERCIAL"
  | "PRESTACAO_SERVICO"
  | "CONTEUDO_IMPROPRIO"
  | "INDETERMINADO";

export type ClassificadoImagemDestino =
  | "EMPREENDEDOR"
  | "PRESTADOR"
  | null;

export type ClassificadoImagemModeracaoResultado = {
  permitido: boolean;

  classificacao:
  ClassificadoImagemClassificacao;

  destino:
  ClassificadoImagemDestino;

  possuiTexto: boolean;
  possuiTelefone: boolean;
  possuiWhatsapp: boolean;
  possuiRedeSocial: boolean;
  possuiQrCode: boolean;

  parecePublicidade: boolean;
  pareceCardapio: boolean;
  pareceCatalogo: boolean;

  conteudoImproprio: boolean;

  textoDetectado: string[];

  motivos: string[];

  confianca: number;

  mensagem: string;
};

export type ClassificadoImagemModeracaoItem = {
  id?: number | string;
  url: string;
};

export type ClassificadoImagemModeracaoLoteResultado = {
  permitido: boolean;

  classificacao:
  ClassificadoImagemClassificacao;

  destino:
  ClassificadoImagemDestino;

  motivos: string[];

  imagens:
  Array<
    ClassificadoImagemModeracaoResultado & {
      id?: number | string;
      url: string;
    }
  >;
};

class ClassificadoImagemModeracaoService {
  private readonly API_URL =
    "https://openrouter.ai/api/v1/chat/completions";

  private readonly API_KEY =
    String(
      process.env.OPENROUTER_API_KEY || ""
    ).trim();

  /**
   * Modelo dedicado à análise visual.
   *
   * Mantemos separado do AIService utilizado pelo
   * gerador de Landing Pages.
   */
  private readonly model =
    process.env.CLASSIFICADO_VISION_MODEL ||
    "openai/gpt-4o-mini";

  /**
   * ============================================================
   * CAMINHO FÍSICO
   * ============================================================
   */
  private resolverCaminhoImagem(
    urlInformada: string
  ): string {
    const url =
      String(urlInformada || "").trim();

    if (!url) {
      throw new Error(
        "CLASSIFICADO_IMAGEM_URL_INVALIDA"
      );
    }

    /**
     * Por segurança este serviço somente analisa
     * imagens que pertencem ao diretório oficial
     * dos classificados.
     */
    const prefixo =
      "/uploads/classificados/";

    if (!url.startsWith(prefixo)) {
      throw new Error(
        "CLASSIFICADO_IMAGEM_FORA_DIRETORIO"
      );
    }

    const caminhoRelativo =
      url.replace(/^\/+/, "");

    const caminhoAbsoluto =
      path.resolve(
        process.cwd(),
        caminhoRelativo
      );

    const diretorioPermitido =
      path.resolve(
        process.cwd(),
        "uploads",
        "classificados"
      );

    /**
     * Proteção contra path traversal.
     */
    const relativo =
      path.relative(
        diretorioPermitido,
        caminhoAbsoluto
      );

    if (
      relativo.startsWith("..") ||
      path.isAbsolute(relativo)
    ) {
      throw new Error(
        "CLASSIFICADO_IMAGEM_CAMINHO_INVALIDO"
      );
    }

    return caminhoAbsoluto;
  }

  /**
   * ============================================================
   * DATA URL
   * ============================================================
   */
  private async imagemParaDataUrl(
    url: string
  ): Promise<string> {
    const caminho =
      this.resolverCaminhoImagem(url);

    const buffer =
      await fs.readFile(caminho);

    if (!buffer.length) {
      throw new Error(
        "CLASSIFICADO_IMAGEM_VAZIA"
      );
    }

    /**
     * saveClassificadoImage() sempre converte
     * a imagem para WEBP.
     */
    return (
      "data:image/webp;base64," +
      buffer.toString("base64")
    );
  }

  /**
   * ============================================================
   * NORMALIZAÇÃO DA RESPOSTA
   * ============================================================
   */
  private normalizarResultado(
    valor: any
  ): ClassificadoImagemModeracaoResultado {
    const classificacoesPermitidas:
      ClassificadoImagemClassificacao[] = [
        "FOTO_PRODUTO",
        "ATIVIDADE_COMERCIAL",
        "PRESTACAO_SERVICO",
        "CONTEUDO_IMPROPRIO",
        "INDETERMINADO",
      ];

    const destinosPermitidos:
      Array<ClassificadoImagemDestino> = [
        "EMPREENDEDOR",
        "PRESTADOR",
        null,
      ];

    const classificacao =
      classificacoesPermitidas.includes(
        valor?.classificacao
      )
        ? valor.classificacao
        : "INDETERMINADO";

    const destino =
      destinosPermitidos.includes(
        valor?.destino
      )
        ? valor.destino
        : null;

    const confiancaOriginal =
      Number(valor?.confianca);

    const confianca =
      Number.isFinite(confiancaOriginal)
        ? Math.min(
          1,
          Math.max(
            0,
            confiancaOriginal
          )
        )
        : 0;

    const motivos =
      Array.isArray(valor?.motivos)
        ? valor.motivos
          .map((item: unknown) =>
            String(item || "")
              .trim()
              .toUpperCase()
          )
          .filter(Boolean)
          .slice(0, 20)
        : [];

    const textoDetectado =
      Array.isArray(valor?.textoDetectado)
        ? valor.textoDetectado
          .map((item: unknown) =>
            String(item || "").trim()
          )
          .filter(Boolean)
          .slice(0, 20)
        : [];

    return {
      permitido:
        valor?.permitido === true,

      classificacao,

      destino,

      possuiTexto:
        valor?.possuiTexto === true,

      possuiTelefone:
        valor?.possuiTelefone === true,

      possuiWhatsapp:
        valor?.possuiWhatsapp === true,

      possuiRedeSocial:
        valor?.possuiRedeSocial === true,

      possuiQrCode:
        valor?.possuiQrCode === true,

      parecePublicidade:
        valor?.parecePublicidade === true,

      pareceCardapio:
        valor?.pareceCardapio === true,

      pareceCatalogo:
        valor?.pareceCatalogo === true,

      conteudoImproprio:
        valor?.conteudoImproprio === true,

      textoDetectado,

      motivos,

      confianca,

      mensagem:
        String(
          valor?.mensagem || ""
        ).trim() ||
        "Imagem analisada.",
    };
  }

  /**
   * ============================================================
   * ANALISAR UMA IMAGEM
   * ============================================================
   */
  public async analisarImagem(
    imagem: ClassificadoImagemModeracaoItem
  ): Promise<
    ClassificadoImagemModeracaoResultado
  > {
    if (!this.API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY_NAO_CONFIGURADA"
      );
    }

    const dataUrl =
      await this.imagemParaDataUrl(
        imagem.url
      );

    const systemPrompt = `
Você é o sistema de moderação visual dos Classificados
da plataforma GranConecta.

O Classificados é destinado principalmente à venda ocasional
de bens pessoais entre moradores.

Sua função é analisar UMA FOTO enviada em um anúncio.

Você deve distinguir entre:

1. FOTO normal de um produto ou bem pessoal;
2. PUBLICIDADE de atividade comercial;
3. divulgação de PRESTAÇÃO DE SERVIÇO;
4. CONTEÚDO IMPRÓPRIO;
5. caso INDETERMINADO.

IMPORTANTE:

A existência de texto na imagem NÃO significa automaticamente
atividade comercial.

Exemplos que NÃO devem ser considerados publicidade somente
por possuírem texto:

- logotipo original do fabricante;
- embalagem original;
- etiqueta;
- modelo do produto;
- especificação técnica;
- texto existente naturalmente no objeto;
- marca de bicicleta, televisão, notebook, celular etc.

Procure especialmente por:

- telefone;
- WhatsApp;
- Instagram, Facebook, TikTok ou outra rede social;
- QR Code utilizado como contato ou divulgação;
- "faço";
- "fazemos";
- "aceito encomendas";
- "aceitamos encomendas";
- "encomendas";
- "faça seu pedido";
- "pedidos";
- "delivery";
- "pronta entrega";
- "promoção";
- "orçamento";
- divulgação de serviços;
- cardápio;
- tabela de preços;
- flyer;
- panfleto;
- catálogo comercial;
- chamada publicitária;
- múltiplos produtos apresentados como estoque comercial.

Exemplo:

Imagem dizendo:

"Faço coxinhas
Aceitamos encomendas
WhatsApp 11 99999-9999"

deve ser classificada como ATIVIDADE_COMERCIAL,
destino EMPREENDEDOR e permitido false.

Uma imagem dizendo:

"Eletricista
Instalações e manutenção
Orçamentos
WhatsApp..."

deve ser PRESTACAO_SERVICO,
destino PRESTADOR e permitido false.

Uma fotografia comum de uma mesa usada,
mesmo contendo marca do fabricante,
deve ser FOTO_PRODUTO e permitido true.

CONTEÚDO IMPRÓPRIO:

Marque:

"conteudoImproprio": true
"classificacao": "CONTEUDO_IMPROPRIO"
"permitido": false
"destino": null

quando a imagem apresentar claramente conteúdo incompatível
com os Classificados do GranConecta, especialmente:

- nudez explícita ou conteúdo sexual explícito;
- violência gráfica, ferimentos graves ou sangue em contexto gráfico;
- conteúdo visual de ódio ou ameaça explícita;
- drogas ilícitas sendo anunciadas ou promovidas;
- armas sendo anunciadas ou promovidas como produto;
- qualquer outro conteúdo visual claramente impróprio
  para uma plataforma comunitária de classificados.

IMPORTANTE:

Não classifique automaticamente como CONTEUDO_IMPROPRIO:

- facas domésticas fotografadas como utensílio de cozinha;
- ferramentas comuns;
- medicamentos ou embalagens comuns apenas por aparecerem na foto;
- bebidas apenas por aparecerem na imagem;
- objetos que possam parecer incomuns, mas não apresentem
  claramente conteúdo impróprio.

Se não houver evidência visual suficiente, não invente.

Quando houver dúvida relevante sobre conteúdo impróprio,
use INDETERMINADO em vez de CONTEUDO_IMPROPRIO.

Não invente texto.

textoDetectado deve conter somente texto que você consiga
identificar visualmente com razoável confiança.

Quando houver dúvida relevante, use INDETERMINADO.

Retorne SOMENTE JSON válido exatamente com esta estrutura:

{
  "permitido": true,
  "classificacao": "FOTO_PRODUTO",
  "destino": null,

  "possuiTexto": false,
  "possuiTelefone": false,
  "possuiWhatsapp": false,
  "possuiRedeSocial": false,
  "possuiQrCode": false,

  "parecePublicidade": false,
  "pareceCardapio": false,
  "pareceCatalogo": false,

  "conteudoImproprio": false,

  "textoDetectado": [],
  "motivos": [],

  "confianca": 0.0,

  "mensagem": "string"
}
`;

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        30000
      );

    try {
      const response =
        await fetch(
          this.API_URL,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${this.API_KEY}`,

              "Content-Type":
                "application/json",

              "HTTP-Referer":
                "https://granconecta.net.br",

              "X-Title":
                "GranConecta Classificados",
            },

            body: JSON.stringify({
              model:
                this.model,

              temperature:
                0.1,

              max_tokens:
                1500,

              response_format: {
                type:
                  "json_object",
              },

              messages: [
                {
                  role:
                    "system",

                  content:
                    systemPrompt,
                },

                {
                  role:
                    "user",

                  content: [
                    {
                      type:
                        "text",

                      text:
                        "Analise esta imagem do classificado seguindo rigorosamente as regras fornecidas.",
                    },

                    {
                      type:
                        "image_url",

                      image_url: {
                        url:
                          dataUrl,
                      },
                    },
                  ],
                },
              ],
            }),

            signal:
              controller.signal,
          }
        );

      if (!response.ok) {
        const detalhe =
          await response.text();

        throw new Error(
          `CLASSIFICADO_MODERACAO_IMAGEM_HTTP_${response.status}: ${detalhe}`
        );
      }

      const data: any =
        await response.json();

      let content =
        data?.choices?.[0]
          ?.message?.content;

      if (!content) {
        throw new Error(
          "CLASSIFICADO_MODERACAO_IMAGEM_RESPOSTA_VAZIA"
        );
      }

      content =
        String(content)
          .replace(
            /```json/gi,
            ""
          )
          .replace(
            /```/g,
            ""
          )
          .trim();

      let parsed: any;

      try {
        parsed =
          JSON.parse(content);
      } catch {
        const match =
          content.match(
            /\{[\s\S]*\}/
          );

        if (!match) {
          throw new Error(
            "CLASSIFICADO_MODERACAO_IMAGEM_JSON_INVALIDO"
          );
        }

        parsed =
          JSON.parse(match[0]);
      }

      return this.normalizarResultado(
        parsed
      );
    } catch (error: any) {
      if (
        error?.name ===
        "AbortError"
      ) {
        throw new Error(
          "CLASSIFICADO_MODERACAO_IMAGEM_TIMEOUT"
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * ============================================================
   * ANALISAR TODAS AS IMAGENS
   * ============================================================
   */
  public async analisarImagens(
    imagens:
      ClassificadoImagemModeracaoItem[]
  ): Promise<
    ClassificadoImagemModeracaoLoteResultado
  > {
    if (
      !Array.isArray(imagens) ||
      imagens.length === 0
    ) {
      throw new Error(
        "CLASSIFICADO_IMAGEM_OBRIGATORIA"
      );
    }

    /**
     * Fazemos sequencialmente nesta primeira versão.
     *
     * Isso evita disparar até 8 chamadas simultâneas
     * para o provedor e facilita logs/debug.
     */
    const resultados:
      ClassificadoImagemModeracaoLoteResultado["imagens"] =
      [];

    for (const imagem of imagens) {
      const resultado =
        await this.analisarImagem(
          imagem
        );

      resultados.push({
        id:
          imagem.id,

        url:
          imagem.url,

        ...resultado,
      });
    }

    /**
     * Conteúdo impróprio possui prioridade máxima.
     */
    const impropria =
      resultados.find(
        (resultado) =>
          resultado.conteudoImproprio ||
          resultado.classificacao ===
          "CONTEUDO_IMPROPRIO"
      );

    if (impropria) {
      return {
        permitido:
          false,

        classificacao:
          "CONTEUDO_IMPROPRIO",

        destino:
          null,

        motivos:
          Array.from(
            new Set(
              resultados.flatMap(
                (resultado) =>
                  resultado.motivos
              )
            )
          ),

        imagens:
          resultados,
      };
    }

    /**
     * Prestação de serviço.
     */
    const prestador =
      resultados.find(
        (resultado) =>
          resultado.classificacao ===
          "PRESTACAO_SERVICO"
      );

    if (prestador) {
      return {
        permitido:
          false,

        classificacao:
          "PRESTACAO_SERVICO",

        destino:
          "PRESTADOR",

        motivos:
          Array.from(
            new Set(
              resultados.flatMap(
                (resultado) =>
                  resultado.motivos
              )
            )
          ),

        imagens:
          resultados,
      };
    }

    /**
     * Atividade comercial.
     */
    const comercial =
      resultados.find(
        (resultado) =>
          resultado.classificacao ===
          "ATIVIDADE_COMERCIAL"
      );

    if (comercial) {
      return {
        permitido:
          false,

        classificacao:
          "ATIVIDADE_COMERCIAL",

        destino:
          "EMPREENDEDOR",

        motivos:
          Array.from(
            new Set(
              resultados.flatMap(
                (resultado) =>
                  resultado.motivos
              )
            )
          ),

        imagens:
          resultados,
      };
    }

    /**
     * Se alguma imagem ficou indeterminada,
     * não liberamos silenciosamente.
     */
    const indeterminada =
      resultados.find(
        (resultado) =>
          resultado.classificacao ===
          "INDETERMINADO"
      );

    if (indeterminada) {
      return {
        permitido:
          false,

        classificacao:
          "INDETERMINADO",

        destino:
          null,

        motivos:
          Array.from(
            new Set(
              resultados.flatMap(
                (resultado) =>
                  resultado.motivos
              )
            )
          ),

        imagens:
          resultados,
      };
    }

    return {
      permitido:
        true,

      classificacao:
        "FOTO_PRODUTO",

      destino:
        null,

      motivos:
        Array.from(
          new Set(
            resultados.flatMap(
              (resultado) =>
                resultado.motivos
            )
          )
        ),

      imagens:
        resultados,
    };
  }
}

export default new ClassificadoImagemModeracaoService();