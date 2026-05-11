"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const servicosService_1 = __importDefault(require("../services/servicosService"));
class ServicoController {
    async criar(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: "Não autenticado" });
            }
            const { categoria_slug, titulo, descricao, valor_sugerido, bloco, apartamento, observacoes, } = req.body;
            const servico = await servicosService_1.default.criarServico({
                usuarioId: user.usuarioId,
                categoria_slug,
                titulo,
                descricao,
                valor_sugerido,
                bloco,
                apartamento,
                observacoes,
            });
            return res.status(201).json(servico);
        }
        catch (err) {
            console.error(err);
            if (err.message === "MORADOR_NAO_ENCONTRADO" ||
                err.message === "USUARIO_NAO_E_MORADOR") {
                return res.status(400).json({ error: "Usuário não é morador ou não existe" });
            }
            return res.status(500).json({ error: "Erro ao criar serviço" });
        }
    }
    // async meusComoMorador(req: Request, res: Response) {
    //   try {
    //     const user = (req as RequestComUsuario).user;
    //     if (!user?.usuarioId) {
    //       return res.status(401).json({ error: "Não autenticado" });
    //     }
    //     const servicos = await servicoService.listarServicosDoMorador(user.usuarioId);
    //     return res.json(servicos);
    //   } catch (err) {
    //     console.error(err);
    //     return res.status(500).json({ error: "Erro ao listar serviços do morador" });
    //   }
    // }
    async disponiveis(req, res) {
        try {
            const { categoria_slug } = req.query;
            const servicos = await servicosService_1.default.listarServicosDisponiveis(categoria_slug ? String(categoria_slug) : undefined);
            return res.json(servicos);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao listar serviços disponíveis" });
        }
    }
    // async meusComoPrestador(req: Request, res: Response) {
    //   try {
    //     const user = (req as RequestComUsuario).user;
    //     if (!user?.usuarioId) {
    //       return res.status(401).json({ error: "Não autenticado" });
    //     }
    //     const servicos = await servicoService.listarServicosDoPrestador(user.usuarioId);
    //     return res.json(servicos);
    //   } catch (err) {
    //     console.error(err);
    //     return res.status(500).json({ error: "Erro ao listar serviços do prestador" });
    //   }
    // }
    async getById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: "Id inválido" });
            }
            const servico = await servicosService_1.default.getById(id);
            if (!servico) {
                return res.status(404).json({ error: "Serviço não encontrado" });
            }
            return res.json(servico);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao buscar serviço" });
        }
    }
}
exports.default = new ServicoController();
