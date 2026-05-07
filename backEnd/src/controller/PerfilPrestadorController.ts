import { Request, Response } from 'express';
import PerfilPrestadorService from '../services/PerfilPrestadorService';

export const salvarPerfil = async (req: Request, res: Response) => {
    try {
        const { usuarioId } = req.params;
        const dadosTexto = req.body;

        const filesArray = req.files as Express.Multer.File[] || [];

        const filesMap: { [key: string]: Express.Multer.File } = {};
        filesArray.forEach(file => {
            filesMap[file.fieldname] = file;
        });

        // !! ADICIONE ISSO: Captura o arquivo da IA se ele existir !!
        const iaFile = filesMap['ia_reference'];

        let layoutConfigDoFront = {};
        try {
            layoutConfigDoFront = typeof dadosTexto.layoutConfig === 'string'
                ? JSON.parse(dadosTexto.layoutConfig)
                : (dadosTexto.layoutConfig || {});
        } catch (e) {
            console.error("Erro no parse do layoutConfig", e);
        }

        const foto_perfil_url = filesMap['foto_perfil_url']
            ? `/uploads/images/${filesMap['foto_perfil_url'].filename}`
            : dadosTexto.foto_perfil_url;

        const foto_hero_url = filesMap['foto_hero_url']
            ? `/uploads/images/${filesMap['foto_hero_url'].filename}`
            : dadosTexto.foto_hero_url;

        const section_image = filesMap['section_image']
            ? `/uploads/images/${filesMap['section_image'].filename}`
            : (layoutConfigDoFront as any).sectionImage;

        let vitrineItems = (layoutConfigDoFront as any).vitrineItems || [];
        if (Array.isArray(vitrineItems)) {
            vitrineItems = vitrineItems.map((item: any, index: number) => {
                const fieldName = `vitrine_file_${index}`;
                if (filesMap[fieldName]) {
                    return {
                        ...item,
                        image: `/uploads/images/${filesMap[fieldName].filename}`
                    };
                }
                return item;
            });
        }

        const layoutConfigFinal = {
            ...layoutConfigDoFront,
            sectionImage: section_image,
            vitrineItems: vitrineItems,
            heroImage: foto_hero_url,
            sideImage: foto_perfil_url,
            heroType: dadosTexto.heroType || (layoutConfigDoFront as any).heroType || 'image',
            propaganda: {
                ativo: dadosTexto.adAtivo === 'true',
                texto: dadosTexto.adTexto || '',
            }
        };

        const dadosParaSalvar = {
            ...dadosTexto,
            nome_profissional: dadosTexto.nome_profissional,
            foto_perfil_url,
            foto_hero_url,
            layoutConfig: layoutConfigFinal,
            // !! IMPORTANTE: Repassa o arquivo bruto para o Service conseguir ler a imagem !!
            ia_reference: iaFile
        };

        if (!usuarioId) return res.status(400).json('UsuarioId é obrigatório');

        // Agora o Service receberá dadosParaSalvar.ia_reference
        const perfil = await PerfilPrestadorService.savePerfil(usuarioId, dadosParaSalvar);
        return res.json(perfil);

    } catch (error: any) {
        console.error("❌ Erro no Controller:", error);
        return res.status(500).json({ error: error.message });
    }
};
export const getVitrinePublica = async (req: Request, res: Response) => {
    try {
        // Se o log mostra { categoria: 'pedreiro' }, pegue apenas o valor
        const { categoria } = req.query as any;

        // Garanta que está passando a STRING para o service
        const prestadores = await PerfilPrestadorService.listVitrine(categoria);

        return res.json(prestadores);
    } catch (error) {
        console.error("ERRO NO CONTROLLER:", error);
        return res.status(500).json({ message: "Erro ao carregar vitrine" });
    }
};

export async function updateHtmlDraft(req: Request, res: Response) {
    try {
        const usuarioId = req.user?.id; // se usa auth middleware
        const { html } = req.body;

        console.log('htmllllllllllllll ',html)

        if (!html) {
            return res.status(400).json({ error: "HTML não enviado." });
        }

        if(!usuarioId) return res.status(400).json('Id do usuario é obrigatorio')

        const result = await PerfilPrestadorService.updateHtmlDraft(
            usuarioId,
            html
        );

        return res.json(result);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export const getPerfilPublico = async (req: Request, res: Response) => {
    try {
        const { usuarioId } = req.params;

        if (!usuarioId) {
            return res.status(400).json({ error: "ID não fornecido" });
        }

        const arquivos = req.files as Express.Multer.File[];

        const perfil = await PerfilPrestadorService.getPublicProfile(usuarioId);

        return res.json(perfil);
    } catch (error: any) {
        return res.status(404).json({ error: error.message });
    }
};

export const aprovar = async (req: Request, res: Response) => {
    try {
        // 1. Verifique se o nome aqui é exatamente o que está na sua rota (:usuarioId)
        const { idPerfil } = req.params;

        if (!idPerfil || idPerfil === ":usuarioId") {
            return res.status(400).json({ error: "ID do usuário é obrigatório e deve ser válido" });
        }


        const perfil = await PerfilPrestadorService.updateStatus(idPerfil, 'APROVADO');

        return res.json({
            message: "Prestador aprovado com sucesso!",
            perfil
        });

    } catch (error: any) {
        // Se o service der erro (ex: perfil não encontrado), cairá aqui
        console.error("Erro ao aprovar:", error.message);
        return res.status(500).json({
            error: error.message || "Erro interno ao aprovar perfil"
        });
    }
};


