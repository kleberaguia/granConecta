import { EntityManager } from "typeorm";

import { CondominioUnidade } from "../models/CondominioUnidadeModel";

import {
  UsuarioCondominioUnidade,
  UsuarioCondominioTipoVinculo,
  UsuarioCondominioStatusValidacao,
} from "../models/UsuarioCondominioUnidadeModel";

type VincularUsuarioInput = {
  manager: EntityManager;

  usuarioId: string;

  condominioId: string;

  /**
   * Forma preferencial.
   *
   * Quando o frontend acabou de chamar:
   *
   * POST /api/condominio/solicitar-cadastro
   *
   * ele já possui o ID exato da unidade.
   */
  condominioUnidadeId?: string | null;

  /**
   * Mantidos como fallback e para compatibilidade
   * com o formulário atual.
   */
  blocoTorre?: string | null;

  unidadeApto?: string | null;

  tipoVinculo?: UsuarioCondominioTipoVinculo;

  principal?: boolean;
};

type VincularUsuarioResult = {
  vinculo: UsuarioCondominioUnidade;
  unidade: CondominioUnidade;
  vinculoCriado: boolean;
};

export class UsuarioCondominioUnidadeService {
  /**
   * Normaliza bloco/torre para o mesmo padrão utilizado
   * no cadastro das unidades.
   *
   * Exemplos:
   *
   * "Torre 1" -> "T1"
   * "torre 2" -> "T2"
   * "T3"      -> "T3"
   * "Bloco A" -> "BA"
   * "BLOCO B" -> "BB"
   */
  private normalizarBlocoTorre(
    valor: string
  ): string {
    const texto = String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");

    if (!texto) {
      throw new Error(
        "BLOCO_TORRE_OBRIGATORIO"
      );
    }

    const torre = texto.match(
      /^TORRE\s*([A-Z0-9]+)$/
    );

    if (torre?.[1]) {
      return `T${torre[1]}`;
    }

    const bloco = texto.match(
      /^BLOCO\s*([A-Z0-9]+)$/
    );

    if (bloco?.[1]) {
      return `B${bloco[1]}`;
    }

    return texto.replace(
      /[^A-Z0-9]/g,
      ""
    );
  }

  /**
   * Normaliza o número/nome da unidade.
   *
   * Exemplos:
   *
   * "1501"      -> "1501"
   * "Apto 1501" -> "1501"
   * "AP 1501"   -> "1501"
   */
  private normalizarUnidade(
    valor: string
  ): string {
    let texto = String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();

    texto = texto
      .replace(
        /^(APARTAMENTO|APTO|AP)\s*/i,
        ""
      )
      .replace(/\s+/g, "")
      .replace(
        /[^A-Z0-9\-]/g,
        ""
      );

    if (!texto) {
      throw new Error(
        "UNIDADE_APARTAMENTO_OBRIGATORIA"
      );
    }

    return texto;
  }

  /**
   * Localiza a unidade residencial.
   *
   * Prioridade:
   *
   * 1. condominioUnidadeId
   * 2. condominioId + bloco + unidade
   *
   * Mesmo quando recebemos o ID da unidade,
   * também validamos condominio_id.
   *
   * Isso impede que alguém envie:
   *
   * condominio_id = A
   * condominio_unidade_id = unidade do condomínio B
   */
  private async localizarUnidade(
    input: VincularUsuarioInput
  ): Promise<CondominioUnidade> {
    const {
      manager,
      condominioId,
      condominioUnidadeId,
      blocoTorre,
      unidadeApto,
    } = input;

    if (!condominioId) {
      throw new Error(
        "CONDOMINIO_OBRIGATORIO"
      );
    }

    /**
     * Caminho preferencial:
     * usamos o UUID devolvido pelo endpoint
     * /solicitar-cadastro.
     */
    if (condominioUnidadeId) {
      const unidade =
        await manager.findOne(
          CondominioUnidade,
          {
            where: {
              id: condominioUnidadeId,
              condominio_id:
                condominioId,
            },
          }
        );

      if (!unidade) {
        throw new Error(
          "UNIDADE_NAO_PERTENCE_AO_CONDOMINIO"
        );
      }

      return unidade;
    }

    /**
     * Compatibilidade com o formulário antigo.
     */
    if (!blocoTorre) {
      throw new Error(
        "BLOCO_TORRE_OBRIGATORIO"
      );
    }

    if (!unidadeApto) {
      throw new Error(
        "UNIDADE_APARTAMENTO_OBRIGATORIA"
      );
    }

    const blocoNormalizado =
      this.normalizarBlocoTorre(
        blocoTorre
      );

    const unidadeNormalizada =
      this.normalizarUnidade(
        unidadeApto
      );

    const unidade =
      await manager.findOne(
        CondominioUnidade,
        {
          where: {
            condominio_id:
              condominioId,

            bloco_torre:
              blocoNormalizado,

            unidade_apto:
              unidadeNormalizada,
          },
        }
      );

    if (!unidade) {
      throw new Error(
        "UNIDADE_CONDOMINIO_NAO_ENCONTRADA"
      );
    }

    return unidade;
  }

  /**
   * Cria ou reutiliza o vínculo:
   *
   * Usuario
   *    ↓
   * UsuarioCondominioUnidade
   *    ↓
   * CondominioUnidade
   *
   * Este método NÃO abre transação.
   *
   * O EntityManager deve vir da transação
   * que está criando o usuário.
   */
  public async vincularUsuario(
    input: VincularUsuarioInput
  ): Promise<VincularUsuarioResult> {
    const {
      manager,
      usuarioId,
      tipoVinculo =
        UsuarioCondominioTipoVinculo.MORADOR,
      principal = true,
    } = input;

    if (!manager) {
      throw new Error(
        "ENTITY_MANAGER_OBRIGATORIO"
      );
    }

    if (!usuarioId) {
      throw new Error(
        "USUARIO_OBRIGATORIO"
      );
    }

    const unidade =
      await this.localizarUnidade(
        input
      );

    /**
     * Idempotência:
     *
     * se o usuário já estiver associado à mesma
     * unidade, não criamos outro registro.
     */
    const vinculoExistente =
      await manager.findOne(
        UsuarioCondominioUnidade,
        {
          where: {
            usuario_id:
              usuarioId,

            condominio_unidade_id:
              unidade.id,
          },
        }
      );

    if (vinculoExistente) {
      return {
        vinculo:
          vinculoExistente,

        unidade,

        vinculoCriado:
          false,
      };
    }

    /**
     * Se este vínculo será o principal,
     * desmarcamos vínculos principais anteriores
     * do mesmo usuário.
     *
     * Isso já deixa a estrutura preparada para
     * múltiplas residências no futuro.
     */
    if (principal) {
      await manager
        .createQueryBuilder()
        .update(
          UsuarioCondominioUnidade
        )
        .set({
          principal: false,
        })
        .where(
          "usuario_id = :usuarioId",
          {
            usuarioId,
          }
        )
        .andWhere(
          "principal = :principal",
          {
            principal: true,
          }
        )
        .execute();
    }

    const novoVinculo =
      manager.create(
        UsuarioCondominioUnidade,
        {
          usuario_id:
            usuarioId,

          condominio_unidade_id:
            unidade.id,

          tipo_vinculo:
            tipoVinculo,

          /**
           * O cadastro por declaração NÃO
           * transforma automaticamente a pessoa
           * em morador residencialmente verificado.
           */
          status_validacao:
            UsuarioCondominioStatusValidacao.PENDENTE,

          principal,
        }
      );

    const vinculoSalvo =
      await manager.save(
        novoVinculo
      );

    return {
      vinculo:
        vinculoSalvo,

      unidade,

      vinculoCriado:
        true,
    };
  }
}

export default UsuarioCondominioUnidadeService;