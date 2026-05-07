// src/services/PageService.ts
import { AppDataSource } from "../config/data-source"; // Importamos o DataSource direto
import { Page, PageData } from "../models/PageModels"; // Ajuste o caminho se estiver em entities/Page

export class PageService {
    // Inicializamos o repositório diretamente aqui para facilitar
    private pageRepository = AppDataSource.getRepository(Page);

    async findAllPages(): Promise<Page[]> {
        return await this.pageRepository.find({
            // REMOVIDO: relations: ['pastoral'] (Não existe mais)
            order: {
                title: 'ASC' 
            }
        });
    }

    async findPageBySlug(slug: string): Promise<Page | null> {
        return await this.pageRepository.findOne({ 
            where: { slug }
            // REMOVIDO: relations: ['pastoral']
        });
    }

    async savePage(data: PageData): Promise<Page> {
        let page = await this.pageRepository.findOneBy({ slug: data.slug });

        // Validação: Garante que slug e title existam. 
        // Layout pode ser opcional se for uma página só de texto, mas mantive a validação se preferir.
        if (!data.slug || !data.title) {
            throw new Error("Dados incompletos: Slug e Título são obrigatórios.");
        }

        if (page) {
            // --- ATUALIZAR ---
            page.title = data.title;
            page.layout = data.layout || []; // Garante array vazio se vier null
            
            // NOVOS CAMPOS:
            page.category = data.category || "Geral"; 
            page.content = data.content || ""; // Salva o texto puro também
            
            // REMOVIDO: Lógica de pastoralId
            
            page.updatedAt = new Date(); 

        } else {
            // --- CRIAR NOVO ---
            page = this.pageRepository.create({
                slug: data.slug,
                title: data.title,
                layout: data.layout || [],
                
                // NOVOS CAMPOS:
                category: data.category || "Geral",
                content: data.content || ""
                
                // REMOVIDO: pastoralId
            });
        }

        return await this.pageRepository.save(page);
    }
}