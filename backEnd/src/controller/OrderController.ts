// src/controllers/OrderController.ts
import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { AppDataSource } from '../config/data-source';
import { Order, OrderStatus } from '../models/OrderModels';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { Usuario } from '../models/UserModels';
import { UsuarioAuth } from '../models/UsuarioAuthModels';
import { UserStatus } from '../models/enums';
import { getIO } from '../socket/socket';
import { PaymentGatewayService } from '../services/PaymentGatewayService';
import { StorePaymentConfig } from '../models/StorePaymentConfigModels';
import { ServicoSolicitacao } from '../models/servicoSolicitacaoModels';
import { ServicoCandidatura } from '../models/servicoCandidatura';
import * as bcrypt from 'bcryptjs';
import { decrypt } from '../utils/crypto';
import { MarketingAgendamento, MarketingStatus, MarketingTipo } from '../models/MarketingAgendamentoModels';
import { Store } from '../models/StoreModels';

export class OrderController {

  private orderRepository = AppDataSource.getRepository(Order);
  private userRepository = AppDataSource.getRepository(Usuario);
  private orderService = new OrderService();

  // =========================
  // CLIENTE - MEUS PEDIDOS
  // =========================
  getMyOrders = async (req: Request, res: Response) => {

    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Não autenticado"
      });
    }

    try {

      const orders = await this.orderRepository.find({

        where: {
          customerId: userId
        },

        relations: [
          "items",
          "items.product",
          "store"
        ],

        order: {
          createdAt: "DESC"
        }
      });

      return res.json(orders);

    } catch (err) {

      console.error(
        "Erro ao buscar pedidos do cliente:",
        err
      );

      return res.status(500).json({
        error: "Erro ao buscar pedidos"
      });
    }
  };

  // =========================
  // LOJA - PEDIDOS RECEBIDOS
  // =========================
  getMyStoreOrders = async (req: Request, res: Response) => {

    try {

      const store = (req as any).store;

      const orders = await this.orderRepository.find({
        where: {
          storeId: store.id
        },
        relations: [
          "items",
          "items.product",
          "customer",
          "store"
        ],
        order: {
          createdAt: "DESC"
        }
      });

      return res.json(orders);

    } catch (err) {

      console.error("Erro ao buscar pedidos:", err);

      return res.status(500).json({
        error: "Erro ao buscar pedidos da loja"
      });
    }
  };
  // =========================
  // DETALHE DO PEDIDO
  // =========================
  getOrderDetail = async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const userId = (req as AuthenticatedRequest).user?.id;

    if (isNaN(orderId)) return res.status(400).json({ error: "ID inválido" });
    if (!userId) return res.status(401).json({ error: "Não autenticado" });

    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: [
          "items", "customer", "customer.endereco",
          "customer.endereco.condominio", "store", "store.owner"
        ]
      });

      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });

      const isCustomer = order.customer?.id === userId;
      const isStoreOwner = order.store?.owner?.id === userId;

      if (!isCustomer && !isStoreOwner) {
        return res.status(403).json({ error: "Sem permissão" });
      }

      return res.json(order);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar detalhes" });
    }
  };

  // =========================
  // ATUALIZAR STATUS (LOJISTA)
  // =========================
  updateStatus = async (req: Request, res: Response) => {

    const orderId = Number(req.params.id);

    const { status, userCode } = req.body;

    const userId = (req as AuthenticatedRequest).user?.usuarioId;

    try {

      const order = await this.orderRepository.findOne({
        where: {
          id: orderId
        },
        relations: [
          "store"
        ]
      });

      if (!order) {

        return res.status(404).json({
          error: "Pedido não encontrado"
        });
      }

      // valida dono da loja
      if (order.store?.usuarioId !== userId) {

        return res.status(403).json({
          error: "Acesso negado"
        });
      }

      // entrega
      if (status === OrderStatus.DELIVERED) {

        // só valida código se existir
        if (
          order.deliveryCode &&
          String(userCode) !== String(order.deliveryCode)
        ) {

          return res.status(401).json({
            error: "Código de entrega inválido!"
          });
        }

        const ip =
          req.headers['x-forwarded-for'] ||
          req.socket.remoteAddress;

        order.deliveryValidationIp = String(ip);

        order.deliveredAt = new Date();
      }

      order.status = status;

      await this.orderRepository.save(order);

      await this.orderService.notifyStatusChange(
        order,
        status
      );

      getIO()
        .to(`order_${order.id}`)
        .emit("order_updated", {
          orderId: order.id,
          status
        });

      return res.json({
        success: true,
        message: "Status atualizado",
        status: order.status
      });

    } catch (err: any) {

      console.error(
        "ERRO UPDATE STATUS:",
        err
      );

      return res.status(500).json({
        error: err.message || "Erro ao atualizar status"
      });
    }
  };

  // ============================================================
  // CRIAR PEDIDO / SERVIÇO (HÍBRIDO COM CADASTRO DE VISITANTE)
  // ============================================================
  create = async (req: Request, res: Response) => {
    const {
      store_id, items, payment_method, delivery_address,
      customer_info, is_service, service_details
    } = req.body;

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let userId = (req as AuthenticatedRequest).user?.id || req.body.usuarioId;
      let usuarioInstancia: Usuario | null = null;

      // 1. CADASTRO DE VISITANTE
      if (!userId && customer_info) {
        let existingUser = await queryRunner.manager.findOne(Usuario, {
          where: { email: customer_info.email }
        });

        if (existingUser) {
          userId = existingUser.id;
          usuarioInstancia = existingUser;
        } else {
          const newUser = queryRunner.manager.create(Usuario, {
            name: customer_info.nome,
            email: customer_info.email,
            telefone: customer_info.telefone,
            endereco_padrao: customer_info.endereco,
            tipo: 'VISITANTE' as any,
            status_conta: UserStatus.APROVADO,
            is_interno: false,
          });
          const savedUser = await queryRunner.manager.save<Usuario>(newUser);
          userId = savedUser.id;
          usuarioInstancia = savedUser;

          const novoEndereco = queryRunner.manager.create("Endereco", {
            usuarioId: userId,
            condominio_id: customer_info.condominio_id || null,
            logradouro: customer_info.endereco || delivery_address || "Não informado",
            bairro: customer_info.bairro || "",
            cidade: customer_info.cidade || "São Paulo",
            uf: customer_info.uf || "SP",
            numero: customer_info.numero || "S/N",
            bloco_torre: customer_info.bloco || null,
            unidade_apto: customer_info.unidade || null,
          });
          await queryRunner.manager.save(novoEndereco);

          const hashedPassword = await bcrypt.hash(customer_info.senha, 10);
          const codigoVerificacao = Math.floor(100000 + Math.random() * 900000).toString();
          const newUserAuth = queryRunner.manager.create(UsuarioAuth, {
            usuarioId: userId,
            email: customer_info.email,
            password_hash: hashedPassword,
            codigoVerificacao,
          });
          await queryRunner.manager.save<UsuarioAuth>(newUserAuth);
        }
      } else if (userId) {
        // Busca o usuário logado para identificar o perfil de forma segura dentro da transação
        usuarioInstancia = await queryRunner.manager.findOne(Usuario, { where: { id: userId } });
      }

      if (!userId) throw new Error("Usuário não identificado.");

      // 2. FLUXO EXCLUSIVO DE SERVIÇO
      if (is_service) {
        const prestadorId = service_details?.prestadorId;

        const novaSolicitacao = queryRunner.manager.create(ServicoSolicitacao, {
          usuarioId: userId,
          condominio_id: service_details?.condominio_id || null,
          categoriaId: service_details?.categoriaId,
          titulo: service_details?.titulo,
          descricao: service_details?.descricao,
          prestador_id_exclusivo: prestadorId || null,
          status: prestadorId ? 'DIRECIONADO' : 'ABERTO'
        });

        const solicitacaoSalva = await queryRunner.manager.save(novaSolicitacao);

        if (prestadorId) {
          const candidatura = queryRunner.manager.create(ServicoCandidatura, {
            solicitacaoId: solicitacaoSalva.id,
            prestadorId: prestadorId,
            valor_proposta: 0,
            status: 'NEGOCIACAO' as any,
            mensagem: "Solicitação direta via perfil."
          });
          await queryRunner.manager.save(candidatura);
        }

        await queryRunner.commitTransaction();
        return res.status(201).json({
          message: "Serviço solicitado!",
          id: solicitacaoSalva.id,
          isService: true
        });
      }

      // 3. FLUXO EXCLUSIVO DE PRODUTO (LOJA)
      // Se chegou aqui, is_service é falso.

      // 🎯 TRATAMENTO UNIFICADO PARA OS TRÊS TIPOS DE PERFIS:
      if (usuarioInstancia) {
        const tipoUsuario = String(usuarioInstancia.tipo || "").toUpperCase();

        if (tipoUsuario === 'VISITANTE') {
          // 🟢 Se for VISITANTE (fora do condomínio), limpa as referências para o banco aceitar nulo
          (usuarioInstancia as any).condominioId = null;
          (usuarioInstancia as any).condominio = null;
        } else {
          // 🏠 Se for MORADOR ou PRESTADOR morador, mantém o vínculo original do condomínio intocado
        }
      }

      // Executa a criação do pedido dentro do gerenciador de transações unificado do queryRunner
      const newOrder = await this.orderService.execute({
        userId,
        storeId: store_id,
        paymentMethod: payment_method,
        deliveryAddress: delivery_address,
        items
      }, queryRunner.manager);

      if (!newOrder) throw new Error("Erro ao gerar pedido.");

      // Lógica de Marketing / Recorrência
      const itensRecorrentes = items.filter((item: any) => item.product?.is_recorrente);
      if (itensRecorrentes.length > 0) {
        for (const item of itensRecorrentes) {
          const dias = item.product.dias_recorrencia || 30;
          const dataLembrete = new Date();
          dataLembrete.setDate(dataLembrete.getDate() + dias);

          await queryRunner.manager.save(MarketingAgendamento, {
            usuario_id: userId,
            loja_id: store_id,
            produto_id: item.productId,
            data_execucao: dataLembrete,
            tipo: MarketingTipo.LEMBRETE_RECOMPRA,
            status: MarketingStatus.PENDENTE,
            metadata: {
              produto_id: item.productId,
              categoria_nome: item.product.categoria
            }
          });
        }
      }

      // Lógica de Pagamento Online
      const paymentConfig = await queryRunner.manager.findOne(StorePaymentConfig, {
        where: { store: { id: store_id } }
      });

      let paymentInfo = null;
      if (payment_method === 'online' || payment_method === 'pix') {
        try {
          // Chamamos o método especialista do service que foi corrigido e testado
          paymentInfo = await this.orderService.generateInitialPayment(newOrder);
        } catch (payErr: any) {
          console.error("❌ ERRO INTEGRACAO MERCADO PAGO:", payErr.message);
          // Caso queira que o pedido trave se o PIX falhar, você pode dar um throw err aqui.
          // Como é melhor garantir que o pedido salve, mantemos o fluxo avisando no console.
        }
      }

      // Dispara sinalizador via WebSocket para notificar o lojista em tempo real
      getIO().to(`store_owner_${store_id}`).emit("new_order", newOrder);

      // Comita todas as inserções no banco
      await queryRunner.commitTransaction();

      // Retorna a resposta montando explicitamente a propriedade payment para o front-end
      return res.status(201).json({
        ...newOrder,
        payment: paymentInfo,
        isService: false
      });

    } catch (err: any) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      console.error("ERRO CREATE:", err.message);
      return res.status(500).json({ error: err.message || "Erro interno." });
    } finally {
      await queryRunner.release();
    }
  };
}