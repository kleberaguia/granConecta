import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { AppDataSource } from '../config/data-source';
import { Order, OrderStatus } from '../models/OrderModels';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { Usuario } from '../models/UserModels';
import { UserStatus } from '../models/enums';
import { getIO } from '../socket/socket';
import { PaymentGatewayService } from '../services/PaymentGatewayService';
import { StorePaymentConfig } from '../models/StorePaymentConfigModels';
import { decrypt } from '../utils/crypto';

export class OrderController {

  private orderRepository = AppDataSource.getRepository(Order);
  private userRepository = AppDataSource.getRepository(Usuario);
  private orderService = new OrderService();

  // =========================
  // CLIENTE - MEUS PEDIDOS
  // =========================
  getMyOrders = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;

    const userId = authReq.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const orders = await this.orderRepository.find({
        where: { customerId: userId },
        relations: ["items", "items.product", "store"],
        order: { createdAt: "DESC" }
      });

      return res.json(orders);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar pedidos" });
    }
  };

  // =========================
  // LOJA - PEDIDOS RECEBIDOS
  // =========================
  getMyStoreOrders = async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const orders = await this.orderRepository.find({
        where: {
          store: {
            owner: { id: userId }
          }
        },
        relations: ["items", "customer"],
        order: { createdAt: "DESC" }
      });

      return res.json(orders);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar pedidos da loja" });
    }
  };

  getOrderDetail = async (req: Request, res: Response) => {
    // 1. Converte o ID para número (ajusta o erro ts(2322))
    const orderId = Number(req.params.id);
    const userId = (req as AuthenticatedRequest).user?.id;

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "ID do pedido inválido" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId }, // Agora o tipo coincide (number)
        relations: [
          "items",
          "customer",
          "customer.endereco",
          "customer.endereco.condominio",
          "store",
          "store.owner" // Carrega o dono da loja para a validação
        ]
      });

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      // 2. Validação de segurança corrigida (ajusta ts(18048) e ts(2551))
      const isCustomer = order.customer?.id === userId;
      const isStoreOwner = order.store?.owner?.id === userId;

      if (!isCustomer && !isStoreOwner) {
        return res.status(403).json({ error: "Sem permissão para ver este pedido" });
      }

      return res.json(order);
    } catch (err: any) {
      console.error("ERRO NO CONTROLLER:", err.message);
      return res.status(500).json({ error: "Erro ao buscar detalhes do pedido" });
    }
  };



  // =========================
  // ATUALIZAR STATUS (LOJISTA)
  // =========================
  updateStatus = async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const { status, userCode } = req.body; // 🔑 Recebe o código enviado pelo painel
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!orderId) {
      return res.status(400).json({ error: "ID inválido" });
    }

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ["store", "store.owner"]
      });

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      // 🔒 Segurança: Somente o dono da loja edita
      if (order.store?.owner?.id !== userId) {
        return res.status(403).json({ error: "Sem permissão" });
      }

      // 🛡️ TRAVA DE SEGURANÇA PARA ENTREGA
      if (status === OrderStatus.DELIVERED) {
        // Verifica se o código bate com o que está no banco
        if (!userCode || String(userCode) !== String(order.deliveryCode)) {
          return res.status(401).json({ error: "Código de entrega inválido!" });
        }

        // Captura o IP e o Horário
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        order.deliveryValidationIp = String(ip);
        order.deliveredAt = new Date();
      }

      order.status = status;
      await this.orderRepository.save(order);

      await this.orderService.notifyStatusChange(order, status);

      // 🚀 SOCKET REALTIME
      const io = getIO();
      io.to(`order_${order.id}`).emit("order_updated", {
        orderId: order.id,
        status: order.status
      });

      return res.json({
        message: "Status atualizado",
        status: order.status,
        deliveredAt: order.deliveredAt
      });

    } catch (err: any) {
      return res.status(500).json({ error: "Erro ao atualizar status" });
    }
  };

  // =========================
  // CRIAR PEDIDO
  // =========================
  create = async (req: Request, res: Response) => {
    const {
      store_id,
      items,
      payment_method,
      delivery_address,
      customer_info
    } = req.body;

    console.log('Dados do Pedido Recebidos:', req.body);
    let userId = (req as AuthenticatedRequest).user?.id;

    try {
      // ==========================================
      // 1. TRATAMENTO DE VISITANTE / CADASTRO RÁPIDO
      // ==========================================
      if (!userId && customer_info) {
        let existingUser = await this.userRepository.findOne({
          where: [
            { email: customer_info.email },
            { telefone: customer_info.telefone }
          ]
        });

        if (existingUser) {
          userId = existingUser.id;
        } else {
          const newVisitor = this.userRepository.create({
            name: customer_info.nome, // Se no banco for 'nome', mude aqui para 'nome'
            email: customer_info.email,
            telefone: customer_info.telefone,
            tipo: 'VISITANTE' as any, // Cast para evitar erro de Enum se necessário
            status_conta: UserStatus.APROVADO,
            is_interno: true
          });

          const saved = await this.userRepository.save(newVisitor);
          userId = saved.id;
        }
      }

      if (!userId) {
        return res.status(400).json({ error: "Cliente não identificado" });
      }

      // ==========================================
      // 2. CRIAÇÃO DO PEDIDO NO BANCO (SERVICE)
      // ==========================================
      const newOrder = await this.orderService.execute({
        userId,
        storeId: store_id,
        paymentMethod: payment_method,
        deliveryAddress: delivery_address,
        items
      });

      if (!newOrder) {
        return res.status(400).json({ error: "Erro ao processar pedido no Service" });
      }

      // ==========================================
      // 3. BUSCA CONFIGURAÇÃO DE PAGAMENTO DA LOJA
      // ==========================================
      // Buscamos a config manualmente para garantir que não falhe por causa de relations complexas
      const paymentConfig = await AppDataSource.getRepository(StorePaymentConfig).findOne({
        where: { store: { id: store_id } }
      }) as StorePaymentConfig;

      // Buscamos o pedido completo para o retorno
      const orderComplete = await this.orderRepository.findOne({
        where: { id: newOrder.id },
        relations: ["items", "store", "customer"]
      });

      // ==========================================
      // 4. GERAÇÃO DO PAGAMENTO (GATEWAY)
      // ==========================================
      let paymentInfo = null;

      if (payment_method === 'online' || payment_method === 'pix') {
        if (!paymentConfig) {
          console.error("ERRO: Loja sem configuração de pagamento.");
          // Opcional: Você pode retornar erro aqui ou deixar criar o pedido sem link
        } else {
          try {

            const paymentConfig = await AppDataSource.getRepository(StorePaymentConfig).findOne({
              where: { store: { id: store_id } }
            }) as StorePaymentConfig;

            if (paymentConfig && paymentConfig.mercadoPagoAccessToken) {
              try {
                // 2. DESCRIPTOGRAFE O TOKEN AQUI 
                // (Substitua 'decrypt' pela sua função real de descriptografia)
                const decryptedToken = decrypt(paymentConfig.mercadoPagoAccessToken);

                // 3. Atualize o objeto temporariamente com o token real
                paymentConfig.mercadoPagoAccessToken = decryptedToken;

              } catch (err) {
                console.error("Erro ao descriptografar token da loja");
              }
            }
            // Chamamos o gateway passando o pedido e a config da loja
            paymentInfo = await PaymentGatewayService.createPayment(orderComplete!, paymentConfig);

            const paymentAny = paymentInfo as any;

            if (payment_method === 'online') {
              console.log("SUCESSO! Link Cartão Gerado:", paymentAny?.init_point);
            } else {
              console.log("SUCESSO! Pix Gerado.");
            }
          } catch (payErr: any) {
            console.error("ERRO NO GATEWAY DE PAGAMENTO:", payErr.message);
            // Não travamos o 201 aqui, permitimos que o pedido seja criado 
            // mesmo que o link falhe (o cliente pode tentar pagar depois no Detalhes)
          }
        }
      }

      // ==========================================
      // 5. RETORNO FINAL PARA O FRONTEND
      // ==========================================
      return res.status(201).json({
        ...orderComplete,
        payment: paymentInfo
      });

    } catch (err: any) {
      console.error("ERRO CRÍTICO NO CREATE ORDER:", err.message);
      return res.status(500).json({ error: "Erro interno ao processar pedido." });
    }
  };


}