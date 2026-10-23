import { AppDataSource } from "../config/data-source";
import { Condominio } from "../models/condominiosModels";

class ListCondominioService {
  public async execute(): Promise<Condominio[]> {
    const condominioRepository = AppDataSource.getRepository(Condominio);

    const condominios = await condominioRepository.find({
      order: {
        nome: 'ASC',
      },
      relations: {
        endereco: true // Usa o objeto para habilitar a relação
      },
      select: {
        id: true,
        nome: true,
        // Aqui você seleciona os campos específicos da entidade Endereco que você postou
        endereco: {
          id: true,
          logradouro: true,
          cidade: true,
          bairro: true,
          uf: true,
          numero: true
        }
      }
    });
    return condominios;
  }
}

export default ListCondominioService;