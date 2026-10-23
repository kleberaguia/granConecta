// src/controller/PagamentoController.ts
import { Request, Response } from "express";
import PagamentoService from "../services/PagamentoService";
import { AppDataSource } from "../config/data-source";
import { Usuario } from "../models/UserModels";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";
import { encrypt } from "../utils/crypto";

class PagamentoController {
  // cria cobrança e retorna link de pagamento
  async criar(req: Request, res: Response) {
    try {
      // 1. Pegamos o ID da oferta enviado pelo Front no corpo (BODY)
      const { ofertaId } = req.body;

      console.log("[PAGAMENTO CONTROLLER] criar", {
        ofertaIdRecebido: ofertaId,
        body: req.body,
        usuarioId: (req as any).user?.usuarioId || (req as any).user?.id,
      });

      // 2. Pegamos o ID do usuário logado (Morador)
      const user = (req as any).user;
      const usuarioId = user?.usuarioId || user?.id;

      // Validação extra de segurança no controller
      if (!ofertaId) {
        return res.status(400).json({ error: 'O campo ofertaId é obrigatório no corpo da requisição.' });
      }

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      // 3. Chamamos o seu Service passando exatamente os dois argumentos que o log mostrou (ARG1 e ARG2)
      const novoPagamento = await PagamentoService.criarPagamentoPorOferta(ofertaId, usuarioId);

      return res.status(200).json(novoPagamento);

    } catch (error: any) {
      console.error("Erro no PagamentoController:", error.message);
      return res.status(500).json({ error: error.message });
    }

  }


  async recuperarOuCriar(req: Request, res: Response) {
    const { ofertaId } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) return res.status(400).json('Id usuario é obrigatório')

    try {
      // CHAMADA DO SEU SERVIÇO 🚀
      // Se já existir, devolve o mesmo. Se não existir ou o status for pendente, atualiza o link.
      const pagamento = await PagamentoService.criarPagamentoPorOferta(ofertaId, usuarioId);

      return res.status(200).json({
        success: true,
        link_pagamento: pagamento.link_pagamento
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async liberarDinheiro(req: Request, res: Response) {
    try {
      // 1. Captura as variáveis vindas do Front-end
      const { pagamentoId, codigoVerificacao, lojistaId } = req.body;

      // 2. Identifica o ID de quem está logado de forma flexível
      const userLogged = (req as any).user;
      const prestadorId = userLogged?.usuarioId || userLogged?.id || lojistaId;

      if (!pagamentoId || !codigoVerificacao || !prestadorId) {
        return res.status(400).json({
          error: "Campos obrigatórios ausentes: pagamentoId, codigoVerificacao e prestadorId."
        });
      }
      // 3. Chamamos o service passando as variáveis corretas que configuramos no PagamentoService
      const resultado = await PagamentoService.validarLiberacaoRecurso(
        pagamentoId,
        prestadorId,
        codigoVerificacao // 🟢 O Service recebe o token informado aqui
      );

      return res.json({
        success: true,
        message: "Validação concluída com sucesso! Dinheiro enviado ao lojista/prestador.",
        detalhes: resultado // Retorna se foi liberação TOTAL ou PARCIAL
      });

    } catch (err: any) {
      console.error("❌ Erro ao validar liberação de recurso:", err.message);
      return res.status(400).json({ error: err.message });
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

  async webhookMercadoPago(
    req: Request,
    res: Response
  ) {

    try {

      await PagamentoService.processarWebhookMercadoPago(req.body, req);

      return res.sendStatus(200);

    } catch (error: any) {

      console.error(error);

      return res.sendStatus(500);
    }
  }

  async obterLinkConexaoBancaria(req: Request, res: Response) {
    try {

      console.log('============= HIT CONTROLLER: obterLinkConexaoBancaria =============');
      console.log(`Usuário autenticado solicitando o link: ${req.user?.id || 'ID não encontrado no token'}`);
      console.log('====================================================================');
      const usuarioId = (req as any).user?.id || req.body.usuarioId;
      if (!usuarioId) {
        return res.status(401).json({ error: 'USUARIO_NAO_AUTENTICADO' });
      }
      const urlConexao = PagamentoService.gerarUrlOauthMercadoPago(usuarioId);
      return res.json({ url: urlConexao });
    } catch (error: any) {
      console.error('❌ Erro ao gerar link OAuth:', error.message);
      return res.status(500).json({ error: 'Erro interno ao processar conexão bancária.' });
    }
  }

  async oauthCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;

      // O 'state' que recebemos de volta é o ID do usuário que enviamos na ida!
      const usuarioId = String(state);
      const authorizationCode = String(code);
      console.log('============= HIT CONTROLLER: oauthCallback =============');
      console.log(`Query Params recebidos -> code: ${code ? 'RECEBIDO' : 'AUSENTE'}, state (usuarioId): ${state || 'AUSENTE'}`);
      console.log('=========================================================');



      console.log(`[OAuth MP] Trocando código para o usuário: ${usuarioId}`);

      if (!code || !state) {
        return res.status(400).json({ error: 'PARAMETROS_INVALIDOS_OU_AUSENTES' });
      }

      // 1. Envia o código para o Service falar com o Mercado Pago
      const dadosOauth = await PagamentoService.trocarCodigoOauth(authorizationCode);
      const vendedorAccessToken = dadosOauth.access_token;
      const gatewayContaId = dadosOauth.user_id; // Esse é o ID permanente da conta do prestador

      // 2. Salva o ID da conta do prestador no seu banco de dados
      const usuarioRepo = AppDataSource.getRepository(Usuario); // Garanta a importação do seu Model de Usuário
      const usuario = await usuarioRepo.findOne({ where: { id: usuarioId } });

      if (!usuario) {
        return res.status(444).json({ error: 'USUARIO_NAO_ENCONTRADO_NO_BANCO' });
      }

      // Altera a coluna que armazena o id de faturamento
      // O access token é armazenado criptografado no banco.
      usuario.mercadoPagoAccessToken = encrypt(vendedorAccessToken);
      usuario.gateway_conta_id = String(gatewayContaId);
      await usuarioRepo.save(usuario);

      console.log(`[OAuth MP] Conta vinculada com sucesso para ${usuario.name}! ID: ${gatewayContaId}`);

      // 3. Redireciona o prestador de volta para a tela do Dashboard dele no Frontend
      const urlFrontendDashboard = process.env.URL_FRONTEND_DASHBOARD || 'https://granconecta.net.br/dashboard';
      return res.redirect(`${urlFrontendDashboard}?conexao=sucesso`);

    } catch (error: any) {
      console.error('❌ Erro no callback OAuth:', error.message);
      const urlFrontendDashboard = process.env.URL_FRONTEND_DASHBOARD || 'https://granconecta.net.br/dashboard';
      return res.redirect(`${urlFrontendDashboard}?conexao=erro`);
    }
  }
}

export default new PagamentoController();
