import { AppDataSource } from "../config/data-source";
import { ServicoIgnorado } from "../models/ServicoIgnoradoModels";

export class ServicoIgnoradoService {
    private repo = AppDataSource.getRepository(ServicoIgnorado);

    async ignorar(prestadorId: string, solicitacaoId: number) {
        // Verifica se já existe para não duplicar
        const existe = await this.repo.findOneBy({ prestadorId, solicitacaoId });
        
        if (existe) return existe;

        const novoIgnorado = this.repo.create({
            prestadorId,
            solicitacaoId
        });

        return await this.repo.save(novoIgnorado);
    }
}