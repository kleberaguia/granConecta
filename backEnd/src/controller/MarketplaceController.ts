import {
  Request,
  Response,
} from "express";

import MarketplaceService from "../services/MarketplaceService";
import { MarketPlaceModel } from "../models/MarketPlaceModel";

class MarketplaceController {
  async listByStore(
    req: Request,
    res: Response,
  ) {
    try {
      const { lojaId } =
        req.params;

      if (!lojaId) {
        return res.status(400).json({
          error:
            "ID da loja não fornecido.",
        });
      }

      const banners =
        await MarketplaceService.getMyBanners(
          lojaId,
        );

      return res
        .status(200)
        .json(banners);
    } catch (error) {
      console.error(
        "[MarketplaceController] Erro ao listar banners da loja:",
        error,
      );

      return res.status(500).json({
        error:
          "Erro interno ao buscar banners.",
      });
    }
  }

  async listActive(
    req: Request,
    res: Response,
  ) {
    try {
      const condominioInformado =
        String(
          req.params.condominioId ||
          "",
        ).trim();

      /*
       * Quando o frontend enviar "global",
       * usamos null para procurar banners
       * com condominio_id IS NULL.
       */
      const condominioId:
        string | null =
        !condominioInformado ||
          condominioInformado.toLowerCase() ===
          "global"
          ? null
          : condominioInformado;

      /*
       * MARKETPLACE é o local padrão.
       * SERVICOS será enviado pela
       * vitrine de prestadores.
       */
      const local =
        String(
          req.query.local ||
          "MARKETPLACE",
        )
          .trim()
          .toUpperCase();

      const banners =
        await MarketplaceService.getActiveBanners(
          condominioId,
          local,
        );

      return res
        .status(200)
        .json(banners);
    } catch (error) {
      console.error(
        "[MarketplaceController] Erro ao buscar banners ativos:",
        error,
      );

      return res.status(500).json({
        error:
          "Erro ao buscar banners.",
      });
    }
  }

  async store(
    req: Request,
    res: Response,
  ) {
    try {
      const banner: MarketPlaceModel =
        await MarketplaceService.createBanner(
          req.body,
        );

      return res.status(201).json({
        message:
          "Solicitação enviada!",
        banner,
      });
    } catch (error) {
      console.error(
        "[MarketplaceController] Erro ao solicitar banner:",
        error,
      );

      return res.status(500).json({
        error:
          "Erro ao solicitar banner.",
      });
    }
  }

  async updateStatus(
    req: Request,
    res: Response,
  ) {
    try {
      const id = Number(
        req.params.id,
      );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          error:
            "ID do banner inválido.",
        });
      }

      const {
        status,
        pago,
      } = req.body;

      await MarketplaceService.updateBannerStatus(
        id,
        status,
        Boolean(pago),
      );

      return res.json({
        message:
          "Banner atualizado com sucesso.",
      });
    } catch (error) {
      console.error(
        "[MarketplaceController] Erro ao atualizar banner:",
        error,
      );

      return res.status(500).json({
        error:
          "Erro ao atualizar banner.",
      });
    }
  }

  async createBanner(
    req: Request,
    res: Response,
  ) {
    try {
      const {
        titulo,
        subtitulo,
        loja_id,
        plano,
        condominio_id,
        link_destino,
        cor_destaque,
      } = req.body;

      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error:
            "Imagem obrigatória.",
        });
      }

      let diasDuracao = 7;

      if (plano === "prata") {
        diasDuracao = 15;
      }

      if (plano === "ouro") {
        diasDuracao = 30;
      }

      const data_inicio =
        new Date();

      const data_fim =
        new Date();

      data_fim.setDate(
        data_inicio.getDate() +
        diasDuracao,
      );

      const novoBanner =
        await MarketplaceService.createBanner(
          {
            loja_id:
              loja_id || null,
            condominio_id:
              condominio_id ||
              null,
            titulo,
            subtitulo,
            imagem_url:
              `/uploads/images/${file.filename}`,
            cor_destaque:
              cor_destaque ||
              "#3b82f6",
            link_destino:
              link_destino ||
              "",
            data_inicio,
            data_fim,
          },
        );

      return res
        .status(201)
        .json(novoBanner);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido";

      console.error(
        "[MarketplaceController] Erro ao criar banner:",
        mensagem,
      );

      return res.status(500).json({
        error: mensagem,
      });
    }
  }
}

export default new MarketplaceController();