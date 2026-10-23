import { AppDataSource } from "../config/data-source";
import {
  StoreChatbotKnowledge,
  StoreChatbotKnowledgeTipo,
} from "../models/StoreChatbotKnowledgeModel";

type CreateKnowledgeInput = {
  store_id: string;
  titulo: string;
  tipo?: StoreChatbotKnowledgeTipo;
  conteudo: string;
};

type UpdateKnowledgeInput = Partial<CreateKnowledgeInput> & {
  ativo?: number;
};

class StoreChatbotKnowledgeService {
  private repository = AppDataSource.getRepository(StoreChatbotKnowledge);

  async listarPorLoja(storeId: string) {
    if (!storeId) {
      throw new Error("ID da loja é obrigatório.");
    }

    return this.repository.find({
      where: {
        store_id: storeId,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async listarAtivosPorLoja(storeId: string) {
    if (!storeId) return [];

    return this.repository.find({
      where: {
        store_id: storeId,
        ativo: 1,
      },
      order: {
        tipo: "ASC",
        createdAt: "DESC",
      },
    });
  }

  async criar(data: CreateKnowledgeInput) {
    if (!data.store_id) {
      throw new Error("ID da loja é obrigatório.");
    }

    if (!data.titulo?.trim()) {
      throw new Error("Título é obrigatório.");
    }

    if (!data.conteudo?.trim()) {
      throw new Error("Conteúdo é obrigatório.");
    }

    const item = this.repository.create({
      store_id: data.store_id,
      titulo: data.titulo.trim(),
      tipo: data.tipo || "GERAL",
      conteudo: data.conteudo.trim(),
      ativo: 1,
    });

    return this.repository.save(item);
  }

  async atualizar(id: string, data: UpdateKnowledgeInput) {
    if (!id) {
      throw new Error("ID do conteúdo é obrigatório.");
    }

    const item = await this.repository.findOne({
      where: { id },
    });

    if (!item) {
      throw new Error("Conteúdo não encontrado.");
    }

    if (data.titulo !== undefined) {
      item.titulo = data.titulo.trim();
    }

    if (data.tipo !== undefined) {
      item.tipo = data.tipo;
    }

    if (data.conteudo !== undefined) {
      item.conteudo = data.conteudo.trim();
    }

    if (data.ativo !== undefined) {
      item.ativo = Number(data.ativo) ? 1 : 0;
    }

    return this.repository.save(item);
  }

  async remover(id: string) {
    if (!id) {
      throw new Error("ID do conteúdo é obrigatório.");
    }

    const item = await this.repository.findOne({
      where: { id },
    });

    if (!item) {
      throw new Error("Conteúdo não encontrado.");
    }

    await this.repository.remove(item);

    return {
      success: true,
    };
  }
}

export default new StoreChatbotKnowledgeService();