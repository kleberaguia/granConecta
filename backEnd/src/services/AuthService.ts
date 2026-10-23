import { AppDataSource } from "../config/data-source";
import { Usuario } from "../models/UserModels";
import { UsuarioAuth } from "../models/UsuarioAuthModels";
import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { EmailService } from "./EmailService";
import { Endereco } from "../models/EnderecoModel";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";
import { Store } from "../models/StoreModels";
import { UserStatus } from "../models/enums";
import UsuarioCondominioUnidadeService from "./UsuarioCondominioUnidadeService";
import enderecoGeolocationService from "./EnderecoGeolocationService";
import { WhatsAppConsentimento } from "../models/WhatsAppConsentimentoModel";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "sua_chave_secreta_super_segura";

type LoginInput = {
  email: string;
  password: string;
};

type VerifyEmailInput = {
  email: string;
  codigo: string;
};

type ResetPasswordInput = {
  email: string;
  token: string;
  newPassword: string;
};

type CicloAssinatura =
  | "MENSAL"
  | "TRIMESTRAL"
  | "ANUAL";

type StatusAssinatura =
  | "PENDENTE"
  | "ATIVA"
  | "A_VENCER"
  | "VENCIDA"
  | "CANCELADA";

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

/**
 * Gera um código numérico de seis dígitos.
 */
function gerarCodigo6Digitos(): string {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

/**
 * Normaliza o ciclo recebido pelo frontend.
 *
 * Mantém compatibilidade com o frontend antigo, que pode enviar:
 *
 * tipo_assinatura: "MENSAL"
 *
 * ou com o novo:
 *
 * ciclo_assinatura: "MENSAL"
 */
function normalizarCicloAssinatura(
  valor: unknown
): CicloAssinatura | null {
  const ciclo = String(valor || "")
    .trim()
    .toUpperCase();

  if (
    ciclo === "MENSAL" ||
    ciclo === "TRIMESTRAL" ||
    ciclo === "ANUAL"
  ) {
    return ciclo;
  }

  return null;
}

/**
 * Converte categoria para número, evitando NaN.
 */
function normalizarCategoriaId(
  valor: unknown
): number | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === "" ||
    valor === "OUTRO"
  ) {
    return null;
  }

  const categoriaId = Number(valor);

  return Number.isFinite(categoriaId)
    ? categoriaId
    : null;
}

/**
 * Calcula a situação atual da assinatura.
 *
 * Este cálculo permite que login e /users/me mostrem a situação
 * correta mesmo antes da execução da tarefa automática diária.
 */
function montarResumoAssinatura(
  perfil?: PerfilPrestador | null
) {
  if (!perfil) {
    return null;
  }

  const agora = new Date();

  const dataVencimento =
    perfil.assinatura_vence_em
      ? new Date(perfil.assinatura_vence_em)
      : null;

  const possuiDataVencimentoValida =
    dataVencimento !== null &&
    !Number.isNaN(dataVencimento.getTime());

  let diasRestantes: number | null = null;

  let status: StatusAssinatura =
    perfil.status_assinatura || "PENDENTE";

  /*
   * Uma assinatura cancelada permanece cancelada,
   * mesmo se ainda existir uma data de vencimento futura.
   */
  if (status !== "CANCELADA") {
    if (
      !possuiDataVencimentoValida ||
      !dataVencimento
    ) {
      status = "PENDENTE";
    } else {
      const diferencaEmMs =
        dataVencimento.getTime() -
        agora.getTime();

      if (diferencaEmMs <= 0) {
        diasRestantes = 0;
        status = "VENCIDA";
      } else {
        diasRestantes = Math.ceil(
          diferencaEmMs / UM_DIA_EM_MS
        );

        status =
          diasRestantes <= 10
            ? "A_VENCER"
            : "ATIVA";
      }
    }
  }

  const assinaturaBloqueada =
    perfil.bloqueado_por_assinatura === true ||
    status === "PENDENTE" ||
    status === "VENCIDA" ||
    status === "CANCELADA";

  const podeAcessar =
    (
      status === "ATIVA" ||
      status === "A_VENCER"
    ) &&
    !assinaturaBloqueada;

  return {
    plano: "PREMIUM",

    ciclo:
      perfil.ciclo_assinatura || null,

    status,

    data_inicio:
      perfil.assinatura_iniciada_em || null,

    data_vencimento:
      possuiDataVencimentoValida
        ? dataVencimento
        : null,

    dias_restantes: diasRestantes,

    bloqueado_por_assinatura:
      assinaturaBloqueada,

    // Permite abrir o painel para consultar dados e renovar a assinatura.
    // Operações comerciais continuam condicionadas à assinatura vigente.
    pode_acessar_painel:
      true,

    pode_exibir_pagina:
      podeAcessar,

    payment_status:
      perfil.payment_status || "PENDENTE",

    checkout_url:
      perfil.checkout_url || null,

    checkout_expira_em:
      perfil.checkout_expira_em || null,

    subscription_id:
      perfil.subscription_id || null,

    subscription_renews_at:
      perfil.subscription_renews_at || null,

    subscription_cancelled_at:
      perfil.subscription_cancelled_at || null,
  };
}

/**
 * Busca os dados essenciais do usuário e suas relações.
 */
async function getUserLiteById(
  usuarioId: string
) {
  return AppDataSource
    .getRepository(Usuario)
    .createQueryBuilder("u")
    .leftJoinAndSelect(
      "u.endereco",
      "endereco"
    )
    .leftJoinAndSelect(
      "u.perfil",
      "perfil"
    )
    .leftJoinAndSelect(
      "u.store",
      "store"
    )
    .where(
      "u.id = :id",
      { id: usuarioId }
    )
    .getOne();
}

export const AuthService = {
  // ================================================================
  // 1. LOGIN
  // ================================================================
  async login({
    email,
    password,
  }: LoginInput) {
    const authRepo =
      AppDataSource.getRepository(
        UsuarioAuth
      );

    const emailNormalizado = String(email)
      .trim()
      .toLowerCase();

    const usuarioAuth =
      await authRepo.findOne({
        where: {
          email: emailNormalizado,
        },
        select: [
          "id",
          "email",
          "password_hash",
          "role",
          "isActive",
          "emailVerificado",
          "usuarioId",
        ],
      });

    if (!usuarioAuth?.usuarioId) {
      throw new Error(
        "E-mail ou senha inválidos."
      );
    }

    const senhaBate = await compare(
      password,
      usuarioAuth.password_hash
    );

    if (!senhaBate) {
      throw new Error(
        "E-mail ou senha inválidos."
      );
    }

    const usuario =
      await getUserLiteById(
        usuarioAuth.usuarioId
      );

    if (!usuario) {
      throw new Error(
        "Usuário não encontrado."
      );
    }

    if (
      usuario.status_conta ===
      UserStatus.REJEITADO
    ) {
      throw new Error(
        "Seu cadastro foi rejeitado."
      );
    }

    const token = sign(
      {
        usuarioId: usuario.id,
        role: usuarioAuth.role,
        tipo: usuario.tipo,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const perfilRaw =
      (
        usuario as any
      )?.perfil as PerfilPrestador | null;

    const assinatura =
      montarResumoAssinatura(
        perfilRaw
      );

    /*
     * Mantém o formato "perfis" utilizado pelo Layout atual.
     */
    const perfisApp = perfilRaw
      ? [
        {
          id: perfilRaw.id,

          status:
            perfilRaw.status_aprovacao,

          status_aprovacao:
            perfilRaw.status_aprovacao,

          plano: "PREMIUM",

          tipo_assinatura:
            "PREMIUM",

          ciclo_assinatura:
            perfilRaw.ciclo_assinatura ||
            null,

          status_assinatura:
            assinatura?.status ||
            "PENDENTE",

          assinatura_iniciada_em:
            perfilRaw
              .assinatura_iniciada_em ||
            null,

          assinatura_vence_em:
            perfilRaw
              .assinatura_vence_em ||
            null,

          bloqueado_por_assinatura:
            assinatura
              ?.bloqueado_por_assinatura ??
            true,

          payment_status:
            perfilRaw.payment_status ||
            "PENDENTE",

          checkout_url:
            perfilRaw.checkout_url ||
            null,

          checkout_expira_em:
            perfilRaw
              .checkout_expira_em ||
            null,
        },
      ]
      : [];

    return {
      token,

      user: {
        id: usuario.id,

        usuarioId:
          usuario.id,

        name:
          usuario.name,

        email:
          usuarioAuth.email,

        tipo:
          usuario.tipo,

        status_conta:
          usuario.status_conta,

        is_empreendedor:
          usuario.is_empreendedor,

        is_prestador:
          usuario.is_prestador,

        telefone:
          usuario.telefone,

        emailVerificado:
          usuarioAuth.emailVerificado,

        lojaId:
          usuario.store?.id ||
          null,

        slug:
          usuario.store?.slug ||
          null,

        bloco:
          usuario.endereco
            ?.bloco_torre ??
          null,

        unidade:
          usuario.endereco
            ?.unidade_apto ??
          null,

        condominio_id:
          usuario.condominio_id,

        /*
         * Formato antigo mantido para não quebrar o Layout.
         */
        perfis:
          perfisApp,

        plano:
          perfilRaw
            ? "PREMIUM"
            : null,

        /*
         * Novo objeto padronizado.
         */
        assinatura,
      },
    };
  },

  // ================================================================
  // 2. CADASTRO COM TRANSAÇÃO
  // ================================================================
  async register(data: any) {


    console.log("🔥 [AuthService.register] EXECUTADO", {
      email: data?.email,
      telefone: data?.telefone,
      aceita_utilidade_whatsapp: data?.aceita_utilidade_whatsapp,
      aceita_marketing_whatsapp: data?.aceita_marketing_whatsapp,
    });

    const {
      email,
      name,
      tipo,
      categoriaid,
      condominio_id,
      condominio_unidade_id,
    } = data;

    // Regra de cadastro: pessoa sem condomínio não recebe perfil de morador.
    // Prestadores e empreendedores continuam com o fluxo comercial atual.
    const condominioIdCadastro = String(condominio_id || "").trim() || null;
    const tipoCadastro =
      tipo === "MORADOR" && !condominioIdCadastro &&
      data.is_empreendedor !== true && data.is_empreendedor !== "true" &&
      data.is_prestador !== true && data.is_prestador !== "true"
        ? "VISITANTE"
        : tipo;

    const emailNormalizado =
      String(email || "")
        .trim()
        .toLowerCase();

    const password =
      data.password ||
      data.senha;

    if (
      !emailNormalizado ||
      !password
    ) {
      throw new Error(
        "E-mail e senha são obrigatórios!"
      );
    }

    const authRepo =
      AppDataSource.getRepository(
        UsuarioAuth
      );

    const emailExistente =
      await authRepo.findOne({
        where: {
          email: emailNormalizado,
        },
      });

    if (emailExistente) {
      throw new Error(
        "E-mail já cadastrado!"
      );
    }

    const isEmpreendedor =
      data.is_empreendedor === true ||
      data.is_empreendedor === "true";

    const isPrestador =
      data.is_prestador === true ||
      data.is_prestador === "true" ||
      tipo === "PRESTADOR";

    /*
     * Aceita o campo novo ciclo_assinatura.
     *
     * Também aceita temporariamente tipo_assinatura para não
     * quebrar o formulário antigo.
     *
     * Se o frontend não enviar o ciclo, mantém MENSAL,
     * como já acontecia anteriormente.
     */
    const cicloAssinatura =
      normalizarCicloAssinatura(
        data.ciclo_assinatura ||
        data.tipo_assinatura
      ) || "MENSAL";

    const categoriaNormalizada =
      normalizarCategoriaId(
        categoriaid
      );

    const codigoVerificacao =
      gerarCodigo6Digitos();

    const resultado = await AppDataSource.transaction(
      async (manager) => {
        // ----------------------------------------------------------
        // 1. CRIAÇÃO DO USUÁRIO
        // ----------------------------------------------------------
        const novoUsuario =
          manager.create(
            Usuario,
            {
              name,

              email:
                emailNormalizado,

              telefone:
                data.telefone,

              tipo: tipoCadastro,

              condominio_id:
                condominioIdCadastro ?? undefined,

              is_empreendedor:
                isEmpreendedor,

              is_prestador:
                isPrestador,

              is_interno:
                data.origem !==
                "EXTERNO",

              status_conta:
                (tipoCadastro === "MORADOR" || tipoCadastro === "VISITANTE")
                  ? UserStatus.APROVADO
                  : UserStatus.PENDENTE,

              categoriaid:
                categoriaNormalizada,
            }
          );

        const usuarioSalvo =
          await manager.save(
            novoUsuario
          );

        const telefoneWhatsApp = String(
          usuarioSalvo.telefone || data.telefone || ""
        )
          .replace(/\D/g, "")
          .trim();

        if (telefoneWhatsApp) {
          const aceitaUtilidade =
            data.aceita_utilidade_whatsapp === true ||
            data.aceita_utilidade_whatsapp === "true";

          const aceitaMarketing =
            data.aceita_marketing_whatsapp === true ||
            data.aceita_marketing_whatsapp === "true";

          const consentimentoWhatsApp = manager.create(
            WhatsAppConsentimento,
            {
              usuarioId: usuarioSalvo.id,
              telefone: telefoneWhatsApp,

              aceita_utilidade: aceitaUtilidade,
              aceita_marketing: aceitaMarketing,

              marketing_aceito_em:
                aceitaMarketing
                  ? new Date()
                  : null,

              marketing_origem:
                aceitaMarketing
                  ? "CADASTRO"
                  : null,

              marketing_cancelado_em: null,
            }
          );

          await manager.save(
            WhatsAppConsentimento,
            consentimentoWhatsApp
          );
        }

        // ----------------------------------------------------------
        // 2. CRIAÇÃO DO ENDEREÇO
        // ----------------------------------------------------------
        const novoEndereco =
          manager.create(
            Endereco,
            {
              usuarioId:
                usuarioSalvo.id,

              condominio_id:
                condominio_id ||
                null,

              bloco_torre:
                data.bloco ||
                null,

              unidade_apto:
                data.unidade ||
                null,

              logradouro:
                data.logradouro ||
                data.endereco_externo ||
                null,

              numero:
                data.numero ||
                null,

              cep:
                data.cep
                  ? String(data.cep).replace(/\D/g, "")
                  : undefined,

              bairro:
                data.bairro ||
                undefined,

              cidade:
                data.cidade ||
                undefined,

              uf:
                data.uf
                  ? String(data.uf).trim().toUpperCase()
                  : undefined,
            }
          );

        await manager.save(
          novoEndereco
        );

        // ----------------------------------------------------------
        // 2.1. VÍNCULO RESIDENCIAL DO MORADOR
        // ----------------------------------------------------------
        /*
         * O código da unidade (ex.: CPS-T1-1501) identifica a
         * residência e permanece separado do código de verificação
         * de e-mail/2FA.
         *
         * Para preservar os cadastros antigos, o vínculo novo só é
         * criado quando o frontend já envia condominio_unidade_id.
         *
         * O service recebe o mesmo EntityManager desta transação.
         * Portanto, se o vínculo falhar, o cadastro inteiro sofre
         * rollback e não deixa usuário/endereço parcialmente criados.
         */
        if (
          tipoCadastro === "MORADOR" &&
          condominioIdCadastro &&
          condominio_unidade_id
        ) {
          const usuarioCondominioUnidadeService =
            new UsuarioCondominioUnidadeService();

          await usuarioCondominioUnidadeService.vincularUsuario({
            manager,
            usuarioId:
              usuarioSalvo.id,
            condominioId:
              String(condominio_id),
            condominioUnidadeId:
              String(condominio_unidade_id),
            blocoTorre:
              data.bloco ||
              null,
            unidadeApto:
              data.unidade ||
              null,
            principal:
              true,
          });
        }

        // ----------------------------------------------------------
        // 3. CRIAÇÃO DO PERFIL COMERCIAL
        // ----------------------------------------------------------
        if (
          isPrestador ||
          isEmpreendedor
        ) {
          const novoPerfil =
            manager.create(
              PerfilPrestador,
              {
                usuarioId:
                  usuarioSalvo.id,

                nome_profissional:
                  name,

                /*
                 * Mantém a forma atual do sistema.
                 */
                tipo:
                  isEmpreendedor ? "EMPREENDEDOR" : "PRESTADOR",

                status_aprovacao:
                  "PENDENTE",

                /*
                 * O único plano disponível é PREMIUM.
                 */
                tipo_assinatura:
                  "PREMIUM",

                plano:
                  "PREMIUM",

                /*
                 * Periodicidade financeira.
                 */
                ciclo_assinatura:
                  cicloAssinatura,

                status_assinatura:
                  "PENDENTE",

                assinatura_iniciada_em:
                  null,

                assinatura_vence_em:
                  null,

                aviso_10_dias_enviado_em:
                  null,

                aviso_5_dias_enviado_em:
                  null,

                aviso_vencimento_enviado_em:
                  null,

                /*
                 * Novo cadastro permanece bloqueado até o
                 * Mercado Pago confirmar o pagamento.
                 */
                bloqueado_por_assinatura:
                  true,

                assinatura_atualizada_em:
                  new Date(),

                payment_status:
                  "PENDENTE",

                ativo:
                  false,

                disponivel:
                  false,

                categoriaid:
                  categoriaNormalizada,
              }
            );

          await manager.save(
            novoPerfil
          );
        }

        // ----------------------------------------------------------
        // 4. CRIAÇÃO DA LOJA / PÁGINA COMERCIAL
        // ----------------------------------------------------------
        // Prestadores e empreendedores utilizam Store como base para
        // a landing page. A criação não equivale à publicação ou ativação.
        if (isPrestador || isEmpreendedor) {
          const storeRepo = manager.getRepository(Store);
          const storeExistente = await storeRepo.findOne({
            where: { usuarioId: usuarioSalvo.id },
          });

          if (!storeExistente) {
            const nomeComercial = String(name || "Parceiro GranConecta").trim();
            const slugBase = nomeComercial
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .slice(0, 55)
              .replace(/-+$/g, "") || "parceiro";

            // O UUID completo evita colisões entre parceiros homônimos.
            const novaLoja = storeRepo.create({
              usuarioId: usuarioSalvo.id,
              name: nomeComercial,
              slug: `${slugBase}-${usuarioSalvo.id}`,
              tipo: isEmpreendedor ? "loja" : "servico",
              ativa: false,
              categoriaid: categoriaNormalizada,
              condominio_id: condominioIdCadastro ?? undefined,
            });

            await storeRepo.save(novaLoja);
          }
        }

        // ----------------------------------------------------------
        // 5. AUTENTICAÇÃO E SENHA
        // ----------------------------------------------------------
        const passwordHash =
          await hash(
            password,
            8
          );

        const novoAuth =
          manager.create(
            UsuarioAuth,
            {
              email:
                emailNormalizado,

              password_hash:
                passwordHash,

              usuarioId:
                usuarioSalvo.id,

              role:
                tipoCadastro,

              codigoVerificacao,
            }
          );

        await manager.save(
          novoAuth
        );

        /*
         * O envio acontece sem impedir o cadastro caso o serviço
         * de e-mail esteja temporariamente indisponível.
         */
        EmailService.send(
          emailNormalizado,
          "Verificação GranConecta",
          `Seu código é: ${codigoVerificacao}`
        ).catch((error) => {
          console.error(
            "Erro ao enviar código de verificação:",
            error
          );
        });

        const token = sign(
          {
            usuarioId:
              usuarioSalvo.id,

            tipo:
              usuarioSalvo.tipo,
          },
          JWT_SECRET,
          {
            expiresIn: "1d",
          }
        );

        return {
          token,

          usuarioId:
            usuarioSalvo.id,

          user: {
            id:
              usuarioSalvo.id,

            usuarioId:
              usuarioSalvo.id,

            name,

            email:
              emailNormalizado,

            tipo: tipoCadastro,

            is_empreendedor:
              isEmpreendedor,

            is_prestador:
              isPrestador,

            plano:
              isPrestador ||
                isEmpreendedor
                ? "PREMIUM"
                : null,

            assinatura:
              isPrestador ||
                isEmpreendedor
                ? {
                  plano:
                    "PREMIUM",

                  ciclo:
                    cicloAssinatura,

                  status:
                    "PENDENTE",

                  data_inicio:
                    null,

                  data_vencimento:
                    null,

                  dias_restantes:
                    null,

                  bloqueado_por_assinatura:
                    true,

                  pode_acessar_painel:
                    false,

                  pode_exibir_pagina:
                    false,

                  payment_status:
                    "PENDENTE",
                }
                : null,
          },
        };
      }
    );

    /*
     * A geolocalização é executada somente depois que a transação
     * terminou. Assim, o EnderecoGeolocationService consegue consultar
     * usuário/endereço/condomínio já persistidos e uma eventual falha
     * do provedor de geocodificação não desfaz o cadastro.
     */
    try {
      await enderecoGeolocationService.geolocalizarPorUsuario(
        resultado.usuarioId
      );
    } catch (error) {
      console.error(
        "[AuthService] Não foi possível geolocalizar o endereço.",
        {
          usuarioId: resultado.usuarioId,
          error,
        }
      );
    }

    return resultado;
  },

  // ================================================================
  // 3. VERIFICAÇÃO DE E-MAIL
  // ================================================================
  async verificarEmail(
    data: VerifyEmailInput
  ) {
    const authRepo =
      AppDataSource.getRepository(
        UsuarioAuth
      );

    const emailNormalizado =
      String(data.email)
        .trim()
        .toLowerCase();

    const usuarioAuth =
      await authRepo.findOne({
        where: {
          email:
            emailNormalizado,
        },
        select: [
          "id",
          "email",
          "usuarioId",
          "codigoVerificacao",
          "emailVerificado",
          "role",
        ],
      });

    if (!usuarioAuth?.usuarioId) {
      throw new Error(
        "Usuário não encontrado."
      );
    }

    if (
      usuarioAuth.codigoVerificacao !==
      data.codigo
    ) {
      throw new Error(
        "Código inválido."
      );
    }

    await authRepo.update(
      usuarioAuth.id,
      {
        emailVerificado:
          true,

        codigoVerificacao:
          null,
      }
    );

    const usuario =
      await getUserLiteById(
        usuarioAuth.usuarioId
      );

    if (!usuario) {
      throw new Error(
        "Usuário não encontrado no banco."
      );
    }

    const token = sign(
      {
        usuarioId:
          usuario.id,

        role:
          usuarioAuth.role,

        tipo:
          usuario.tipo,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const perfil =
      (
        usuario as any
      )?.perfil as PerfilPrestador | null;

    const assinatura =
      montarResumoAssinatura(
        perfil
      );

    return {
      token,

      user: {
        id:
          usuario.id,

        usuarioId:
          usuario.id,

        name:
          usuario.name,

        email:
          usuarioAuth.email,

        tipo:
          usuario.tipo,

        status_conta:
          usuario.status_conta,

        is_empreendedor:
          usuario.is_empreendedor,

        is_prestador:
          usuario.is_prestador,

        emailVerificado:
          true,

        lojaId:
          usuario.store?.id ||
          null,

        slug:
          usuario.store?.slug ||
          null,

        plano:
          perfil
            ? "PREMIUM"
            : null,

        assinatura,
      },

      message:
        "Email verificado com sucesso!",
    };
  },

  // ================================================================
  // 4. ESQUECI A SENHA
  // ================================================================
  async forgotPassword(
    email: string
  ) {
    const authRepo =
      AppDataSource.getRepository(
        UsuarioAuth
      );

    const emailNormalizado =
      String(email)
        .trim()
        .toLowerCase();

    const usuarioAuth =
      await authRepo.findOne({
        where: {
          email:
            emailNormalizado,
        },
      });

    if (!usuarioAuth) {
      throw new Error(
        "Usuário não encontrado."
      );
    }

    const code =
      gerarCodigo6Digitos();

    const expires =
      new Date();

    expires.setMinutes(
      expires.getMinutes() + 15
    );

    await authRepo.update(
      usuarioAuth.id,
      {
        reset_token:
          code,

        reset_token_expires:
          expires,
      }
    );

    EmailService.send(
      emailNormalizado,
      "Recuperação de Senha",
      `Seu código GranConecta: ${code}`
    ).catch((error) => {
      console.error(
        "Erro ao enviar código de recuperação:",
        error
      );
    });

    return {
      message:
        "Código de recuperação enviado para o seu e-mail.",
    };
  },

  // ================================================================
  // 5. RESETAR SENHA
  // ================================================================
  async resetPassword({
    email,
    token,
    newPassword,
  }: ResetPasswordInput) {
    const authRepo =
      AppDataSource.getRepository(
        UsuarioAuth
      );

    const emailNormalizado =
      String(email)
        .trim()
        .toLowerCase();

    const usuarioAuth =
      await authRepo
        .createQueryBuilder(
          "auth"
        )
        .where(
          "auth.email = :email",
          {
            email:
              emailNormalizado,
          }
        )
        .andWhere(
          "auth.reset_token = :token",
          {
            token,
          }
        )
        .andWhere(
          "auth.reset_token_expires > :now",
          {
            now:
              new Date(),
          }
        )
        .getOne();

    if (!usuarioAuth) {
      throw new Error(
        "Código inválido ou expirado."
      );
    }

    const password_hash =
      await hash(
        newPassword,
        8
      );

    await authRepo.update(
      usuarioAuth.id,
      {
        password_hash,

        reset_token:
          null,

        reset_token_expires:
          null,
      }
    );

    return {
      message:
        "Senha redefinida com sucesso!",
    };
  },

  // ================================================================
  // 6. REENVIAR CÓDIGO
  // ================================================================
  async reenviarCodigo(
    email: string
  ) {
    const authRepo =
      AppDataSource.getRepository(
        UsuarioAuth
      );

    const emailNormalizado =
      String(email)
        .trim()
        .toLowerCase();

    const usuarioAuth =
      await authRepo.findOne({
        where: {
          email:
            emailNormalizado,
        },
      });

    if (!usuarioAuth) {
      throw new Error(
        "Usuário não encontrado."
      );
    }

    const novoCodigo =
      gerarCodigo6Digitos();

    await authRepo.update(
      usuarioAuth.id,
      {
        codigoVerificacao:
          novoCodigo,
      }
    );

    EmailService.send(
      emailNormalizado,
      "Novo Código de Verificação",
      `Seu novo código: ${novoCodigo}`
    ).catch((error) => {
      console.error(
        "Erro ao reenviar código:",
        error
      );
    });

    return {
      message:
        "Novo código enviado com sucesso!",
    };
  },

  // ================================================================
  // 7. DADOS DO USUÁRIO LOGADO
  // ================================================================
  async getMe(
    usuarioId: string
  ) {
    const usuario =
      await getUserLiteById(
        usuarioId
      );

    if (!usuario) {
      throw new Error(
        "Usuário não encontrado."
      );
    }

    const perfil =
      (
        usuario as any
      )?.perfil as PerfilPrestador | null;

    const assinatura =
      montarResumoAssinatura(
        perfil
      );

    return {
      ...usuario,

      perfil: perfil
        ? {
          ...perfil,

          plano:
            "PREMIUM",

          tipo_assinatura:
            "PREMIUM",

          ciclo_assinatura:
            perfil.ciclo_assinatura ||
            null,

          status_assinatura:
            assinatura?.status ||
            "PENDENTE",

          bloqueado_por_assinatura:
            assinatura
              ?.bloqueado_por_assinatura ??
            true,
        }
        : null,

      assinatura,
    };
  },
};

export default AuthService;

