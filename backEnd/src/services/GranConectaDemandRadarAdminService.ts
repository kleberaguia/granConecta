import { AppDataSource } from "../config/data-source";

/** Relatório agregado. Não retorna identificadores, contatos nem mensagens dos moradores. */
class GranConectaDemandRadarAdminService {
  async getOverview() {
    if (!AppDataSource.isInitialized) {
      throw new Error("Banco de dados não inicializado.");
    }

    // Os interesses são consolidados por perfil/categoria/região.
    // Não contar linhas como pesquisas: utilizar os contadores persistidos.
    const totals: Array<{
      pesquisas: string | number;
      sem_resultado: string | number;
      interessados: string | number;
      regioes: string | number;
    }> = await AppDataSource.query(`
      SELECT
        COALESCE(SUM(i.total_pesquisas), 0) AS pesquisas,
        COALESCE(SUM(i.total_sem_resultado), 0) AS sem_resultado,
        COUNT(DISTINCT CASE WHEN i.total_sem_resultado > 0 THEN i.profile_id END) AS interessados,
        COUNT(DISTINCT CASE WHEN i.chave_regiao <> 'NAO_INFORMADA' THEN i.chave_regiao END) AS regioes
      FROM demand_interests i
    `);

    const opportunities: Array<{
      categoria_id: number;
      categoria: string;
      bairro: string | null;
      cidade: string | null;
      uf: string | null;
      chave_regiao: string;
      pesquisas: string | number;
      sem_resultado: string | number;
      interessados: string | number;
    }> = await AppDataSource.query(`
      SELECT
        i.categoria_id,
        COALESCE(c.name, i.termo_normalizado) AS categoria,
        p.bairro,
        p.cidade,
        p.uf,
        i.chave_regiao,
        SUM(i.total_pesquisas) AS pesquisas,
        SUM(i.total_sem_resultado) AS sem_resultado,
        COUNT(DISTINCT CASE WHEN i.total_sem_resultado > 0 THEN i.profile_id END) AS interessados
      FROM demand_interests i
      LEFT JOIN categories c ON c.id = i.categoria_id
      LEFT JOIN demand_profiles p ON p.id = i.profile_id
      GROUP BY i.categoria_id, COALESCE(c.name, i.termo_normalizado),
               p.bairro, p.cidade, p.uf, i.chave_regiao
      ORDER BY sem_resultado DESC, interessados DESC, pesquisas DESC
      LIMIT 100
    `);

    const total = totals[0];
    return {
      resumo: {
        pesquisas: Number(total?.pesquisas ?? 0),
        semResultado: Number(total?.sem_resultado ?? 0),
        interessados: Number(total?.interessados ?? 0),
        regioes: Number(total?.regioes ?? 0),
      },
      oportunidades: opportunities.map((row) => ({
        categoriaId: Number(row.categoria_id),
        categoria: row.categoria,
        bairro: row.bairro,
        cidade: row.cidade,
        uf: row.uf,
        chaveRegiao: row.chave_regiao,
        pesquisas: Number(row.pesquisas),
        semResultado: Number(row.sem_resultado),
        interessados: Number(row.interessados),
      })),
    };
  }
}

export default new GranConectaDemandRadarAdminService();
