import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { PerfilPrestador } from '../models/PerfilPrestadorModel'; // ✅ Importamos o Perfil
import { Like } from 'typeorm';
import { UserStatus } from '../models/enums';

export class VitrineController {
  
  async getPrestadoresPorCategoria(req: Request, res: Response) {   
    const { slug } = req.params; 

    if (!slug) {
      return res.status(400).json({ message: "Categoria não informada" });
    }

    try {
      // ✅ Mudamos para o repositório de PerfilPrestador
      const perfilRepo = AppDataSource.getRepository(PerfilPrestador);
      
      const perfis = await perfilRepo.find({
        where: {
          // O status e a disponibilidade agora moram aqui no Perfil
          status: UserStatus.APROVADO, 
          disponivel: true,
          
          // Busca o slug dentro da coluna de serviços oferecidos do perfil
          servicos_oferecidos: Like(`%${slug}%`), 
        },
        // ✅ Trazemos os dados básicos do Usuario (nome) através da relação
        relations: ['usuario'], 
        
        order: {
            // Ajuste estas colunas conforme elas existirem no seu Model de Perfil
            is_destaque_hero: 'DESC', 
            // plano: 'DESC' // Se 'plano' estiver em Usuario, use { usuario: { plano: 'DESC' } }
        }
      });

      // ✅ Formatamos a resposta para que o Frontend receba um objeto limpo
      const resultado = perfis.map(p => ({
        id: p.usuarioId, // Padronizado conforme seu pedido
        name: p.usuario?.name,
        foto_perfil_url: p.foto_perfil_url,
        foto_hero_url: p.foto_hero_url,
        descricao_bio: p.descricao_bio,
        servicos_oferecidos: p.servicos_oferecidos,
        is_destaque_hero: p.is_destaque_hero,
        whatsapp_comercial: p.whatsapp_comercial,
        portfolio_imagens: p.portfolio_imagens,
        condominio_id: p.usuario?.condominio_id
      }));

      return res.json(resultado);

    } catch (error) {
      console.error("Erro na Vitrine:", error);
      return res.status(500).json({ message: "Erro ao buscar prestadores" });
    }
  }
}