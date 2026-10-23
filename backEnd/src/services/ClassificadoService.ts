import { AppDataSource } from "../config/data-source";
import {
  ClassificadoImagem,
} from "../models/ClassificadoImagemModel";

import {
  Classificado,
  ClassificadoCategoria,
  ClassificadoCondicao,
  ClassificadoLocalizacaoPrecision,
  ClassificadoStatus,
} from "../models/ClassificadoModel";

import {
  ClassificadoEvento,
  ClassificadoEventoOrigem,
  ClassificadoEventoTipo,
} from "../models/ClassificadoEventoModel";

import {
  Endereco,
  EnderecoGeocodingPrecision,
  EnderecoGeocodingStatus,
} from "../models/EnderecoModel";

import proximityService from "./location/ProximityService";

import classificadoModeracaoService
  from "./classificados/ClassificadoModeracaoService";

import classificadoCreditoService
  from "./ClassificadoCreditoService";
import { Usuario } from "../models/UserModels";

import classificadoImagemModeracaoService
  from "./classificados/ClassificadoImagemModeracaoService";

/**
 * ============================================================
 * DTOs
 * ============================================================
 */

export type CriarClassificadoInput = {
  usuarioId: string;

  titulo: string;
  descricao: string;

  categoria: ClassificadoCategoria;
  condicao: ClassificadoCondicao;

  preco: number | string;
};

export type AtualizarRascunhoClassificadoInput = {
  titulo?: string;
  descricao?: string;
  categoria?: ClassificadoCategoria;
  condicao?: ClassificadoCondicao;
  preco?: number | string;
};

/**
 * ============================================================
 * SERVICE
 * ============================================================
 */
export class ClassificadoService {
  private classificadoRepository =
    AppDataSource.getRepository(Classificado);

  private eventoRepository =
    AppDataSource.getRepository(ClassificadoEvento);

  private enderecoRepository =
    AppDataSource.getRepository(Endereco);

  private imagemRepository =
    AppDataSource.getRepository(ClassificadoImagem);

  private usuarioRepository =
    AppDataSource.getRepository(Usuario);

  /**
   * ============================================================
   * NORMALIZAÇÕES
   * ============================================================
   */

  private normalizarTexto(
    valor: unknown
  ): string {
    return String(valor ?? "").trim();
  }

  private normalizarPreco(
    valor: number | string
  ): string {
    let texto = String(valor ?? "")
      .trim()
      .replace(/\s/g, "");

    /*
     * Aceita:
     *
     * 2500
     * 2500.50
     * 2500,50
     * 2.500,50
     */
    if (
      texto.includes(".") &&
      texto.includes(",")
    ) {
      texto = texto
        .replace(/\./g, "")
        .replace(",", ".");
    } else if (texto.includes(",")) {
      texto = texto.replace(",", ".");
    }

    const numero = Number(texto);

    if (
      !Number.isFinite(numero) ||
      numero <= 0
    ) {
      throw new Error(
        "CLASSIFICADO_PRECO_INVALIDO"
      );
    }

    /*
     * Proteção compatível com DECIMAL(12,2).
     */
    if (numero > 9999999999.99) {
      throw new Error(
        "CLASSIFICADO_PRECO_ACIMA_LIMITE"
      );
    }

    return numero.toFixed(2);
  }

  private validarTitulo(
    titulo: string
  ): void {
    if (!titulo) {
      throw new Error(
        "CLASSIFICADO_TITULO_OBRIGATORIO"
      );
    }

    if (titulo.length < 3) {
      throw new Error(
        "CLASSIFICADO_TITULO_MUITO_CURTO"
      );
    }

    if (titulo.length > 160) {
      throw new Error(
        "CLASSIFICADO_TITULO_MUITO_LONGO"
      );
    }
  }

  private validarDescricao(
    descricao: string
  ): void {
    if (!descricao) {
      throw new Error(
        "CLASSIFICADO_DESCRICAO_OBRIGATORIA"
      );
    }

    if (descricao.length < 5) {
      throw new Error(
        "CLASSIFICADO_DESCRICAO_MUITO_CURTA"
      );
    }
  }

  private validarCategoria(
    categoria: ClassificadoCategoria
  ): void {
    if (
      !Object.values(
        ClassificadoCategoria
      ).includes(categoria)
    ) {
      throw new Error(
        "CLASSIFICADO_CATEGORIA_INVALIDA"
      );
    }
  }

  private validarCondicao(
    condicao: ClassificadoCondicao
  ): void {
    if (
      !Object.values(
        ClassificadoCondicao
      ).includes(condicao)
    ) {
      throw new Error(
        "CLASSIFICADO_CONDICAO_INVALIDA"
      );
    }
  }

  /**
   * ============================================================
   * EVENTOS
   * ============================================================
   */

  private async registrarEvento(params: {
    classificadoId?: string | null;
    usuarioId: string;
    tipo: ClassificadoEventoTipo;
    origem?: ClassificadoEventoOrigem;
    detalhes?: Record<string, unknown> | null;
  }): Promise<ClassificadoEvento> {
    const evento =
      this.eventoRepository.create({
        classificadoId:
          params.classificadoId ?? null,

        usuarioId:
          params.usuarioId,

        tipo:
          params.tipo,

        origem:
          params.origem ??
          ClassificadoEventoOrigem.CLASSIFICADOS,

        detalhes:
          params.detalhes ?? null,
      });

    return this.eventoRepository.save(
      evento
    );
  }

  /**
   * ============================================================
   * LOCALIZAÇÃO
   * ============================================================
   *
   * O anúncio guarda uma fotografia da localização interna
   * existente no momento da criação.
   *
   * Não devemos usar essas coordenadas para expor o endereço
   * exato publicamente.
   */
  private async obterContextoLocalizacao(
    usuarioId: string
  ): Promise<{
    condominioId: string | null;
    latitude: string | null;
    longitude: string | null;
    precisao: ClassificadoLocalizacaoPrecision;
  }> {
    /**
     * O condomínio do classificado não deve depender
     * exclusivamente da existência de um endereço.
     *
     * Fonte principal do vínculo:
     *
     * usuarios.condominio_id
     *
     * O endereço continua sendo utilizado para:
     *
     * - latitude;
     * - longitude;
     * - precisão do geocoding;
     * - condominio_id como fallback/compatibilidade.
     */

    const [usuario, endereco] =
      await Promise.all([
        this.usuarioRepository.findOne({
          where: {
            id: usuarioId,
          },
          select: {
            id: true,
            condominio_id: true,
          },
        }),

        this.enderecoRepository.findOne({
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
        }),
      ]);

    /**
     * Primeiro usamos o condomínio oficial
     * vinculado ao usuário.
     */
    const condominioUsuario =
      usuario?.condominio_id
        ? String(
          usuario.condominio_id
        ).trim() || null
        : null;

    /**
     * Mantemos compatibilidade com registros antigos
     * em que o vínculo possa existir somente no endereço.
     */
    const condominioEndereco =
      endereco?.condominio_id
        ? String(
          endereco.condominio_id
        ).trim() || null
        : null;

    const condominioId =
      condominioUsuario ||
      condominioEndereco ||
      null;

    /**
     * Não possuir endereço não significa que o usuário
     * não pertence a um condomínio.
     *
     * Nesse caso preservamos o condomínio e apenas
     * informamos que não existem coordenadas disponíveis.
     */
    if (!endereco) {
      return {
        condominioId,
        latitude: null,
        longitude: null,
        precisao:
          ClassificadoLocalizacaoPrecision.NENHUMA,
      };
    }

    /**
     * Validação centralizada das coordenadas.
     */
    const coordenadasValidas =
      endereco.geocoding_status ===
      EnderecoGeocodingStatus.LOCALIZADO &&
      proximityService.coordenadasValidas(
        endereco.latitude,
        endereco.longitude
      );

    /**
     * O endereço existe, mas não possui uma
     * geolocalização válida.
     *
     * Ainda assim preservamos o condomínio.
     */
    if (!coordenadasValidas) {
      return {
        condominioId,
        latitude: null,
        longitude: null,
        precisao:
          ClassificadoLocalizacaoPrecision.NENHUMA,
      };
    }

    let precisao =
      ClassificadoLocalizacaoPrecision.NENHUMA;

    switch (
    endereco.geocoding_precision
    ) {
      case EnderecoGeocodingPrecision.ENDERECO:
        precisao =
          ClassificadoLocalizacaoPrecision.ENDERECO;
        break;

      case EnderecoGeocodingPrecision.CEP:
        precisao =
          ClassificadoLocalizacaoPrecision.CEP;
        break;

      default:
        /**
         * Temos coordenadas válidas e sabemos
         * a qual condomínio o usuário pertence.
         */
        if (condominioId) {
          precisao =
            ClassificadoLocalizacaoPrecision.CONDOMINIO;
        }
        break;
    }

    return {
      condominioId,

      latitude:
        endereco.latitude != null
          ? String(
            endereco.latitude
          )
          : null,

      longitude:
        endereco.longitude != null
          ? String(
            endereco.longitude
          )
          : null,

      precisao,
    };
  }

  /**
   * ============================================================
   * CRIAR RASCUNHO
   * ============================================================
   *
   * REGRA DE SEGURANÇA:
   *
   * O usuário NÃO escolhe:
   *
   * - status;
   * - plano;
   * - valor do anúncio;
   * - paymentId;
   * - checkoutUrl;
   * - publicadoEm;
   * - expiraEm.
   *
   * Um anúncio nasce SEMPRE como RASCUNHO.
   */
  public async criarRascunho(
    input: CriarClassificadoInput
  ): Promise<Classificado> {
    const usuarioId =
      this.normalizarTexto(
        input.usuarioId
      );

    if (!usuarioId) {
      throw new Error(
        "CLASSIFICADO_USUARIO_OBRIGATORIO"
      );
    }

    const titulo =
      this.normalizarTexto(
        input.titulo
      );

    const descricao =
      this.normalizarTexto(
        input.descricao
      );

    this.validarTitulo(titulo);
    this.validarDescricao(descricao);

    this.validarCategoria(
      input.categoria
    );

    this.validarCondicao(
      input.condicao
    );

    const preco =
      this.normalizarPreco(
        input.preco
      );

    const localizacao =
      await this.obterContextoLocalizacao(
        usuarioId
      );

    /*
     * Transação:
     *
     * ou criamos o anúncio + evento CRIADO,
     * ou não criamos nenhum dos dois.
     */
    return AppDataSource.transaction(
      async (manager) => {
        const classificadoRepo =
          manager.getRepository(
            Classificado
          );

        const eventoRepo =
          manager.getRepository(
            ClassificadoEvento
          );

        const classificado =
          classificadoRepo.create({
            usuarioId,

            condominioId:
              localizacao.condominioId,

            titulo,
            descricao,

            categoria:
              input.categoria,

            condicao:
              input.condicao,

            preco,

            status:
              ClassificadoStatus.RASCUNHO,

            planoAnuncio: null,
            valorAnuncio: null,
            duracaoDias: null,

            paymentId: null,
            paymentStatus: null,
            checkoutSessionId: null,
            checkoutUrl: null,

            pagoEm: null,
            publicadoEm: null,
            expiraEm: null,
            reservadoEm: null,
            vendidoEm: null,

            visualizacoes: 0,

            latitude:
              localizacao.latitude,

            longitude:
              localizacao.longitude,

            localizacaoPrecision:
              localizacao.precisao,
          });

        const salvo =
          await classificadoRepo.save(
            classificado
          );

        const evento =
          eventoRepo.create({
            classificadoId:
              salvo.id,

            usuarioId,

            tipo:
              ClassificadoEventoTipo.CRIADO,

            origem:
              ClassificadoEventoOrigem.CLASSIFICADOS,

            detalhes: {
              status:
                ClassificadoStatus.RASCUNHO,

              categoria:
                salvo.categoria,

              condicao:
                salvo.condicao,

              possuiCondominio:
                Boolean(
                  salvo.condominioId
                ),

              possuiLocalizacao:
                Boolean(
                  salvo.latitude &&
                  salvo.longitude
                ),
            },
          });

        await eventoRepo.save(evento);

        return salvo;
      }
    );
  }

  /**
   * ============================================================
   * LISTAR MEUS CLASSIFICADOS
   * ============================================================
   */
  public async listarMeus(
    usuarioIdInformado: string
  ): Promise<Classificado[]> {
    const usuarioId =
      this.normalizarTexto(
        usuarioIdInformado
      );

    if (!usuarioId) {
      throw new Error(
        "CLASSIFICADO_USUARIO_OBRIGATORIO"
      );
    }

    return this.classificadoRepository.find({
      where: {
        usuarioId,
      },

      order: {
        createdAt: "DESC",
      },
    });
  }

  /**
   * ============================================================
   * BUSCAR CLASSIFICADO DO PRÓPRIO USUÁRIO
   * ============================================================
   *
   * Essa função será importante para edição, pagamento,
   * cancelamento etc.
   */
  public async buscarMeuPorId(
    idInformado: string,
    usuarioIdInformado: string
  ): Promise<Classificado> {
    const id =
      this.normalizarTexto(
        idInformado
      );

    const usuarioId =
      this.normalizarTexto(
        usuarioIdInformado
      );

    if (!id) {
      throw new Error(
        "CLASSIFICADO_ID_OBRIGATORIO"
      );
    }

    if (!usuarioId) {
      throw new Error(
        "CLASSIFICADO_USUARIO_OBRIGATORIO"
      );
    }

    const classificado =
      await this.classificadoRepository.findOne({
        where: {
          id,
          usuarioId,
        },
      });

    if (!classificado) {
      throw new Error(
        "CLASSIFICADO_NAO_ENCONTRADO"
      );
    }

    return classificado;
  }

  /**
   * ============================================================
   * EDITAR RASCUNHO
   * ============================================================
   *
   * Somente RASCUNHO poderá ser editado por este método.
   *
   * Mais tarde poderemos criar regras próprias para edição
   * de anúncios já publicados.
   */
  public async atualizarRascunho(
    idInformado: string,
    usuarioIdInformado: string,
    input: AtualizarRascunhoClassificadoInput
  ): Promise<Classificado> {
    const classificado =
      await this.buscarMeuPorId(
        idInformado,
        usuarioIdInformado
      );

    if (
      classificado.status !==
      ClassificadoStatus.RASCUNHO
    ) {
      throw new Error(
        "CLASSIFICADO_NAO_E_RASCUNHO"
      );
    }

    if (input.titulo !== undefined) {
      const titulo =
        this.normalizarTexto(
          input.titulo
        );

      this.validarTitulo(titulo);

      classificado.titulo = titulo;
    }

    if (
      input.descricao !== undefined
    ) {
      const descricao =
        this.normalizarTexto(
          input.descricao
        );

      this.validarDescricao(
        descricao
      );

      classificado.descricao =
        descricao;
    }

    if (
      input.categoria !== undefined
    ) {
      this.validarCategoria(
        input.categoria
      );

      classificado.categoria =
        input.categoria;
    }

    if (
      input.condicao !== undefined
    ) {
      this.validarCondicao(
        input.condicao
      );

      classificado.condicao =
        input.condicao;
    }

    if (input.preco !== undefined) {
      classificado.preco =
        this.normalizarPreco(
          input.preco
        );
    }

    const salvo =
      await this.classificadoRepository.save(
        classificado
      );

    await this.registrarEvento({
      classificadoId:
        salvo.id,

      usuarioId:
        salvo.usuarioId,

      tipo:
        ClassificadoEventoTipo.EDITADO,

      detalhes: {
        status:
          salvo.status,
      },
    });

    return salvo;
  }

  /**
 * ============================================================
 * IMAGENS DOS CLASSIFICADOS
 * ============================================================
 */

  /**
   * Retorna as imagens do anúncio na ordem de exibição.
   */
  public async listarImagens(
    classificadoIdInformado: string,
    usuarioIdInformado: string
  ): Promise<ClassificadoImagem[]> {
    const classificado =
      await this.buscarMeuPorId(
        classificadoIdInformado,
        usuarioIdInformado
      );

    return this.imagemRepository.find({
      where: {
        classificadoId:
          classificado.id,
      },

      order: {
        ordem: "ASC",
        id: "ASC",
      },
    });
  }

  /**
   * Adiciona imagens ao classificado.
   *
   * REGRAS:
   *
   * - somente o proprietário;
   * - somente enquanto for RASCUNHO;
   * - máximo de 8 imagens;
   * - primeira imagem do anúncio vira capa automaticamente;
   * - preserva imagens anteriormente cadastradas.
   */
  public async adicionarImagens(
    classificadoIdInformado: string,
    usuarioIdInformado: string,
    urlsInformadas: string[]
  ): Promise<ClassificadoImagem[]> {
    const classificado =
      await this.buscarMeuPorId(
        classificadoIdInformado,
        usuarioIdInformado
      );

    if (
      classificado.status !==
      ClassificadoStatus.RASCUNHO
    ) {
      throw new Error(
        "CLASSIFICADO_NAO_E_RASCUNHO"
      );
    }

    const urls = Array.from(
      new Set(
        (urlsInformadas ?? [])
          .map((url) =>
            String(url ?? "").trim()
          )
          .filter(Boolean)
      )
    );

    if (urls.length === 0) {
      throw new Error(
        "CLASSIFICADO_IMAGEM_OBRIGATORIA"
      );
    }

    const imagensExistentes =
      await this.imagemRepository.find({
        where: {
          classificadoId:
            classificado.id,
        },

        order: {
          ordem: "ASC",
          id: "ASC",
        },
      });

    if (
      imagensExistentes.length +
      urls.length >
      8
    ) {
      throw new Error(
        "CLASSIFICADO_MAXIMO_8_IMAGENS"
      );
    }

    /**
     * Descobre a próxima ordem.
     *
     * Não usamos simplesmente imagensExistentes.length
     * porque futuramente uma imagem poderá ser excluída,
     * deixando lacunas na numeração.
     */
    const maiorOrdem =
      imagensExistentes.length > 0
        ? Math.max(
          ...imagensExistentes.map(
            (imagem) =>
              Number(imagem.ordem)
          )
        )
        : -1;

    const possuiPrincipal =
      imagensExistentes.some(
        (imagem) =>
          Boolean(imagem.principal)
      );

    return AppDataSource.transaction(
      async (manager) => {
        const imagemRepo =
          manager.getRepository(
            ClassificadoImagem
          );

        const eventoRepo =
          manager.getRepository(
            ClassificadoEvento
          );

        const novasImagens:
          ClassificadoImagem[] = [];

        for (
          let index = 0;
          index < urls.length;
          index++
        ) {
          const imagem =
            imagemRepo.create({
              classificadoId:
                classificado.id,

              url: urls[index],

              ordem:
                maiorOrdem +
                index +
                1,

              /**
               * Se o anúncio ainda não possui capa,
               * a primeira imagem deste lote será
               * automaticamente a principal.
               */
              principal:
                !possuiPrincipal &&
                index === 0,
            });

          const salva =
            await imagemRepo.save(
              imagem
            );

          novasImagens.push(
            salva
          );
        }

        /**
         * Registrar como EDITADO nos permite manter
         * a auditoria sem criar um novo tipo de evento
         * somente para upload.
         */
        const evento =
          eventoRepo.create({
            classificadoId:
              classificado.id,

            usuarioId:
              classificado.usuarioId,

            tipo:
              ClassificadoEventoTipo.EDITADO,

            origem:
              ClassificadoEventoOrigem.CLASSIFICADOS,

            detalhes: {
              acao:
                "IMAGENS_ADICIONADAS",

              quantidade:
                novasImagens.length,

              totalImagens:
                imagensExistentes.length +
                novasImagens.length,
            },
          });

        await eventoRepo.save(
          evento
        );

        return imagemRepo.find({
          where: {
            classificadoId:
              classificado.id,
          },

          order: {
            ordem: "ASC",
            id: "ASC",
          },
        });
      }
    );
  }

  /**
   * ============================================================
   * DEFINIR IMAGEM PRINCIPAL
   * ============================================================
   */
  public async definirImagemPrincipal(
    classificadoIdInformado: string,
    imagemIdInformado: number,
    usuarioIdInformado: string
  ): Promise<ClassificadoImagem[]> {
    const classificado =
      await this.buscarMeuPorId(
        classificadoIdInformado,
        usuarioIdInformado
      );

    if (
      classificado.status !==
      ClassificadoStatus.RASCUNHO
    ) {
      throw new Error(
        "CLASSIFICADO_NAO_E_RASCUNHO"
      );
    }

    const imagemId =
      Number(imagemIdInformado);

    if (
      !Number.isInteger(imagemId) ||
      imagemId <= 0
    ) {
      throw new Error(
        "CLASSIFICADO_IMAGEM_ID_INVALIDO"
      );
    }

    const imagem =
      await this.imagemRepository.findOne({
        where: {
          id: imagemId,
          classificadoId:
            classificado.id,
        },
      });

    if (!imagem) {
      throw new Error(
        "CLASSIFICADO_IMAGEM_NAO_ENCONTRADA"
      );
    }

    await AppDataSource.transaction(
      async (manager) => {
        const imagemRepo =
          manager.getRepository(
            ClassificadoImagem
          );

        /**
         * Primeiro remove a marca principal
         * de todas as imagens deste anúncio.
         */
        await imagemRepo.update(
          {
            classificadoId:
              classificado.id,
          },
          {
            principal: false,
          }
        );

        /**
         * Depois marca somente a escolhida.
         */
        await imagemRepo.update(
          {
            id: imagem.id,
            classificadoId:
              classificado.id,
          },
          {
            principal: true,
          }
        );

        const eventoRepo =
          manager.getRepository(
            ClassificadoEvento
          );

        await eventoRepo.save(
          eventoRepo.create({
            classificadoId:
              classificado.id,

            usuarioId:
              classificado.usuarioId,

            tipo:
              ClassificadoEventoTipo.EDITADO,

            origem:
              ClassificadoEventoOrigem.CLASSIFICADOS,

            detalhes: {
              acao:
                "IMAGEM_PRINCIPAL_ALTERADA",

              imagemId:
                imagem.id,
            },
          })
        );
      }
    );

    return this.imagemRepository.find({
      where: {
        classificadoId:
          classificado.id,
      },

      order: {
        ordem: "ASC",
        id: "ASC",
      },
    });
  }

  /**
 * ============================================================
 * ENVIAR PARA ANÁLISE
 * ============================================================
 */
  public async enviarParaAnalise(
    idInformado: string,
    usuarioIdInformado: string
  ): Promise<{
    classificado: Classificado;

    moderacao: ReturnType<
      typeof classificadoModeracaoService.analisar
    >;

    moderacaoImagens: Awaited<
      ReturnType<
        typeof classificadoImagemModeracaoService.analisarImagens
      >
    >;
  }> {
    const classificado =
      await this.buscarMeuPorId(
        idInformado,
        usuarioIdInformado
      );

    if (
      classificado.status !==
      ClassificadoStatus.RASCUNHO
    ) {
      throw new Error(
        "CLASSIFICADO_NAO_E_RASCUNHO"
      );
    }

    /**
     * ==========================================================
     * IMAGENS
     * ==========================================================
     *
     * O anúncio precisa possuir pelo menos uma imagem antes
     * de ser enviado para moderação.
     */
    const imagens =
      await this.imagemRepository.find({
        where: {
          classificadoId:
            classificado.id,
        },

        order: {
          ordem: "ASC",
          id: "ASC",
        },
      });

    if (imagens.length === 0) {
      throw new Error(
        "CLASSIFICADO_IMAGEM_OBRIGATORIA"
      );
    }

    /**
     * ==========================================================
     * RECORRÊNCIA DOS ÚLTIMOS 30 DIAS
     * ==========================================================
     *
     * Calculada no backend.
     *
     * Inclui o anúncio atual.
     *
     * A recorrência sozinha NÃO bloqueia.
     */
    const dataLimite =
      new Date();

    dataLimite.setDate(
      dataLimite.getDate() - 30
    );

    const quantidadeAnunciosRecentes =
      await this.classificadoRepository
        .createQueryBuilder(
          "classificado"
        )
        .where(
          "classificado.usuario_id = :usuarioId",
          {
            usuarioId:
              classificado.usuarioId,
          }
        )
        .andWhere(
          "classificado.created_at >= :dataLimite",
          {
            dataLimite,
          }
        )
        .getCount();

    /**
     * ==========================================================
     * MODERAÇÃO TEXTUAL
     * ==========================================================
     */
    const moderacao =
      classificadoModeracaoService.analisar({
        titulo:
          classificado.titulo,

        descricao:
          classificado.descricao,

        quantidadeAnunciosRecentes,
      });

    /**
     * ==========================================================
     * MODERAÇÃO VISUAL
     * ==========================================================
     *
     * Todas as imagens vinculadas ao anúncio são analisadas.
     */
    const moderacaoImagens =
      await classificadoImagemModeracaoService
        .analisarImagens(
          imagens.map((imagem) => ({
            id: imagem.id,
            url: imagem.url,
          }))
        );

    console.log(
      "[CLASSIFICADO_MODERACAO_IMAGENS]",
      JSON.stringify(
        {
          classificadoId:
            classificado.id,

          resultado:
            moderacaoImagens,
        },
        null,
        2
      )
    );

    /**
     * ==========================================================
     * DECISÃO CONSOLIDADA
     * ==========================================================
     *
     * O anúncio somente poderá seguir para pagamento quando:
     *
     * - o texto estiver permitido;
     * - todas as imagens estiverem permitidas.
     */

    const permitidoFinal =
      moderacao.permitido &&
      moderacaoImagens.permitido;

    /**
     * O destino detectado pelo texto tem prioridade.
     *
     * Se o texto não determinar um destino, utilizamos
     * o destino identificado pela moderação visual.
     */
    const destinoFinal =
      moderacao.destino ??
      moderacaoImagens.destino;

    /**
     * Casos especiais da moderação visual.
     */
    const conteudoImproprio =
      moderacaoImagens.classificacao ===
      "CONTEUDO_IMPROPRIO";

    const analiseIndeterminada =
      moderacaoImagens.classificacao ===
      "INDETERMINADO";

    /**
     * Consolida os motivos encontrados pelo texto e pelas
     * imagens sem gerar motivos duplicados.
     */
    const motivosFinais =
      Array.from(
        new Set([
          ...moderacao.motivos,
          ...moderacaoImagens.motivos,
        ])
      );

    /**
     * Classificação final utilizada para auditoria.
     *
     * Se a moderação textual bloqueou, preservamos sua
     * classificação.
     *
     * Caso o texto esteja permitido e a imagem tenha
     * identificado o problema, utilizamos a classificação
     * visual.
     */
    const classificacaoFinal =
      !moderacao.permitido
        ? moderacao.classificacao
        : moderacaoImagens.classificacao;

    /**
     * ==========================================================
     * TRANSAÇÃO
     * ==========================================================
     */
    const classificadoAtualizado =
      await AppDataSource.transaction(
        async (manager) => {
          const classificadoRepo =
            manager.getRepository(
              Classificado
            );

          const eventoRepo =
            manager.getRepository(
              ClassificadoEvento
            );

          /**
           * Recarrega dentro da transação.
           */
          const atual =
            await classificadoRepo.findOne({
              where: {
                id:
                  classificado.id,

                usuarioId:
                  classificado.usuarioId,
              },
            });

          if (!atual) {
            throw new Error(
              "CLASSIFICADO_NAO_ENCONTRADO"
            );
          }

          if (
            atual.status !==
            ClassificadoStatus.RASCUNHO
          ) {
            throw new Error(
              "CLASSIFICADO_NAO_E_RASCUNHO"
            );
          }

          /**
           * ====================================================
           * VENDA OCASIONAL PERMITIDA
           * ====================================================
           */
          if (permitidoFinal) {
            atual.status =
              ClassificadoStatus.AGUARDANDO_PAGAMENTO;

            const salvo =
              await classificadoRepo.save(
                atual
              );

            await eventoRepo.save(
              eventoRepo.create({
                classificadoId:
                  salvo.id,

                usuarioId:
                  salvo.usuarioId,

                tipo:
                  ClassificadoEventoTipo.ANALISADO,

                origem:
                  ClassificadoEventoOrigem.CLASSIFICADOS,

                detalhes: {
                  permitido:
                    true,

                  classificacao:
                    moderacao.classificacao,

                  destino:
                    null,

                  motivos:
                    motivosFinais,

                  scoreComercial:
                    moderacao.scoreComercial,

                  quantidadeAnunciosRecentes,

                  moderacaoTexto: {
                    permitido:
                      moderacao.permitido,

                    classificacao:
                      moderacao.classificacao,

                    destino:
                      moderacao.destino,

                    motivos:
                      moderacao.motivos,

                    scoreComercial:
                      moderacao.scoreComercial,
                  },

                  moderacaoImagens: {
                    permitido:
                      moderacaoImagens.permitido,

                    classificacao:
                      moderacaoImagens.classificacao,

                    destino:
                      moderacaoImagens.destino,

                    motivos:
                      moderacaoImagens.motivos,

                    imagens:
                      moderacaoImagens.imagens,
                  },

                  statusAnterior:
                    ClassificadoStatus.RASCUNHO,

                  statusAtual:
                    ClassificadoStatus.AGUARDANDO_PAGAMENTO,
                },
              })
            );

            return salvo;
          }

          /**
           * ====================================================
           * CONTEÚDO IMPRÓPRIO
           * ====================================================
           *
           * Conteúdo impróprio:
           *
           * - não segue para pagamento;
           * - não é tratado como atividade comercial;
           * - não é encaminhado para empreendedor/prestador;
           * - fica REJEITADO.
           */
          if (conteudoImproprio) {
            atual.status =
              ClassificadoStatus.REJEITADO;

            const salvo =
              await classificadoRepo.save(
                atual
              );

            await eventoRepo.save(
              eventoRepo.create({
                classificadoId:
                  salvo.id,

                usuarioId:
                  salvo.usuarioId,

                tipo:
                  ClassificadoEventoTipo.ANALISADO,

                origem:
                  ClassificadoEventoOrigem.CLASSIFICADOS,

                detalhes: {
                  permitido:
                    false,

                  classificacao:
                    moderacaoImagens.classificacao,

                  destino:
                    null,

                  motivos:
                    motivosFinais,

                  scoreComercial:
                    moderacao.scoreComercial,

                  quantidadeAnunciosRecentes,

                  moderacaoTexto: {
                    permitido:
                      moderacao.permitido,

                    classificacao:
                      moderacao.classificacao,

                    destino:
                      moderacao.destino,

                    motivos:
                      moderacao.motivos,

                    scoreComercial:
                      moderacao.scoreComercial,
                  },

                  moderacaoImagens: {
                    permitido:
                      moderacaoImagens.permitido,

                    classificacao:
                      moderacaoImagens.classificacao,

                    destino:
                      moderacaoImagens.destino,

                    motivos:
                      moderacaoImagens.motivos,

                    imagens:
                      moderacaoImagens.imagens,
                  },

                  statusAnterior:
                    ClassificadoStatus.RASCUNHO,

                  statusAtual:
                    ClassificadoStatus.REJEITADO,
                },
              })
            );

            return salvo;
          }

          /**
           * ====================================================
           * ANÁLISE INDETERMINADA
           * ====================================================
           *
           * A IA não teve segurança suficiente para tomar
           * uma decisão automática.
           *
           * O anúncio NÃO segue para pagamento.
           */
          if (analiseIndeterminada) {
            atual.status =
              ClassificadoStatus.EM_ANALISE;

            const salvo =
              await classificadoRepo.save(
                atual
              );

            await eventoRepo.save(
              eventoRepo.create({
                classificadoId:
                  salvo.id,

                usuarioId:
                  salvo.usuarioId,

                tipo:
                  ClassificadoEventoTipo.ANALISADO,

                origem:
                  ClassificadoEventoOrigem.CLASSIFICADOS,

                detalhes: {
                  permitido:
                    false,

                  classificacao:
                    moderacaoImagens.classificacao,

                  destino:
                    null,

                  motivos:
                    motivosFinais,

                  scoreComercial:
                    moderacao.scoreComercial,

                  quantidadeAnunciosRecentes,

                  moderacaoTexto: {
                    permitido:
                      moderacao.permitido,

                    classificacao:
                      moderacao.classificacao,

                    destino:
                      moderacao.destino,

                    motivos:
                      moderacao.motivos,

                    scoreComercial:
                      moderacao.scoreComercial,
                  },

                  moderacaoImagens: {
                    permitido:
                      moderacaoImagens.permitido,

                    classificacao:
                      moderacaoImagens.classificacao,

                    destino:
                      moderacaoImagens.destino,

                    motivos:
                      moderacaoImagens.motivos,

                    imagens:
                      moderacaoImagens.imagens,
                  },

                  statusAnterior:
                    ClassificadoStatus.RASCUNHO,

                  statusAtual:
                    ClassificadoStatus.EM_ANALISE,
                },
              })
            );

            return salvo;
          }

          /**
           * ====================================================
           * BLOQUEIO COMERCIAL / SERVIÇO
           * ====================================================
           *
           * Chegamos aqui quando:
           *
           * - o texto detectou atividade comercial/serviço; ou
           * - uma imagem detectou atividade comercial/serviço.
           */
          atual.status =
            ClassificadoStatus.BLOQUEADO_COMERCIAL;

          const salvo =
            await classificadoRepo.save(
              atual
            );

          /**
           * Resultado consolidado da análise.
           */
          await eventoRepo.save(
            eventoRepo.create({
              classificadoId:
                salvo.id,

              usuarioId:
                salvo.usuarioId,

              tipo:
                ClassificadoEventoTipo.ANALISADO,

              origem:
                ClassificadoEventoOrigem.CLASSIFICADOS,

              detalhes: {
                permitido:
                  false,

                classificacao:
                  classificacaoFinal,

                destino:
                  destinoFinal,

                motivos:
                  motivosFinais,

                scoreComercial:
                  moderacao.scoreComercial,

                quantidadeAnunciosRecentes,

                moderacaoTexto: {
                  permitido:
                    moderacao.permitido,

                  classificacao:
                    moderacao.classificacao,

                  destino:
                    moderacao.destino,

                  motivos:
                    moderacao.motivos,

                  scoreComercial:
                    moderacao.scoreComercial,
                },

                moderacaoImagens: {
                  permitido:
                    moderacaoImagens.permitido,

                  classificacao:
                    moderacaoImagens.classificacao,

                  destino:
                    moderacaoImagens.destino,

                  motivos:
                    moderacaoImagens.motivos,

                  imagens:
                    moderacaoImagens.imagens,
                },

                statusAnterior:
                  ClassificadoStatus.RASCUNHO,

                statusAtual:
                  ClassificadoStatus.BLOQUEADO_COMERCIAL,
              },
            })
          );

          /**
           * Evento específico de bloqueio.
           */
          await eventoRepo.save(
            eventoRepo.create({
              classificadoId:
                salvo.id,

              usuarioId:
                salvo.usuarioId,

              tipo:
                ClassificadoEventoTipo.BLOQUEADO_COMERCIAL,

              origem:
                ClassificadoEventoOrigem.CLASSIFICADOS,

              detalhes: {
                classificacao:
                  classificacaoFinal,

                destino:
                  destinoFinal,

                motivos:
                  motivosFinais,

                scoreComercial:
                  moderacao.scoreComercial,

                moderacaoTexto: {
                  classificacao:
                    moderacao.classificacao,

                  destino:
                    moderacao.destino,

                  motivos:
                    moderacao.motivos,
                },

                moderacaoImagens: {
                  classificacao:
                    moderacaoImagens.classificacao,

                  destino:
                    moderacaoImagens.destino,

                  motivos:
                    moderacaoImagens.motivos,
                },
              },
            })
          );

          /**
           * ====================================================
           * ENCAMINHAMENTO PARA EMPREENDEDOR
           * ====================================================
           */
          if (
            destinoFinal ===
            "EMPREENDEDOR"
          ) {
            await eventoRepo.save(
              eventoRepo.create({
                classificadoId:
                  salvo.id,

                usuarioId:
                  salvo.usuarioId,

                tipo:
                  ClassificadoEventoTipo.ENCAMINHADO_EMPREENDEDOR,

                origem:
                  ClassificadoEventoOrigem.CLASSIFICADOS,

                detalhes: {
                  motivo:
                    "ATIVIDADE_COMERCIAL",

                  classificacao:
                    classificacaoFinal,

                  destino:
                    destinoFinal,

                  motivos:
                    motivosFinais,

                  scoreComercial:
                    moderacao.scoreComercial,

                  origemDeteccao:
                    moderacao.destino ===
                      "EMPREENDEDOR"
                      ? "TEXTO"
                      : "IMAGEM",
                },
              })
            );
          }

          /**
           * ====================================================
           * ENCAMINHAMENTO PARA PRESTADOR
           * ====================================================
           */
          if (
            destinoFinal ===
            "PRESTADOR"
          ) {
            await eventoRepo.save(
              eventoRepo.create({
                classificadoId:
                  salvo.id,

                usuarioId:
                  salvo.usuarioId,

                tipo:
                  ClassificadoEventoTipo.ENCAMINHADO_PRESTADOR,

                origem:
                  ClassificadoEventoOrigem.CLASSIFICADOS,

                detalhes: {
                  motivo:
                    "PRESTACAO_SERVICO",

                  classificacao:
                    classificacaoFinal,

                  destino:
                    destinoFinal,

                  motivos:
                    motivosFinais,

                  scoreComercial:
                    moderacao.scoreComercial,

                  origemDeteccao:
                    moderacao.destino ===
                      "PRESTADOR"
                      ? "TEXTO"
                      : "IMAGEM",
                },
              })
            );
          }

          return salvo;
        }
      );

    return {
      classificado:
        classificadoAtualizado,

      moderacao,

      moderacaoImagens,
    };
  }

  /**
   * ============================================================
   * PUBLICAR CLASSIFICADO
   * ============================================================
   */
  public async publicar(
    classificadoIdInformado: string,
    usuarioIdInformado: string
  ): Promise<Classificado> {
    const classificadoId = this.normalizarTexto(classificadoIdInformado);
    const usuarioId = this.normalizarTexto(usuarioIdInformado);

    if (!classificadoId) throw new Error("CLASSIFICADO_ID_OBRIGATORIO");
    if (!usuarioId) throw new Error("CLASSIFICADO_USUARIO_OBRIGATORIO");

    return AppDataSource.transaction(async (manager) => {
      const classificadoRepo = manager.getRepository(Classificado);
      const eventoRepo = manager.getRepository(ClassificadoEvento);

      const classificado = await classificadoRepo
        .createQueryBuilder("classificado")
        .setLock("pessimistic_write")
        .where("classificado.id = :classificadoId", { classificadoId })
        .getOne();

      if (!classificado) throw new Error("CLASSIFICADO_NAO_ENCONTRADO");
      if (classificado.usuarioId !== usuarioId) {
        throw new Error("CLASSIFICADO_NAO_PERTENCE_AO_USUARIO");
      }
      if (classificado.status !== ClassificadoStatus.AGUARDANDO_PAGAMENTO) {
        throw new Error("CLASSIFICADO_NAO_AGUARDA_PAGAMENTO");
      }
      if (!classificado.creditoId) throw new Error("CLASSIFICADO_SEM_CREDITO");

      const duracaoDias = Number(classificado.duracaoDias);
      if (!Number.isInteger(duracaoDias) || duracaoDias <= 0) {
        throw new Error("CLASSIFICADO_DURACAO_INVALIDA");
      }

      const agora = new Date();
      const expiraEm = new Date(agora.getTime());
      expiraEm.setDate(expiraEm.getDate() + duracaoDias);

      classificado.status = ClassificadoStatus.ATIVO;
      classificado.publicadoEm = agora;
      classificado.expiraEm = expiraEm;

      const salvo = await classificadoRepo.save(classificado);

      await eventoRepo.save(
        eventoRepo.create({
          classificadoId: salvo.id,
          usuarioId: salvo.usuarioId,
          tipo: ClassificadoEventoTipo.PUBLICADO,
          origem: ClassificadoEventoOrigem.CLASSIFICADOS,
          detalhes: {
            statusAnterior: ClassificadoStatus.AGUARDANDO_PAGAMENTO,
            statusAtual: ClassificadoStatus.ATIVO,
            creditoId: salvo.creditoId,
            duracaoDias,
            publicadoEm: salvo.publicadoEm,
            expiraEm: salvo.expiraEm,
          },
        })
      );

      return salvo;
    });
  }

  /**
   * ============================================================
   * MARCAR COMO VENDIDO
   * ============================================================
   */
  public async marcarComoVendido(
    classificadoIdInformado: string,
    usuarioIdInformado: string
  ): Promise<Classificado> {
    const classificadoId = this.normalizarTexto(classificadoIdInformado);
    const usuarioId = this.normalizarTexto(usuarioIdInformado);

    if (!classificadoId) throw new Error("CLASSIFICADO_ID_OBRIGATORIO");
    if (!usuarioId) throw new Error("CLASSIFICADO_USUARIO_OBRIGATORIO");

    return AppDataSource.transaction(async (manager) => {
      const classificadoRepo = manager.getRepository(Classificado);
      const eventoRepo = manager.getRepository(ClassificadoEvento);

      const classificado = await classificadoRepo.findOne({
        where: { id: classificadoId, usuarioId },
      });

      if (!classificado) throw new Error("CLASSIFICADO_NAO_ENCONTRADO");
      if (classificado.status !== ClassificadoStatus.ATIVO) {
        throw new Error("CLASSIFICADO_NAO_ESTA_PUBLICADO");
      }
      if (!classificado.creditoId) throw new Error("CLASSIFICADO_SEM_CREDITO");

      const vendidoEm = new Date();

      const encerramento =
        await classificadoCreditoService.encerrarUsoCreditoComManager(
          manager,
          classificado.id,
          usuarioId,
          "VENDIDO",
          vendidoEm
        );

      const atualizado = await classificadoRepo.findOne({
        where: { id: classificado.id, usuarioId },
      });

      if (!atualizado) {
        throw new Error("CLASSIFICADO_NAO_ENCONTRADO_APOS_ENCERRAMENTO");
      }

      atualizado.status = ClassificadoStatus.VENDIDO;
      atualizado.vendidoEm = vendidoEm;
      atualizado.expiraEm = null;

      const salvo = await classificadoRepo.save(atualizado);

      await eventoRepo.save(
        eventoRepo.create({
          classificadoId: salvo.id,
          usuarioId: salvo.usuarioId,
          tipo: ClassificadoEventoTipo.VENDIDO,
          origem: ClassificadoEventoOrigem.CLASSIFICADOS,
          detalhes: {
            vendidoEm,
            diasUtilizados: encerramento.diasUtilizados,
            saldoAnterior: encerramento.saldoAnterior,
            saldoPosterior: encerramento.saldoPosterior,
            creditoId: encerramento.credito.id,
          },
        })
      );

      return salvo;
    });
  }

}

export default new ClassificadoService();