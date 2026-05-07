import { AppDataSource } from "../config/data-source";
import { SiteConfig } from "../models/SiteConfig";

export class SiteConfigService {
  private repo = AppDataSource.getRepository(SiteConfig);

  // ============================================================
  // ✅ SALVAR (MANTÉM O DESIGN FIXO)
  // ============================================================
  async saveHomeConfig(jsonStructure: any[]) {
    const KEY = "home_structure";

    try {
      let config = await this.repo.findOneBy({ key: KEY });

      if (config) {
        // Atualiza a estrutura de design (Hero, CTAs, ordens)
        config.data = jsonStructure;
      } else {
        // Cria a primeira vez
        config = this.repo.create({
          key: KEY,
          data: jsonStructure,
        });
      }

      const result = await this.repo.save(config);
      
      // Retornamos apenas o array de dados para o Controller
      return result.data;

    } catch (error) {
      console.error("Erro ao salvar config:", error);
      throw new Error("Falha ao salvar configuração do site.");
    }
  }

  // ============================================================
  // ✅ BUSCAR (PARA O CONTROLLER INJETAR OS DINÂMICOS)
  // ============================================================
  async getHomeConfig() {
    try {
      const config = await this.repo.findOneBy({ key: "home_structure" });

      // Se não existir nada no banco ainda, retorna um array vazio
      // para o Controller não quebrar ao tentar fazer o .map()
      if (!config) return [];

      // Retornamos o array que está na coluna 'data'
      // Se o seu model usa Transformer, o TypeORM já entrega como Objeto/Array
      return config.data;
      
    } catch (error) {
      console.error("Erro ao buscar config:", error);
      throw new Error("Falha ao buscar configuração.");
    }
  }
}