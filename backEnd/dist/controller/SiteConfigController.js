"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteConfigController = void 0;
const SiteConfigService_1 = require("../services/SiteConfigService");
const data_source_1 = require("../config/data-source");
const PerfilPrestadorModel_1 = require("../models/PerfilPrestadorModel");
const service = new SiteConfigService_1.SiteConfigService();
class SiteConfigController {
    // ✅ Mantido: Salva as configurações feitas no Painel Admin
    async save(req, res) {
        try {
            const data = req.body;
            const saved = await service.saveHomeConfig(data);
            return res.status(200).json(saved);
        }
        catch (error) {
            console.error("Erro ao salvar Home Config:", error);
            return res.status(500).json({ message: "Erro interno ao salvar config" });
        }
    }
    // ✅ Mantido e Otimizado: Entrega os dados para a Home
    async get(req, res) {
        try {
            const jsonFinal = await service.getHomeConfig();
            if (!jsonFinal || !Array.isArray(jsonFinal)) {
                return res.status(200).json([]);
            }
            const perfilRepo = data_source_1.AppDataSource.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
            // Processamos as seções para buscar os prestadores reais do banco
            const sectionsDinamicas = await Promise.all(jsonFinal.map(async (section) => {
                // Se a seção for um carrossel e estiver ligada a um grupo (ex: gastronomia)
                if (section.tipo_secao === "services_carousel" && section.grupo) {
                    // Buscamos os prestadores que pertencem a esse grupo
                    const prestadoresDoBanco = await perfilRepo.find({
                        where: {
                            categoriaidoPrincipal: {
                                grupo: {
                                    slug: section.grupo
                                }
                            }
                        },
                        relations: ["categoriaidoPrincipal", "categoriaidoPrincipal.grupo"]
                    });
                    // ✅ IMPORTANTE: Enviamos os dados "crus" para o Front-end.
                    // O Front-end (unificarHome) vai usar o nome da categoria para 
                    // decidir qual imagem do dicionário exibir.
                    section.dadosInjetados = prestadoresDoBanco.map(p => ({
                        id: p.id,
                        nome: p.categoriaidoPrincipal?.name || p.nome_profissional,
                        mini_bio: p.mini_bio,
                        // Passamos a imagem do banco se existir, mas o Front pode sobrescrever
                        imagem_original: p.categoriaidoPrincipal
                    }));
                }
                return section;
            }));
            return res.status(200).json(sectionsDinamicas);
        }
        catch (error) {
            console.error("Erro ao processar Home Config:", error);
            return res.status(500).json({ message: "Erro interno ao buscar config" });
        }
    }
}
exports.SiteConfigController = SiteConfigController;
