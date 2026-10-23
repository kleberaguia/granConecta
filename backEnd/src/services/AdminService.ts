import { AppDataSource } from '../config/data-source';
import { RefundRequest, RefundStatus } from '../models/RefundRequestModel';
import { IDashboardStats, IAdminAssinatura } from '../types/granconecta';
import { PerfilPrestador } from '../models/PerfilPrestadorModel';

class AdminService {
  // ==========================================
  // 📊 ESTATÍSTICAS DO DASHBOARD
  // ==========================================
  async getDashboardStats(): Promise<IDashboardStats> {
    try {
      const resAtivos = await AppDataSource.query("SELECT COUNT(*) as count FROM payments WHERE UPPER(status) = 'PAID'");
      const resPendentes = await AppDataSource.query("SELECT COUNT(*) as count FROM payments WHERE UPPER(status) IN ('PENDING', 'PENDENTE')");
      const resReceita = await AppDataSource.query("SELECT SUM(amount) as total FROM payments WHERE UPPER(status) = 'PAID'");
      const resCreditos = await AppDataSource.query("SELECT SUM(balance) as total FROM user_credits");

      let resMensal = [{ total: 0, qtd: 0 }];
      let resAnual = [{ total: 0, qtd: 0 }];

      try {
        resMensal = await AppDataSource.query(
          "SELECT SUM(amount) as total, COUNT(*) as qtd FROM payments WHERE UPPER(status) = 'PAID' AND UPPER(frequencia) = 'MENSAL'"
        );
        resAnual = await AppDataSource.query("SELECT SUM(amount) as total, COUNT(*) as qtd FROM payments WHERE UPPER(status) = 'PAID' AND UPPER(plano) = 'ANUAL'");
      } catch (e) {
        console.warn("⚠️ Colunas plano/tipo não encontradas em payments.");
      }

      return {
        ativos: Number(resAtivos[0]?.count) || 0,
        pendentes: Number(resPendentes[0]?.count) || 0,
        receita: Number(resReceita[0]?.total) || 0,
        creditos_totais: Number(resCreditos[0]?.total) || 0,
        receita_mensal: Number(resMensal[0]?.total) || 0,
        qtd_mensal: Number(resMensal[0]?.qtd) || 0,
        receita_anual: Number(resAnual[0]?.total) || 0,
        qtd_anual: Number(resAnual[0]?.qtd) || 0,
      };
    } catch (err) {
      console.error("🔥 Erro Stats:", err);
      throw err;
    }
  }

  // ==========================================
  // 📋 LISTAGEM DE ASSINATURAS (EMPREENDEDORES)
  // ==========================================
  async getSubscriptionsList(): Promise<IAdminAssinatura[]> {
    const query = `
    SELECT
      u.id,
      u.id AS usuarioId,
      u.name AS nome,
      u.email,
      u.telefone,
      u.status_conta,
      u.tipo,
      p.plano,
      pay.status AS status_pagamento,
      pay.tipo AS tipo_pagamento
    FROM usuarios u

    LEFT JOIN perfil_prestador p
      ON p.usuarioId = u.id

    INNER JOIN payments pay
      ON pay.id = (
        SELECT p2.id
        FROM payments p2
        WHERE p2.usuarioId = u.id
          AND p2.tipo IN ('PRESTADOR', 'EMPREENDEDOR')
        ORDER BY p2.createdAt DESC, p2.id DESC
        LIMIT 1
      )

    WHERE u.tipo = 'EMPREENDEDOR'

    ORDER BY pay.createdAt DESC
  `;

    return AppDataSource.query<IAdminAssinatura[]>(query);
  }
  // ==========================================
  // 👷 PRESTADORES PARA APROVAÇÃO
  // ==========================================
  async getPrestadoresParaAprovacao() {
    const query = `
    SELECT
      pp.*,
      u.id AS usuarioId,
      u.name AS usuario_nome,
      u.email AS usuario_email,
      u.tipo AS usuario_tipo,
      pay.status AS status_pagamento,
      pay.amount AS valor_cobrado

    FROM perfil_prestador pp

    INNER JOIN usuarios u
      ON pp.usuarioId = u.id

    LEFT JOIN payments pay
      ON pay.id = (
        SELECT p2.id
        FROM payments p2
        WHERE p2.usuarioId = u.id
        ORDER BY p2.createdAt DESC, p2.id DESC
        LIMIT 1
      )

    WHERE u.tipo = 'PRESTADOR'

    ORDER BY
      CASE
        WHEN pp.status_aprovacao = 'PENDENTE' THEN 0
        ELSE 1
      END,
      pp.id DESC
  `;

    return await AppDataSource.query(query);
  }

  // ==========================================
  // 💸 REEMBOLSOS (AQUI ESTAVA O ERRO)
  // ==========================================
  async getPendingRefunds() {
    return await AppDataSource.getRepository(RefundRequest).find({
      where: { status: RefundStatus.PENDING },
      relations: ["usuario"],
      order: { created_at: "ASC" }
    });
  }


  async updateRefundStatus(
    id: number,
    status: "paid" | "rejected"
  ) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Identificador de reembolso inválido.");
    }

    if (status !== "paid" && status !== "rejected") {
      throw new Error("Status de reembolso inválido.");
    }

    return AppDataSource.transaction(async (manager) => {
      const refund = await manager
        .getRepository(RefundRequest)
        .createQueryBuilder("refund")
        .setLock("pessimistic_write")
        .where("refund.id = :id", { id })
        .getOne();

      if (!refund) {
        throw new Error("Reembolso não encontrado.");
      }

      if (refund.status !== RefundStatus.PENDING) {
        throw new Error("Este reembolso já foi processado.");
      }

      if (status === "rejected") {
        const result = await manager.query(
          `UPDATE user_credits
         SET balance = balance + ?
         WHERE usuarioId = ?`,
          [refund.amount, refund.usuarioId]
        );

        if (result?.affectedRows !== 1) {
          throw new Error(
            "Não foi possível devolver os créditos ao usuário."
          );
        }
      }

      refund.status =
        status === "paid"
          ? RefundStatus.PAID
          : RefundStatus.REJECTED;

      await manager.save(refund);

      return {
        success: true,
        status: refund.status,
      };
    });
  }


  // ==========================================
  // ✅ CONFIRMAR PAGAMENTO E ATIVAR PERFIL
  // ==========================================
  async confirmarPagamento(usuarioId: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const paymentData = await queryRunner.manager.query(
        "SELECT id, plano FROM payments WHERE usuarioId = ? AND UPPER(status) != 'PAID' ORDER BY createdAt DESC LIMIT 1",
        [usuarioId]
      );

      if (paymentData.length === 0) {
        await queryRunner.rollbackTransaction();
        return { message: "Sem pagamentos pendentes." };
      }

      const pId = paymentData[0].id;
      const planoAtivo = paymentData[0].plano.replace('LOJA_', '');

      await queryRunner.manager.query("UPDATE payments SET status = 'PAID', updatedAt = NOW() WHERE id = ?", [pId]);
      await queryRunner.manager.query(
        "UPDATE perfil_prestador SET ativo = true, status = 'APROVADO', status_aprovacao = 'APROVADO', plano = ? WHERE usuarioId = ?",
        [planoAtivo, usuarioId]
      );
      await queryRunner.manager.query("UPDATE usuarios SET status_conta = 'APROVADO' WHERE id = ?", [usuarioId]);

      await queryRunner.commitTransaction();
      return { success: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async atualizarStatusUsuario(usuarioId: string, novoStatus: string) {
    await AppDataSource.query("UPDATE usuarios SET status_conta = ? WHERE id = ?", [novoStatus, usuarioId]);
    return { success: true };
  }
}

export default new AdminService();