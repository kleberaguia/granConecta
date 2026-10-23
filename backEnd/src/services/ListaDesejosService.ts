import { AppDataSource } from "../config/data-source";
import { ListaDesejos } from "../models/ListaDesejosModels";

export class ListaDesejosService {
  private repo = AppDataSource.getRepository(ListaDesejos);

  async criar(data: any) {
    const desejo = this.repo.create({
      loja_id: data.lojaId || data.loja_id,
      produto_id: data.produtoId || data.produto_id || null,
      nome: data.nome,
      telefone: data.telefone,
      email: data.email || null,
      observacao: data.observacao || data.mensagem || null,
      aceita_marketing: data.aceitaMarketing ?? data.aceita_marketing ?? true,
      status: "NOVO",
    });

    return await this.repo.save(desejo);
  }

  async listarPorLoja(lojaId: string) {
    return await this.repo.find({
      where: { loja_id: lojaId } as any,
      order: { created_at: "DESC" } as any,
    });
  }
}