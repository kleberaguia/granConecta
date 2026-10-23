// src/services/EncomendaService.ts
import { AppDataSource } from '../config/data-source';
import { Encomenda } from '../models/EncomendaModels'; // Certifique-se de que o caminho está correto

export class EncomendaService {
  private repo = AppDataSource.getRepository(Encomenda);

  // Busca encomendas com resumo e detalhes (Morador)
  async listByMorador(userId: string, condominio_id: string) {
    // Usamos findAndCount para pegar a lista e o total de uma só vez
    const [encomendas, total] = await this.repo.findAndCount({
      where: {
        morador_id: userId,
        condominio_id: condominio_id,
        status: 'PENDENTE' // Busca apenas o que ainda não foi retirado
      },
      // Adicionamos 'condominio' e 'porteiro' para o frontend mostrar nomes em vez de IDs
      relations: ['porteiro', 'condominio'], 
      order: { dataRecebimento: 'DESC' }
    });

    return {
      resumo: {
        totalPendentes: total,
        mensagem: total > 0 
          ? `Você tem ${total} encomenda(s) aguardando retirada.` 
          : "Nenhuma encomenda pendente no momento."
      },
      encomendas
    };
  }

  // Registro de entrada (Uso exclusivo da Portaria)
  async create(data: Partial<Encomenda>) {
    // Garante que o status inicial seja sempre PENDENTE
    const novaEncomenda = this.repo.create({
      ...data,
      status: 'PENDENTE'
    });
    
    return await this.repo.save(novaEncomenda);
  }

  // Registro de saída (Dá baixa no sistema e evita extravio)
  async registrarRetirada(id: string, quemRetirou: string) {
    const encomenda = await this.repo.findOne({ 
        where: { id },
        relations: ['morador'] // Opcional: para saber quem era o dono original no log
    });
    
    if (!encomenda) throw new Error("Encomenda não encontrada.");
    
    if (encomenda.status === 'RETIRADO') {
        throw new Error("Esta encomenda já foi entregue anteriormente.");
    }

    encomenda.status = 'RETIRADO';
    encomenda.dataRetirada = new Date();
    encomenda.quemRetirou = quemRetirou;

    return await this.repo.save(encomenda);
  }
}