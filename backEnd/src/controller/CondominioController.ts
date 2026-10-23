import { Request, Response } from "express";

import CreateCondominioService from "../services/CreateCondominioService";
import CondominioCadastroPublicoService from "../services/CondominioCadastroPublicoService";

import { AppDataSource } from "../config/data-source";
import { Condominio } from "../models/condominiosModels";
import CepService from "../services/address/CepService";

export default class CondominioController {
  /**
   * ============================================================
   * CADASTRO ADMINISTRATIVO
   * ============================================================
   *
   * Preserva o comportamento existente:
   * - objeto único
   * - lote de condomínios
   *
   * A proteção ADMIN continua sendo feita na rota.
   */
  public async create(
    request: Request,
    response: Response
  ): Promise<Response> {
    const createCondominio =
      new CreateCondominioService();

    const dados = request.body;

    try {
      // Verifica se é Array (Lote) ou Objeto (Único)
      if (Array.isArray(dados)) {
        const condominios =
          await createCondominio.executeBatch(dados);

        return response.status(201).json(condominios);
      }

      const condominio =
        await createCondominio.execute(dados);

      return response.status(201).json(condominio);
    } catch (err: any) {
      console.error(
        "[CondominioController.create]",
        err
      );

      return response.status(400).json({
        error:
          err?.message ||
          "Erro ao criar condomínio.",
      });
    }
  }


  /**
 * ============================================================
 * CONSULTA PÚBLICA DE CEP
 * ============================================================
 *
 * Utilizada durante o cadastro antes de o usuário possuir token.
 *
 * Reutiliza exatamente o mesmo CepService utilizado pelo
 * CondominioCadastroPublicoService.
 *
 * Não expõe latitude/longitude para o frontend.
 */
public async consultarCep(
  request: Request,
  response: Response
): Promise<Response> {
  try {
    const cepInformado = String(
      request.params.cep || ""
    );

    const cep = cepInformado.replace(
      /\D/g,
      ""
    );

    if (!/^\d{8}$/.test(cep)) {
      return response.status(400).json({
        success: false,
        error: "CEP_INVALIDO",
        message:
          "Informe um CEP válido com 8 números.",
      });
    }

    const endereco =
      await CepService.consultar(cep);

    /*
     * Não devolvemos:
     *
     * latitude
     * longitude
     *
     * As coordenadas continuam sendo utilizadas
     * exclusivamente pelo backend.
     */
    return response.status(200).json({
      success: true,

      endereco: {
        cep:
          endereco.cep || cep,

        logradouro:
          endereco.logradouro || "",

        bairro:
          endereco.bairro || "",

        cidade:
          endereco.cidade || "",

        uf:
          endereco.uf || "",
      },
    });
  } catch (error: any) {
    const codigo = String(
      error?.message || ""
    );

    console.error(
      "[CondominioController.consultarCep]",
      error
    );

    switch (codigo) {
      case "CEP_INVALIDO":
        return response.status(400).json({
          success: false,
          error: codigo,
          message:
            "O CEP informado é inválido.",
        });

      case "CEP_NAO_ENCONTRADO":
        return response.status(404).json({
          success: false,
          error: codigo,
          message:
            "Não foi possível localizar o CEP informado.",
        });

      default:
        return response.status(500).json({
          success: false,
          error: "ERRO_CONSULTA_CEP",
          message:
            "Não foi possível consultar o CEP. Tente novamente.",
        });
    }
  }
}

  /**
   * ============================================================
   * CADASTRO PÚBLICO CONTROLADO
   * ============================================================
   *
   * Utilizado durante o cadastro do morador quando
   * o condomínio ainda não aparece na lista.
   *
   * IMPORTANTE:
   * não aceitamos do frontend:
   *
   * - latitude
   * - longitude
   * - sigla
   * - codigo_acesso
   * - status_validacao
   * - geocoding_status
   *
   * Esses valores são determinados exclusivamente
   * pelo backend.
   */
  public async solicitarCadastro(
    request: Request,
    response: Response
  ): Promise<Response> {
    try {
      const {
        nome,
        cep,
        numero,
        complemento,
        bloco_torre,
        unidade_apto,
      } = request.body || {};

      /**
       * Validação básica de payload.
       *
       * As validações de negócio continuam dentro
       * do service.
       */
      if (
        typeof nome !== "string" ||
        !nome.trim()
      ) {
        return response.status(400).json({
          error: "NOME_CONDOMINIO_OBRIGATORIO",
          message:
            "Informe o nome do condomínio.",
        });
      }

      if (
        typeof cep !== "string" ||
        !cep.trim()
      ) {
        return response.status(400).json({
          error: "CEP_OBRIGATORIO",
          message: "Informe o CEP.",
        });
      }

      if (
        typeof numero !== "string" &&
        typeof numero !== "number"
      ) {
        return response.status(400).json({
          error: "NUMERO_CONDOMINIO_OBRIGATORIO",
          message:
            "Informe o número do condomínio.",
        });
      }

      if (
        typeof bloco_torre !== "string" ||
        !bloco_torre.trim()
      ) {
        return response.status(400).json({
          error: "BLOCO_TORRE_OBRIGATORIO",
          message:
            "Informe o bloco ou torre.",
        });
      }

      if (
        typeof unidade_apto !== "string" &&
        typeof unidade_apto !== "number"
      ) {
        return response.status(400).json({
          error:
            "UNIDADE_APARTAMENTO_OBRIGATORIA",
          message:
            "Informe a unidade ou apartamento.",
        });
      }

      const service =
        new CondominioCadastroPublicoService();

      const resultado = await service.execute({
        nome: String(nome).trim(),

        cep: String(cep).trim(),

        numero: String(numero).trim(),

        complemento:
          complemento === undefined ||
          complemento === null ||
          String(complemento).trim() === ""
            ? null
            : String(complemento).trim(),

        bloco_torre:
          String(bloco_torre).trim(),

        unidade_apto:
          String(unidade_apto).trim(),
      });

      /**
       * Não devolvemos a entidade Condominio inteira.
       *
       * Assim evitamos expor:
       *
       * - codigo_acesso
       * - latitude
       * - longitude
       * - informações internas desnecessárias
       */
      return response.status(
        resultado.condominioCriado ? 201 : 200
      ).json({
        success: true,

        condominio: {
          id: resultado.condominio.id,
          nome: resultado.condominio.nome,
          sigla: resultado.condominio.sigla,
          cep: resultado.condominio.cep,

          logradouro:
            resultado.condominio.logradouro,

          numero:
            resultado.condominio.numero,

          complemento:
            resultado.condominio.complemento,

          bairro:
            resultado.condominio.bairro,

          cidade:
            resultado.condominio.cidade,

          uf:
            resultado.condominio.uf,

          status_validacao:
            resultado.condominio.status_validacao,
        },

        unidade: {
          id: resultado.unidade.id,

          bloco_torre:
            resultado.unidade.bloco_torre,

          unidade_apto:
            resultado.unidade.unidade_apto,

          codigo_unidade:
            resultado.unidade.codigo_unidade,

          status_validacao:
            resultado.unidade.status_validacao,
        },

        condominioCriado:
          resultado.condominioCriado,

        unidadeCriada:
          resultado.unidadeCriada,
      });
    } catch (error: any) {
      const codigo =
        String(error?.message || "");

      console.error(
        "[CondominioController.solicitarCadastro]",
        error
      );

      switch (codigo) {
        case "CEP_INVALIDO":
          return response.status(400).json({
            error: codigo,
            message:
              "O CEP informado é inválido.",
          });

        case "CEP_NAO_ENCONTRADO":
          return response.status(404).json({
            error: codigo,
            message:
              "Não foi possível localizar o CEP informado.",
          });

        case "NOME_CONDOMINIO_INVALIDO":
          return response.status(400).json({
            error: codigo,
            message:
              "Informe um nome válido para o condomínio.",
          });

        case "NUMERO_CONDOMINIO_OBRIGATORIO":
          return response.status(400).json({
            error: codigo,
            message:
              "Informe o número do condomínio.",
          });

        case "BLOCO_TORRE_OBRIGATORIO":
        case "BLOCO_TORRE_INVALIDO":
          return response.status(400).json({
            error: codigo,
            message:
              "Informe um bloco ou torre válido.",
          });

        case "UNIDADE_APARTAMENTO_OBRIGATORIA":
        case "UNIDADE_INVALIDA":
          return response.status(400).json({
            error: codigo,
            message:
              "Informe uma unidade ou apartamento válido.",
          });

        case "CODIGO_UNIDADE_EM_CONFLITO":
          return response.status(409).json({
            error: codigo,
            message:
              "A identificação desta unidade entrou em conflito com outro cadastro.",
          });

        case "SIGLA_CONDOMINIO_NAO_DEFINIDA":
        case "NAO_FOI_POSSIVEL_GERAR_SIGLA_CONDOMINIO":
        case "NAO_FOI_POSSIVEL_GERAR_CODIGO_CONDOMINIO":
          return response.status(500).json({
            error: codigo,
            message:
              "Não foi possível concluir o cadastro do condomínio.",
          });

        default:
          return response.status(500).json({
            error: "ERRO_CADASTRO_CONDOMINIO",
            message:
              "Não foi possível concluir o cadastro. Tente novamente.",
          });
      }
    }
  }

  /**
   * ============================================================
   * VALIDAÇÃO DO CÓDIGO LEGADO
   * ============================================================
   *
   * Preservado para compatibilidade.
   */
  public async validarCodigo(
    req: Request,
    res: Response
  ): Promise<Response> {
    const createCondominio =
      new CreateCondominioService();

    try {
      const result =
        await createCondominio.validarCodigoParaUsuario(
          req.body.codigo,
          req.body.usuarioId
        );

      return res.status(201).json(result);
    } catch (error: any) {
      console.error(
        "ERRO NO REGISTRO:",
        error.message
      );

      return res.status(400).json({
        error: error.message,
      });
    }
  }

  /**
   * ============================================================
   * BUSCAR CONDOMÍNIO POR ID
   * ============================================================
   */
  public async getIdCondominio(
    request: Request,
    response: Response
  ): Promise<Response> {
    const { id } = request.params;

    if (!id) {
      return response.status(400).json({
        message:
          "O ID do condomínio é obrigatório.",
      });
    }

    const condominioRepository =
      AppDataSource.getRepository(Condominio);

    const condominio =
      await condominioRepository.findOneBy({
        id,
      });

    if (!condominio) {
      return response.status(404).json({
        message: "Condomínio não encontrado.",
      });
    }

    return response.json(condominio);
  }

  /**
   * ============================================================
   * LISTAR CONDOMÍNIOS
   * ============================================================
   */
  public async index(
    request: Request,
    response: Response
  ): Promise<Response> {
    const condominioRepository =
      AppDataSource.getRepository(Condominio);

    const condominios =
      await condominioRepository.find({
        order: {
          nome: "ASC",
        },
      });

    return response.json(condominios);
  }
}