// src/controller/PagamentoController.ts
import { Request, Response } from "express";
import PagamentoService from "../services/PagamentoService";
import { AppDataSource } from "../config/data-source";
import { Usuario } from "../models/UserModels";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";

class PagamentoController {
  // cria cobrança e retorna link de pagamento
  async criar(req: Request, res: Response) {
    try {
      const { ofertaId } = req.body;
      const user = (req as any).user;
      if (!user?.usuarioId) return res.status(401).json({ error: "Não autenticado" });

      const registro = await PagamentoService.criarPagamentoPorOferta(ofertaId, user.usuarioId);
      return res.status(201).json({
        id: registro.id,
        link_pagamento: registro.link_pagamento,
        status: registro.status,
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message || "Erro ao criar pagamento" });
    }
  }

  // consulta pagamento por id
  async listarMeusPagamentos(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).user?.usuarioId;
      if (!usuarioId) return res.status(401).json({ error: "ID ausente" });

      const pagamentos = await PagamentoService.listarPorUsuario(usuarioId);

      // Garante que sempre retorne um array, mesmo que vazio
      return res.status(200).json(Array.isArray(pagamentos) ? pagamentos : []);
    } catch (err: any) {
      console.error("Erro ao listar pagamentos:", err);
      return res.status(500).json({ error: "Erro interno no extrato" });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validação básica de presença do ID
      if (!id || id === 'undefined' || id === 'meus') {
        return res.status(400).json({ error: 'ID de pagamento inválido ou ausente.' });
      }

      const registro = await PagamentoService.getById(id);

      if (!registro) {
        return res.status(404).json({
          erro: "NOT_FOUND",
          mensagem: "O pagamento solicitado não foi encontrado."
        });
      }

      return res.json(registro);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao buscar pagamento" });
    }
  }

  async updatePixKey(req: Request, res: Response) {
    try {


      const userId = (req as any).user?.usuarioId; // Use o nome que o seu middleware injeta (usuarioId ou id)
      const file = req.file;
      const perfilRepo = AppDataSource.getRepository(PerfilPrestador);
      if (!userId) {
        return res.status(401).json({ error: "ID do usuário não encontrado na sessão." });
      }

      const { chave_pix } = req.body;
      const userRepository = AppDataSource.getRepository(Usuario); // Verifique se é 'Usuario' ou 'User'

      const user = await userRepository.findOneBy({ id: userId });

      let perfil = await perfilRepo.findOne({ where: { usuarioId: userId } });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado no banco." });
      }
      if (!perfil) {
        return res.status(404).json({ message: "Perfil profissional não encontrado." });
      }

      // 1. Atualiza a Chave PIX
      if (chave_pix) perfil.chavePix = chave_pix;

      // 2. Atualiza o QR Code (se houver arquivo)
      if (file) perfil.qrCodePixUrl = file.filename;
      await userRepository.save(user);

      return res.json({ message: "Chave PIX atualizada!", chave_pix: perfil.chavePix });
    } catch (error) {
      console.error("ERRO NO BACKEND:", error); // Isso vai aparecer no seu terminal
      return res.status(500).json({ error: "Erro interno ao salvar chave PIX." });
    }
  }

  // 2. Upload do QR Code (Arquivo via Multer)
  async uploadQRCode(req: Request, res: Response) {
    try {
      const perfilRepo = AppDataSource.getRepository(PerfilPrestador);
      const userId = (req as any).user?.usuarioId;
      const file = req.file; // Processado pelo seu arquivo de upload.ts


      if (!file) {
        return res.status(400).json({ error: "Arquivo de QR Code não enviado." });
      }

      const userRepository = AppDataSource.getRepository(Usuario);
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado ou ID inválido." });
      }
      const user = await userRepository.findOneBy({ id: userId });

      if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

      let perfil = await perfilRepo.findOne({ where: { usuarioId: userId } });
      if (!perfil) {
        return res.status(404).json({ message: "Perfil não encontrado." });
      }
      // Salva apenas o nome do arquivo gerado pelo seu Multer
      if (file) perfil.qrCodePixUrl = file.filename;


      //await userRepository.save(user);
      await perfilRepo.save(perfil);

      return res.json({
        message: "QR Code atualizado com sucesso!",
        url: file.filename
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao processar upload do QR Code." });
    }
  }
}

export default new PagamentoController();
