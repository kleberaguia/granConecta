import { Request, Response } from "express";
import BusinessCatalogService from "../services/BusinessCatalogService";

const businessCatalogService = new BusinessCatalogService();

class BusinessCatalogController {
  async listPublicServices(req: Request, res: Response) {
    try {
      const storeId = String(req.params.storeId || "").trim();

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: "storeId é obrigatório.",
        });
      }

      const items =
        await businessCatalogService.listarOpcoesServico(storeId);

      const result = items.map((item) => {
        const price =
          businessCatalogService.getPrecoVigente(item);

        return {
          id: item.id,
          storeId: item.storeId,

          tipo: item.tipo,

          nome: item.nome,
          descricao: item.descricao,

          preco: price.precoBase,
          precoPromocional: price.precoPromocional,
          precoVigente: price.precoVigente,
          promocaoAtiva: price.promocaoAtiva,

          duracaoMinutos: item.duracaoMinutos,
          totalSessoes: item.totalSessoes,

          modalidade: item.modalidade,

          schedulingPolicy: item.schedulingPolicy,
          maxSessionsPerWeek: item.maxSessionsPerWeek,
          allowStandalonePurchase:
            item.allowStandalonePurchase,

          destaque: item.destaque,

          metadata: item.metadata,
        };
      });

      return res.status(200).json({
        success: true,
        storeId,
        items: result,
      });
    } catch (error: any) {
      console.error(
        "[BUSINESS CATALOG PUBLIC SERVICES]",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Erro ao carregar serviços do catálogo.",
      });
    }
  }
}

export default new BusinessCatalogController();