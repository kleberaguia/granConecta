import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Condominio } from '../models/condominiosModels';
import { Usuario } from '../models/UserModels';

interface IRequest {
  nome: string;
  endereco: string;
  codigo_acesso: string;
}

class CreateCondominioService {
  private condominioRepository = AppDataSource.getRepository(Condominio);

  // --- MÈTODO 1: CRIAR ÚNICO ---
  async execute(dados: IRequest) {
    const condominioRepo = AppDataSource.getRepository(Condominio);

    // Se você tentar fazer isso, o erro ts(2769) acontece:
    // const novoCondominio = condominioRepo.create(dados); 

    // O CORRETO: Mapeie os dados manualmente ou remova o que é relação
    const { endereco, ...restanteDosDados } = dados;

    const condominio = condominioRepo.create({
      ...restanteDosDados,
      // Se o endereco for uma string que veio do input, 
      // você não pode salvar na relação aqui. 
      // Você deve salvar o endereço em sua própria tabela primeiro.
    });

    return await condominioRepo.save(condominio);
  }

  // --- MÉTODO 2: CRIAR EM LOTE (BATCH) ---
  public async executeBatch(dados: IRequest[]): Promise<Condominio[]> {

    if (!dados || dados.length === 0) {
      throw new Error("A lista de condomínios está vazia.");
    }

    const nomes = dados.map(d => d.nome);
    const codigos = dados.map(d => d.codigo_acesso);

    const existentes = await this.condominioRepository.find({
      where: [
        { nome: In(nomes) },
        { codigo_acesso: In(codigos) }
      ]
    });

    if (existentes.length > 0) {
      const nomesExistentes = existentes.map(c => `${c.nome} (${c.codigo_acesso})`).join(', ');
      throw new Error(`Estes condomínios/códigos já existem: ${nomesExistentes}`);
    }

    // 🔥 CORREÇÃO AQUI: 
    // Removemos o 'endereco' (string) de cada item do array para o TypeORM não reclamar
    const dadosFormatados = dados.map(({ endereco, ...rest }) => ({
      ...rest
    }));

    // Agora o TypeScript aceita, pois 'rest' contém apenas campos conhecidos da entidade
    const novosCondominios = this.condominioRepository.create(dadosFormatados);

    await this.condominioRepository.save(novosCondominios);

    return novosCondominios;
  }

  async validarCodigoParaUsuario(codigo: string, usuarioId: string) {
    // 1. Busca o condomínio
    const condominio = await this.condominioRepository.findOne({
      where: { codigo_acesso: codigo, }
    });

    if (!condominio) {
      throw new Error("Código de condomínio inválido.");
    }

    // 2. Busca o usuário para garantir que ele existe e vincular/validar
    const usuario = await AppDataSource.getRepository(Usuario).findOne({
      where: { id: usuarioId } // Usando o padrão usuarioId/id da tabela usuarios
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    return {
      condominio_id: condominio.id,
      condominioNome: condominio.nome,
      usuarioId: usuario.id,
      valido: true
    };
  }
}

export default CreateCondominioService;