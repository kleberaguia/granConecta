// controllers/PaymentController.ts
import { Request, Response } from 'express';
import stripe from '../config/stripe';
import { AppDataSource } from '../config/data-source';
import { PerfilPrestador } from '../models/PerfilPrestadorModel';
import { UserCredits } from '../models/usercreditsModels';
import { CreditTransactions } from '../models/creditTransactionsModels';
import { Payment, PaymentStatus } from "../models/PaymentModel";
import { WebhookEvent } from '../models/WebhookEvent';
import MercadoPagoConfig, { Preference, Payment as MPPayment } from 'mercadopago';
import { Usuario } from '../models/UserModels';

// Configuração Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
});

class PaymentController {
  private paymentRepo = AppDataSource.getRepository(Payment);


  async checkPixStatus(req: Request, res: Response) {
    const usuarioId = req.params.id;
    const usuarioRepo = AppDataSource.getRepository(Usuario);

    if (!usuarioId) {
      return res.status(400).json({ error: "UsuárioId é obrigatório" });
    }
    const usuario = await usuarioRepo.findOne({ where: { id: usuarioId } });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Morador não paga
    if (usuario.tipo === "MORADOR") {
      return res.json({ status: "ISENTO" });
    }

    // Empreendedor ou prestador → consulta tabela payment
    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = await paymentRepo.findOne({ where: { usuarioId } });

    if (!payment) {
      return res.json({ status:  PaymentStatus.PENDING });
    }

    return res.json({ status: payment.status });
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

  // ================================
  // 💳 CRIAR SESSÃO MERCADO PAGO
  // ================================
  handleCreateSession = async (req: Request, res: Response) => {
    console.log("📦 Dados recebidos no body:", req.body);
    try {
      const { itens, usuarioId } = req.body;

      // 1. Validar se os itens existem
      if (!itens || itens.length === 0) {
        return res.status(400).json({ error: "Nenhum item enviado" });
      }

      const items = itens.map((item: any) => {
        const unitPrice = Number(item.valor);
        if (!unitPrice || unitPrice <= 0) throw new Error("Valor inválido no item");

        return {
          id: String(item.plano),
          title: `Plano ${item.plano} - GranConecta`,
          quantity: 1,
          unit_price: unitPrice,
          currency_id: 'BRL'
        };
      });

      const preference = new Preference(client);

      // Configuração da Preferência
      const preferenceBody: any = {
        items: items,
        payer: {
          // IMPORTANTE: Use um email de teste que não seja o seu de login no MP
          email: (req as any).user?.email || 'test_user_123@testuser.com',
        },
        back_urls: {
          success: "https://dev.api.granconecta.net.br/sucesso",
          failure: "https://dev.api.granconecta.net.br/falha",
          pending: "https://dev.api.granconecta.net.br/pendente",
        },
        auto_return: 'approved',
        metadata: {
          usuario_id: String(usuarioId),
          plano: itens[0]?.plano
        },
        payment_methods: {
          installments: 12,
          // Evite restringir métodos agora, deixe o MP gerenciar
        },
        // Notificação de Webhook (Essencial para atualizar o banco depois)
        notification_url: "https://dev.api.granconecta.net.br/api/webhook/mercadopago",
      };

      const result = await preference.create({ body: preferenceBody });

      // Salvar registro pendente no seu banco
      await this.paymentRepo.save({
        usuarioId: String(usuarioId),
        stripeSessionId: result.id!, // ID da Preferência
        status:  PaymentStatus.PENDING,
        amount: itens.reduce((acc: number, i: any) => acc + Number(i.valor), 0),
        paymentMethod: 'MERCADO_PAGO',
        plano: itens[0]?.plano,
        tipo: itens[0]?.tipo || 'PRESTADOR'
      } as any);

      return res.json({
        checkoutUrl: result.sandbox_init_point || result.init_point
      });

    } catch (err: any) {
      // Log detalhado para sabermos exatamente qual campo o MP rejeitou
      console.error("Detalhes do Erro Mercado Pago:", err.message);
      if (err.cause) console.error("Causa:", JSON.stringify(err.cause));

      return res.status(500).json({ error: "Erro ao iniciar pagamento", details: err.message });
    }
  }

  // ================================
  // 🔥 WEBHOOK MERCADO PAGO
  // ================================
  handleMercadoPagoWebhook = async (req: Request, res: Response) => {
    try {
      const { type, data } = req.body;

      if (type === 'payment' && data?.id) {
        const paymentId = String(data.id); // ID do pagamento
        const paymentApi = new MPPayment(client);
        const paymentData = await paymentApi.get({ id: paymentId });

        if (paymentData.status === 'approved') {
          const usuarioId = paymentData.metadata?.usuario_id;

          // 🚨 O PULO DO GATO: Pegar o Preference ID (que você salvou no banco)
          const preferenceId = (paymentData as any).preference_id;

          console.log(`Pagamento MP Aprovado: Usuário ${usuarioId}, Transação ${paymentId}, Preferência ${preferenceId}`);

          // Passamos o paymentId e o preferenceId. A função vai achar por um ou por outro.
          await this.confirmarPagamentoUniversal(
            String(usuarioId),
            paymentId, // primaryId
            preferenceId ? String(preferenceId) : undefined // secondaryId
          );
        }
      }
      return res.status(200).send('OK');
    } catch (error: any) {
      console.error("Erro Webhook MP:", error.message);
      return res.status(500).send("Error");
    }
  }

  // ================================
  // 🔥 WEBHOOK STRIPE
  // ================================
  async handleStripeWebhook(req: Request, res: Response) {
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
  async confirmarPagamentoUniversal(usuarioId: string, primaryId: string, secondaryId?: string) {
    await AppDataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const perfilRepo = manager.getRepository(PerfilPrestador);
      const creditRepo = manager.getRepository(UserCredits);
      const transactionRepo = manager.getRepository(CreditTransactions);
      // const usuarioRepo = manager.getRepository(Usuario); // Adicionado repositório de usuário

      // 1. Busca o pagamento pelos IDs fornecidos
      const conditions = [];
      if (primaryId) conditions.push({ stripeSessionId: primaryId });
      if (secondaryId) conditions.push({ stripeSessionId: secondaryId });

      const payment = await paymentRepo.findOne({ where: conditions });

      if (!payment) {
        console.warn("⚠️ Pagamento não localizado no banco.");
        return;
      }

      // Se já estiver pago, não faz nada para evitar duplicar créditos
      if (payment.status ===  PaymentStatus.PAID) return;

      // 2. ATUALIZA TABELA 'payments'
      payment.status =  PaymentStatus.PAID as any;
      await paymentRepo.save(payment);

      // 3. ATUALIZA TABELA 'perfil_prestador'
      // Remove o "LOJA_" do nome do plano se existir para normalizar no perfil
      const planoLimpo = payment.plano || 'ANUAL';

      const tipo = planoLimpo?.toUpperCase();

      if (tipo !== 'MENSAL' && tipo !== 'ANUAL') {
        throw new Error('tipo_assinatura inválido');
      }

      tipo_assinatura: tipo;

      await perfilRepo.update(
        { usuarioId: usuarioId },
        {
          ativo: true,
          disponivel: true,
          // Usamos 'as any' para evitar o erro de compatibilidade com o Enum/UserStatus
          status: 'APROVADO' as any,
          status_aprovacao: 'APROVADO' as any,
          tipo_assinatura: tipo
        }
      );

      // 4. ATUALIZA TABELA 'usuarios' (Libera o acesso ao sistema)
      const usuarioRepo = manager.getRepository(Usuario);
      await usuarioRepo.update(
        { id: usuarioId },
        {
          status_conta: 'APROVADO' as any
        }
      );

      // 5. GESTÃO DE CRÉDITOS (Mantido conforme sua lógica original)
      let credit = await creditRepo.findOne({ where: { usuarioId } });
      if (!credit) {
        credit = creditRepo.create({ usuarioId, balance: 0 });
      }

      const bonusAmount = 100;
      credit.balance = Number(credit.balance) + bonusAmount;
      await creditRepo.save(credit);

      // 6. LOG DE TRANSAÇÃO DE CRÉDITO
      await transactionRepo.save({
        usuarioId,
        amount: bonusAmount,
        type: 'BONUS' as any,
        description: `Ativação automática - Plano ${planoLimpo}`
      });

      console.log(`✅ Sincronização completa para o usuário: ${usuarioId}`);
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
}

export default new PaymentController();