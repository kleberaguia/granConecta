import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import stripe from '../config/stripe';
import { AppDataSource } from '../config/data-source';
import { PerfilPrestador } from '../models/PerfilPrestadorModel';
import { UserCredits } from '../models/usercreditsModels';
import { CreditTransactions, TransactionType } from '../models/creditTransactionsModels';
import { Payment, PaymentStatus } from "../models/PaymentModel";
import { WebhookEvent } from '../models/WebhookEvent';
import MercadoPagoConfig, {
  Preference,
  Payment as MPPayment,
  PreApproval
} from 'mercadopago';
import { Usuario } from '../models/UserModels';
import { UserStatus } from '../models/enums';
import { Store } from '../models/StoreModels';

// Configuração Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!
});

// Ambiente de teste: nunca abrir um checkout externo.
function urlCheckoutLocal(usuarioId: string, identificador: string): string {
  const frontend = String(process.env.FRONTEND_URL || "http://localhost:5173");
  const url = new URL(frontend);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("[LOCAL] FRONTEND_URL deve apontar para localhost ou 127.0.0.1.");
  }
  url.pathname = "/pagamento/resultado";
  url.search = new URLSearchParams({
    resultado: "pendente",
    simulado: "1",
    usuarioId,
    checkoutId: identificador,
  }).toString();
  return url.toString();
}

type CicloAssinatura = "MENSAL" | "TRIMESTRAL" | "ANUAL";

function normalizarCicloAssinatura(valor: unknown): CicloAssinatura {
  const ciclo = String(valor || "").trim().toUpperCase();
  if (ciclo === "MENSAL" || ciclo === "TRIMESTRAL" || ciclo === "ANUAL") {
    return ciclo;
  }
  return "MENSAL";
}

function mesesDoCiclo(ciclo: CicloAssinatura): number {
  if (ciclo === "TRIMESTRAL") return 3;
  if (ciclo === "ANUAL") return 12;
  return 1;
}

function adicionarMesesUTC(data: Date, meses: number): Date {
  const resultado = new Date(data);
  const diaOriginal = resultado.getUTCDate();
  resultado.setUTCDate(1);
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);
  const ultimoDiaDoMes = new Date(Date.UTC(
    resultado.getUTCFullYear(),
    resultado.getUTCMonth() + 1,
    0
  )).getUTCDate();
  resultado.setUTCDate(Math.min(diaOriginal, ultimoDiaDoMes));
  return resultado;
}

class PaymentController {
  private paymentRepo = AppDataSource.getRepository(Payment);

  async checkPixStatus(req: Request, res: Response) {
    const usuarioId = req.params.id;

    const usuarioRepo = AppDataSource.getRepository(Usuario);

    if (!usuarioId) {
      return res.status(400).json({
        error: "UsuárioId é obrigatório"
      });
    }

    const usuario = await usuarioRepo.findOne({
      where: { id: usuarioId }
    });

    if (!usuario) {
      return res.status(404).json({
        error: "Usuário não encontrado"
      });
    }

    // Morador não paga
    if (usuario.tipo === "MORADOR") {
      return res.json({
        status: "ISENTO"
      });
    }

    const paymentRepo = AppDataSource.getRepository(Payment);

    const payment = await paymentRepo.findOne({
      where: { usuarioId },
      order: {
        createdAt: "DESC"
      }
    });

    if (!payment) {
      return res.json({
        status: PaymentStatus.PENDING
      });
    }

    return res.json({
      status: payment.status
    });
  }

  // ================================
  // 📊 LISTAR PAGAMENTOS
  // ================================
  async listarPagamentos(req: Request, res: Response) {
    const payments = await this.paymentRepo.find({
      order: { createdAt: "DESC" }
    });
    return res.json(payments);
  }

  handleCreateSession = async (req: Request, res: Response) => {
    console.log("📦 Dados recebidos no body:", req.body);
    try {
      const { itens, usuarioId } = req.body;
      if (!itens || itens.length === 0) {
        return res.status(400).json({
          error: "Nenhum item enviado"
        });
      }

      const cicloSolicitado = normalizarCicloAssinatura(
        itens[0]?.ciclo_assinatura ||
        itens[0]?.frequencia ||
        itens[0]?.tipo_assinatura
      );

      const valorSolicitado = itens.reduce(
        (total: number, item: any) => total + Number(item.valor),
        0
      );

      if (!Number.isFinite(valorSolicitado) || valorSolicitado <= 0) {
        return res.status(400).json({
          error: "Valor do plano inválido"
        });
      }

      const usuarioRepo = AppDataSource.getRepository(Usuario);
      const usuario = await usuarioRepo.findOne({
        where: { id: String(usuarioId) }
      });

      if (!usuario) {
        return res.status(404).json({
          error: "Usuário não encontrado"
        });
      }

      if (!usuario.email) {
        return res.status(400).json({
          error: "Usuário sem email cadastrado"
        });
      }

      const perfilRepo = AppDataSource.getRepository(PerfilPrestador);
      
      // 🔍 Busca o perfil ou CRIA um novo se ainda não existir
      let perfil = await perfilRepo.findOne({ where: { usuarioId: String(usuarioId) } });

      if (!perfil) {
        console.log(`⚠️ Perfil não encontrado para usuarioId ${usuarioId}. Criando perfil inicial...`);
        const nomeProfissional = String(
          (usuario as any).name ||
          (usuario as any).nome ||
          (usuario as any).nome_completo ||
          usuario.email?.split("@")[0] ||
          "Profissional GranConecta"
        ).trim();

        perfil = perfilRepo.create({
          usuarioId: String(usuarioId),
          nome_profissional: nomeProfissional,
          tipo: itens[0]?.tipo || "PRESTADOR",
          ativo: false,
          disponivel: false,
          status_aprovacao: "PENDENTE",
          payment_status: "PENDENTE"
        });

        // Salva o perfil mínimo ANTES de criar a preferência no Mercado Pago.
        // Assim, uma falha de schema/validação não deixa checkout órfão.
        perfil = await perfilRepo.save(perfil);
      }

      // Um checkout novo não deve bloquear quem já possui assinatura válida.
      const assinaturaVigente = perfil.assinatura_vence_em &&
        new Date(perfil.assinatura_vence_em).getTime() > Date.now() &&
        ["ATIVA", "A_VENCER"].includes(String(perfil.status_assinatura));
      if (assinaturaVigente) {
        return res.status(409).json({
          error: "Assinatura vigente. Use o fluxo de renovação ou alteração de ciclo."
        });
      }

      const checkoutAindaValido =
        Boolean(perfil.checkout_expira_em) &&
        new Date(perfil.checkout_expira_em!).getTime() > Date.now();

      const pagamentoPendente = perfil.checkout_session_id
        ? await this.paymentRepo.findOne({
            where: {
              mercado_pago_preference_id: perfil.checkout_session_id,
              status: PaymentStatus.PENDING
            } as any
          })
        : null;

      const mesmoCiclo =
        perfil.ciclo_assinatura === cicloSolicitado;

      const mesmoValor =
        pagamentoPendente !== null &&
        Math.abs(Number(pagamentoPendente.amount) - valorSolicitado) < 0.01;

      if (
        perfil.payment_status === "PENDENTE" &&
        perfil.checkout_url &&
        checkoutAindaValido &&
        mesmoCiclo &&
        mesmoValor &&
        (process.env.NODE_ENV !== "local" ||
          (perfil.checkout_session_id || "").startsWith("LOCAL_"))
      ) {
        console.log("Checkout pendente compatível reutilizado", {
          ciclo: cicloSolicitado,
          valor: valorSolicitado
        });
        return res.json({
          checkoutUrl: perfil.checkout_url,
          reused: true
        });
      }

      const items = itens.map((item: any) => {
        const unitPrice = Number(item.valor);
        if (!unitPrice || unitPrice <= 0) {
          throw new Error("Valor inválido no item");
        }

        return {
          id: "PREMIUM",
          title: `Plano PREMIUM ${cicloSolicitado} - GranConecta`,
          quantity: 1,
          unit_price: unitPrice,
          currency_id: 'BRL'
        };
      });

      console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
      // O SDK só é utilizado nos ambientes com gateway real.

      const userType = (itens[0]?.tipo || 'PRESTADOR').toLowerCase();
      const frontendUrl = String(
        process.env.FRONTEND_URL ||
        "https://www.granconecta.net.br"
      ).replace(/\/+$/, "");

      const apiUrl = String(
        process.env.API_URL ||
        "https://api.granconecta.net.br"
      ).replace(/\/+$/, "");

      const resultBaseUrl =
        `${frontendUrl}/pagamento/resultado?tipo=${encodeURIComponent(userType)}`;
      
      const preferenceBody: any = {
        items,
        external_reference: String(usuarioId),
        payer: {
          email: usuario.email,
        },
        back_urls: {
          success: `${resultBaseUrl}&resultado=sucesso`,
          failure: `${resultBaseUrl}&resultado=falha`,
          pending: `${resultBaseUrl}&resultado=pendente`,
        },
        auto_return: 'approved',
        metadata: {
          usuario_id: String(usuarioId),
          plano: "PREMIUM",
          ciclo_assinatura: cicloSolicitado,
          tipo: itens[0]?.tipo || 'PRESTADOR'
        },
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12,
        },
        notification_url: `${apiUrl}/api/webhook/mercadopago`,
      };

      const result = process.env.NODE_ENV === "local"
        ? (() => {
            const id = `LOCAL_CHECKOUT_${randomUUID()}`;
            return {
              id,
              init_point: urlCheckoutLocal(String(usuarioId), id),
            };
          })()
        : await new Preference(client).create({ body: preferenceBody });
      const checkoutUrl = result.init_point;

      // 💾 Preenche os dados do checkout no perfil (criado ou existente) e salva
      perfil.payment_status = "PENDENTE";
      perfil.checkout_session_id = result.id!;
      perfil.checkout_url = checkoutUrl!;
      perfil.checkout_expira_em = new Date(Date.now() + 1000 * 60 * 60 * 24);
      perfil.plano = "PREMIUM";
      perfil.tipo = itens[0]?.tipo || "PRESTADOR";
      perfil.tipo_assinatura = "PREMIUM";
      perfil.ciclo_assinatura = cicloSolicitado;
      perfil.status_assinatura = "PENDENTE";
      perfil.bloqueado_por_assinatura = true;
      perfil.assinatura_atualizada_em = new Date();
      // A criação de um checkout não revoga uma aprovação administrativa.
      // A validade da assinatura vigente será tratada separadamente.

      await perfilRepo.save(perfil);

      await this.paymentRepo.save({
        usuarioId: String(usuarioId),
        stripeSessionId: result.id!,
        mercado_pago_preference_id: result.id!,
        mercado_pago_payment_id: null,
        status: PaymentStatus.PENDING,
        amount: valorSolicitado,
        paymentMethod: 'MERCADO_PAGO',
        plano: "PREMIUM",
        tipo: itens[0]?.tipo || 'PRESTADOR',
        frequencia: cicloSolicitado
      } as any);

      console.log("Checkout criado com sucesso");

      return res.json({
        checkoutUrl,
        reused: false
      });

    } catch (err: any) {
      console.error(
        "Detalhes do Erro Mercado Pago:",
        err.message
      );

      if (err.cause) {
        console.error(
          "Causa:",
          JSON.stringify(err.cause)
        );
      }

      return res.status(500).json({
        error: "Erro ao iniciar pagamento",
        details: err.message
      });
    }
  };

  handleCreateSubscription = async (req: Request, res: Response) => {
    try {
      const { usuarioId, valor } = req.body;
      const ciclo = normalizarCicloAssinatura(
        req.body.ciclo_assinatura ||
        req.body.frequencia ||
        req.body.tipo_assinatura ||
        req.body.plano
      );

      if (!usuarioId) {
        return res.status(400).json({
          error: "Usuário obrigatório"
        });
      }

      if (!Number.isFinite(Number(valor)) || Number(valor) <= 0) {
        return res.status(400).json({
          error: "Valor da assinatura inválido"
        });
      }

      const usuarioRepo = AppDataSource.getRepository(Usuario);
      const perfilRepo = AppDataSource.getRepository(PerfilPrestador);

      const usuario = await usuarioRepo.findOne({
        where: { id: String(usuarioId) }
      });

      if (!usuario) {
        return res.status(404).json({
          error: "Usuário não encontrado"
        });
      }

      const perfil = await perfilRepo.findOne({
        where: { usuarioId: String(usuarioId) }
      });

      if (!perfil) {
        return res.status(404).json({
          error: "Perfil não encontrado"
        });
      }

      // evita múltiplas assinaturas
      if (
        perfil.subscription_id &&
        perfil.payment_status === "ATIVO"
      ) {
        return res.status(400).json({
          error: "Usuário já possui assinatura ativa"
        });
      }

      const frequenciaMeses = mesesDoCiclo(ciclo);

      const response = process.env.NODE_ENV === "local"
        ? (() => {
            const id = `LOCAL_SUBSCRIPTION_${randomUUID()}`;
            return {
              id,
              init_point: urlCheckoutLocal(String(usuarioId), id),
            };
          })()
        : await new PreApproval(client).create({
        body: {
          reason: `Plano PREMIUM ${ciclo} GranConecta`,
          external_reference: String(usuarioId),
          payer_email: usuario.email || undefined,
          auto_recurring: {
            frequency: frequenciaMeses,
            frequency_type: "months",
            transaction_amount: Number(valor),
            currency_id: "BRL",
          },
          back_url: `${process.env.FRONTEND_URL}/assinatura/sucesso`,
          status: "pending",
        },
      });

      // =====================================================
      // PERFIL
      // =====================================================
      perfil.subscription_id = response.id!;
      perfil.checkout_url = response.init_point!;
      perfil.payment_status = "PENDENTE";
      perfil.plano = "PREMIUM";
      perfil.tipo_assinatura = "PREMIUM";
      perfil.ciclo_assinatura = ciclo;
      perfil.status_assinatura = "PENDENTE";
      perfil.bloqueado_por_assinatura = true;
      perfil.assinatura_atualizada_em = new Date();
      await perfilRepo.save(perfil);

      await this.paymentRepo.save({
        usuarioId: String(usuarioId),
        stripeSessionId: response.id!,
        mercado_pago_preference_id: response.id!,
        status: PaymentStatus.PENDING,
        amount: Number(valor),
        paymentMethod: "MERCADO_PAGO",
        plano: "PREMIUM",
        tipo: "PRESTADOR",
        frequencia: ciclo
      } as any);

      return res.json({
        checkoutUrl: response.init_point,
        subscriptionId: response.id
      });

    } catch (err: any) {
      console.error(
        "Erro assinatura Mercado Pago:",
        err
      );

      return res.status(500).json({
        error: "Erro ao criar assinatura",
        details: err.message
      });
    }
  };

  handleMercadoPagoSubscriptionWebhook = async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "local") {
      return res.status(403).json({ error: "Webhook externo de assinatura bloqueado no LOCAL" });
    }
    try {
      const { type, data } = req.body;

      console.log(
        "Webhook assinatura recebido:",
        JSON.stringify(req.body, null, 2)
      );

      if (type === "preapproval") {
        const subscriptionId = String(data.id);
        const preApproval = new PreApproval(client);

        const subscription = await preApproval.get({
          id: subscriptionId
        });

        console.log(
          "Dados assinatura:",
          JSON.stringify(subscription, null, 2)
        );

        const usuarioId = subscription.external_reference;

        if (!usuarioId) {
          console.warn("Usuário não encontrado no webhook");
          return res.status(200).send("OK");
        }

        // =====================================================
        // ASSINATURA ATIVA
        // =====================================================
        if (subscription.status === "authorized") {
          // Autorização do preapproval não comprova liquidação da parcela.
          // A liberação ocorrerá somente no webhook de pagamento aprovado.
          console.info("[SUBSCRIPTION] Autorizada; aguardando pagamento confirmado", { usuarioId, subscriptionId });

          const perfilRepo = AppDataSource.getRepository(PerfilPrestador);
          const perfil = await perfilRepo.findOne({
            where: { usuarioId: String(usuarioId) }
          });
          if (perfil) {
            perfil.subscription_id = subscriptionId;
            const proximaCobranca = (subscription as any).next_payment_date;
            if (proximaCobranca) {
              perfil.subscription_renews_at = new Date(proximaCobranca);
            }
            perfil.assinatura_atualizada_em = new Date();
            await perfilRepo.save(perfil);
          }

          console.log(
            "✅ Assinatura ativada:",
            usuarioId
          );
        }

        // =====================================================
        // ASSINATURA CANCELADA
        // =====================================================
        if (
          subscription.status === "cancelled" ||
          subscription.status === "paused" ||
          subscription.status === "expired"
        ) {
          const perfilRepo = AppDataSource.getRepository(PerfilPrestador);

          await perfilRepo.update(
            { usuarioId: String(usuarioId) },
            {
              payment_status: "CANCELADO",
              status_assinatura: "CANCELADA",
              bloqueado_por_assinatura: true,
              subscription_cancelled_at: new Date(),
              assinatura_atualizada_em: new Date(),
              ativo: false,
              disponivel: false
            }
          );
          // A assinatura bloqueia o atendimento, não a visibilidade da loja.
          // Manter stores.ativa inalterado permite exibir o cartão
          // "Temporariamente indisponível" no Marketplace.

          console.log(
            "❌ Assinatura cancelada:",
            usuarioId
          );
        }
      }

      return res.status(200).send("OK");

    } catch (err: any) {
      console.error(
        "Erro webhook assinatura:",
        err
      );

      return res.status(500).send("ERROR");
    }
  };

  // ================================
  // 🔥 WEBHOOK MERCADO PAGO
  // ================================
  handleMercadoPagoWebhook = async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "local") {
      return res.status(403).json({ error: "Webhook externo Mercado Pago bloqueado no LOCAL" });
    }
    try {
      // 1. Extração segura dos dados (Query ou Body)
      const topic = req.query.topic || req.body.topic || req.body.type;
      const id = req.query.id || (req.body.data && req.body.data.id);
      const resource = req.body.resource;

      console.log(
        "Webhook Mercado Pago recebido:",
        JSON.stringify({ query: req.query, body: req.body }, null, 2)
      );

      // Se não houver ID ou tópico, apenas ignoramos para não quebrar
      if (!id && !resource) {
        return res.status(200).send("OK");
      }

      const mpPayment = new MPPayment(client);

      // =====================================================
      // 🔥 CASO 1: PAYMENT
      // =====================================================
      if (topic === "payment") {
        const paymentId = String(id);
        const paymentData = await mpPayment.get({ id: paymentId });

        console.log("PAYMENT DATA:", JSON.stringify(paymentData, null, 2));

        if (
          paymentData.status === "approved" ||
          paymentData.status === "authorized"
        ) {
          const usuarioId =
            paymentData.external_reference ||
            (paymentData.metadata as any)?.usuario_id ||
            (paymentData.metadata as any)?.usuarioId;

          const preferenceId =
            (paymentData as any).preference_id ||
            (paymentData.metadata as any)?.preference_id;

          console.log("✅ Payment aprovado recebido pelo webhook:", {
            paymentId,
            usuarioId,
            preferenceId
          });

          if (!usuarioId) {
            console.warn(
              "⚠️ usuarioId não encontrado no payment aprovado:",
              paymentId
            );

            return res.status(200).send("OK");
          }

          /*
           * O evento payment aprovado já é suficiente para concluir a
           * ativação. Não dependemos da chegada posterior de merchant_order.
           *
           * confirmarPagamentoUniversal é idempotente: se o merchant_order
           * chegar depois, a assinatura/créditos não serão duplicados.
           */
          await this.confirmarPagamentoUniversal(
            String(usuarioId),
            String(paymentId),
            preferenceId ? String(preferenceId) : undefined
          );

          console.log("✅ Payment confirmado pelo webhook:", {
            usuarioId,
            paymentId,
            preferenceId
          });
        }
      }

      // =====================================================
      // 🔥 CASO 2: MERCHANT ORDER
      // =====================================================
      if (topic === "merchant_order") {
        // O ID do merchant_order pode vir no 'id' da query ou dentro do link 'resource'
        const merchantOrderId = id || (resource ? resource.split("/").pop() : null);

        if (!merchantOrderId) {
          return res.status(200).send("OK");
        }

        const merchantOrder = await fetch(
          `https://api.mercadopago.com/merchant_orders/${merchantOrderId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
            }
          }
        ).then(r => r.json());

        console.log("MERCHANT ORDER:", JSON.stringify(merchantOrder, null, 2));

        const preferenceId = merchantOrder.preference_id;
        const payment = merchantOrder.payments?.[0];
        const paymentIdFromOrder = payment?.id;
        const status = payment?.status;

        if (status === "approved" || status === "authorized") {
          const usuarioId = merchantOrder.external_reference || merchantOrder.metadata?.usuario_id;

          if (!usuarioId) {
            console.warn("usuarioId não encontrado no merchant_order");
            return res.status(200).send("OK");
          }

          await this.confirmarPagamentoUniversal(
            String(usuarioId),
            String(paymentIdFromOrder),
            preferenceId ? String(preferenceId) : undefined
          );
        }
      }

      return res.status(200).send("OK");

    } catch (error: any) {
      console.error("Erro Webhook MP:", error);
      // Erros transitórios devem permitir retentativa do provedor.
      return res.status(500).send("ERROR");
    }
  };

  // ================================
  // 🔥 WEBHOOK STRIPE
  // ================================
  async handleStripeWebhook(req: Request, res: Response) {
    if (process.env.NODE_ENV === "local") {
      return res.status(403).json({ error: "Webhook externo Stripe bloqueado no LOCAL" });
    }
    const sig = req.headers['stripe-signature'] as string;
    let event: any;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const webhookRepo = AppDataSource.getRepository(WebhookEvent);

    const alreadyProcessed = await webhookRepo.findOne({ where: { id: event.id } });
    if (alreadyProcessed) return res.json({ received: true });

    await webhookRepo.save({ id: event.id, type: event.type, processed: false });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const usuarioId = session.metadata?.usuarioId;
      await this.confirmarPagamentoUniversal(usuarioId, session.id);
    }

    await webhookRepo.update(event.id, { processed: true });
    return res.json({ received: true });
  }

  // ================================
  // 🔐 CONFIRMAÇÃO UNIVERSAL (Stripe & MP)
  // ================================
  async confirmarPagamentoUniversal(
    usuarioId: string,
    paymentId: string,
    preferenceId?: string
  ) {
    if (!usuarioId || !paymentId) {
      throw new Error("Dados insuficientes para confirmar o pagamento");
    }
    // A confirmação de teste terá um fluxo autenticado próprio; não aceitar
    // identificadores de gateway real como confirmação em ambiente local.
    if (process.env.NODE_ENV === "local" && !paymentId.startsWith("LOCAL_")) {
      throw new Error("[LOCAL] Confirmação de pagamento externo bloqueada.");
    }

    console.log("Entrou na confirmação universal", { usuarioId, paymentId, preferenceId });

    await AppDataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const perfilRepo = manager.getRepository(PerfilPrestador);
      const creditRepo = manager.getRepository(UserCredits);
      const transactionRepo = manager.getRepository(CreditTransactions);
      const usuarioRepo = manager.getRepository(Usuario);
      const storeRepo = manager.getRepository(Store);

      let payment: any = null;

      payment = await paymentRepo.createQueryBuilder("payment")
        .setLock("pessimistic_write")
        .where("payment.mercado_pago_payment_id = :paymentId", { paymentId })
        .getOne();

      if (!payment && preferenceId) {
        payment = await paymentRepo.createQueryBuilder("payment")
          .setLock("pessimistic_write")
          .where("payment.mercado_pago_preference_id = :preferenceId", { preferenceId })
          .getOne();
      }

      if (!payment) {
        payment = await paymentRepo.createQueryBuilder("payment")
          .setLock("pessimistic_write")
          .where("payment.stripeSessionId = :paymentId", { paymentId })
          .getOne();
      }

      // Não vincular um pagamento apenas ao último PENDING do usuário:
      // isso pode atribuir uma cobrança antiga ao checkout errado.
      // O webhook deve trazer um identificador de preferência ou sessão.

      if (!payment) {
        throw new Error(
          `Pagamento não localizado. usuarioId=${usuarioId}, paymentId=${paymentId}`
        );
      }

      // Nunca confirmar um pagamento associado a outro usuário.
      if (String(payment.usuarioId) !== String(usuarioId)) {
        throw new Error(`Pagamento ${payment.id} não pertence ao usuário informado`);
      }

      // Se a preferência antiga já foi paga por outro ID, não reutilizá-la.
      if (payment.mercado_pago_payment_id &&
          String(payment.mercado_pago_payment_id) !== String(paymentId) &&
          String(payment.stripeSessionId || "") !== String(paymentId)) {
        throw new Error("Pagamento local já associado a outro identificador");
      }

      // O mesmo evento não renova nem reativa novamente.
      if (payment.status === PaymentStatus.PAID) {
        console.info("[PAYMENT] Evento já processado", { usuarioId, paymentLocalId: payment.id });
        return;
      }

      payment.status = PaymentStatus.PAID;
      if (String(payment.stripeSessionId || "") !== String(paymentId)) {
        payment.mercado_pago_payment_id = paymentId;
      }
      if (preferenceId) {
        payment.mercado_pago_preference_id = preferenceId;
      }
      await paymentRepo.save(payment);

      const perfilAtual = await perfilRepo.findOne({
        where: { usuarioId }
      });

      if (!perfilAtual) {
        throw new Error(`Perfil não encontrado para o usuário ${usuarioId}`);
      }

      const ciclo = normalizarCicloAssinatura(
        payment.frequencia || perfilAtual.ciclo_assinatura
      );
      const agora = new Date();
      const vencimentoAtual = perfilAtual.assinatura_vence_em
        ? new Date(perfilAtual.assinatura_vence_em)
        : null;
      const dataBase =
        vencimentoAtual &&
        !Number.isNaN(vencimentoAtual.getTime()) &&
        vencimentoAtual.getTime() > agora.getTime()
          ? vencimentoAtual
          : agora;
      const novaDataVencimento = adicionarMesesUTC(
        dataBase,
        mesesDoCiclo(ciclo)
      );

      // Pagamento não equivale à aprovação administrativa.
      const aprovadoAdministrativamente =
        String(perfilAtual.status_aprovacao || "").toUpperCase() === "APROVADO";
      const statusAnterior = String(perfilAtual.status || "").toLowerCase();
      const bloqueioEraAssinatura = Boolean(perfilAtual.bloqueado_por_assinatura) ||
        ["bloqueado", "pendente", "ativo"].includes(statusAnterior);
      const podeReativar = aprovadoAdministrativamente && bloqueioEraAssinatura;
      if (podeReativar) {
        perfilAtual.ativo = true;
        perfilAtual.disponivel = true;
        perfilAtual.status = UserStatus.APROVADO;
      }
      perfilAtual.payment_status = "PAGO";
      perfilAtual.plano = "PREMIUM";
      perfilAtual.tipo_assinatura = "PREMIUM";
      perfilAtual.ciclo_assinatura = ciclo;
      perfilAtual.status_assinatura = "ATIVA";
      perfilAtual.bloqueado_por_assinatura = !podeReativar;
      perfilAtual.assinatura_iniciada_em = agora;
      perfilAtual.assinatura_vence_em = novaDataVencimento;
      perfilAtual.subscription_renews_at = novaDataVencimento;
      perfilAtual.subscription_cancelled_at = null;
      perfilAtual.aviso_10_dias_enviado_em = null;
      perfilAtual.aviso_5_dias_enviado_em = null;
      perfilAtual.aviso_vencimento_enviado_em = null;
      perfilAtual.assinatura_atualizada_em = agora;
      await perfilRepo.save(perfilAtual);

      if (podeReativar) {
        await usuarioRepo.update(
          { id: usuarioId },
          { status_conta: "ativo" as any }
        );
        await storeRepo.update(
          { usuarioId },
          { ativa: true } as any
        );
      } else {
        console.warn("[PAYMENT] Pago, aguardando aprovação administrativa", { usuarioId });
      }

      let credit = await creditRepo.findOne({ where: { usuarioId } });
      if (!credit) {
        credit = creditRepo.create({ usuarioId, balance: 0 });
      }

      const existingBonus = await transactionRepo.findOne({
        where: {
          usuarioId,
          type: TransactionType.BONUS
        }
      });

      if (!existingBonus) {
        const bonusAmount = 100;
        credit.balance = Number(credit.balance) + bonusAmount;
        await creditRepo.save(credit);
        await transactionRepo.save({
          usuarioId,
          amount: bonusAmount,
          type: TransactionType.BONUS,
          description: `Ativação automática - Plano PREMIUM ${ciclo}`
        });
      }

      console.log("Pagamento aprovado e assinatura atualizada", {
        usuarioId,
        ciclo,
        assinaturaVenceEm: novaDataVencimento.toISOString()
      });
    });
  }

  // ================================
  // 💰 CRÉDITOS
  // ================================
  async getBalanceAndTransactions(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).user.id;
      const balanceData = await AppDataSource.getRepository(UserCredits).findOne({ where: { usuarioId } });
      const transactions = await AppDataSource.getRepository(CreditTransactions).find({
        where: { usuarioId },
        order: { created_at: "DESC" },
        take: 20
      });

      return res.json({
        saldo: balanceData ? Number(balanceData.balance) : 0,
        historico: transactions
      });
    } catch {
      return res.status(500).json({ error: "Erro ao buscar créditos." });
    }
  }

  private async ativarPerfilManual(manager: any, usuarioId: string, plano: string) {
    const perfilRepo = manager.getRepository(PerfilPrestador);
    const usuarioRepo = manager.getRepository(Usuario);
    const creditRepo = manager.getRepository(UserCredits);
    const transactionRepo = manager.getRepository(CreditTransactions);
    const storeRepo = manager.getRepository(Store);

    console.log(`Iniciando ativação forçada para o usuário: ${usuarioId}`);

    // 1. Atualizar Perfil
    await perfilRepo.update(
      { usuarioId: String(usuarioId) },
      {
        ativo: true,
        disponivel: true,
        status: "ativo" as any,
        status_aprovacao: "APROVADO" as any,
        payment_status: "PAGO",
        plano: "PREMIUM",
        tipo_assinatura: "PREMIUM",
        status_assinatura: "ATIVA",
        bloqueado_por_assinatura: false,
        assinatura_atualizada_em: new Date()
      }
    );
    await storeRepo.update(
      { usuarioId: String(usuarioId) },
      { ativa: true } as any
    );

    // 2. Atualizar Usuário
    await usuarioRepo.update(
      { id: String(usuarioId) },
      { status_conta: "ativo" as any }
    );

    // 3. Garantir Créditos/Bônus (Evitando duplicidade)
    let credit = await creditRepo.findOne({ where: { usuarioId } });
    if (!credit) {
      credit = creditRepo.create({ usuarioId, balance: 0 });
    }

    const existingBonus = await transactionRepo.findOne({
      where: { usuarioId, type: TransactionType.BONUS }
    });

    if (!existingBonus) {
      const bonusAmount = 100;
      credit.balance = Number(credit.balance) + bonusAmount;
      await creditRepo.save(credit);
      await transactionRepo.save({
        usuarioId,
        amount: bonusAmount,
        type: TransactionType.BONUS,
        description: `Ativação automática - Plano ${plano}`
      });
    }
  }
}

export default new PaymentController();