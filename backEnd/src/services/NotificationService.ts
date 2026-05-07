import { AppDataSource } from "../config/data-source";
import { Notificacao } from "../models/NotificationModel";
import { Usuario } from "../models/UserModels";
import { EmailService } from "./EmailService";

const notificacaoRepo = AppDataSource.getRepository(Notificacao);
const usuarioRepo = AppDataSource.getRepository(Usuario);

export const NotificationService = {
  
  // ✅ Salva notificação no banco (Sineta do sistema)
  async enviar(usuarioId: string, titulo: string, mensagem: string) {
    // Tenta achar o usuário. Se não achar (transação bloqueando), ignora o salvamento no banco
    const usuario = await usuarioRepo.findOne({ where: { id: usuarioId }, relations: ["auth"] });
    
    if (!usuario) {
        console.warn(`[NotificationService] Usuário ${usuarioId} não encontrado. Notificação interna ignorada.`);
        return;
    }

    const notif = notificacaoRepo.create({
      usuario,
      usuarioId,
      titulo,
      mensagem,
      lido: false
    });

    return await notificacaoRepo.save(notif);
  },

  async listar(usuarioId: string) {
    return await notificacaoRepo.find({
      where: { usuarioId },
      order: { dataCriacao: "DESC" } 
    });
  },

  // ✅ Método Híbrido: Aceita ID ou Email direto
  async enviarEmail(destinatario: string, titulo: string, mensagem: string) {
    let emailParaEnviar = destinatario;
    let usuarioIdParaSalvar: string | null = null;

    // 1. Verifica se o "destinatario" é um ID ou um Email
    const ehEmail =  destinatario.includes("@");

    if (ehEmail) {
        // [CENÁRIO REGISTRO]: Recebemos o email direto.
        // Não buscamos no banco para evitar erro de transação.
        emailParaEnviar = destinatario;        
        // Obs: Não definimos usuarioIdParaSalvar, então não vai salvar no histórico interno
        // (Geralmente código de verificação não precisa ficar no histórico da plataforma)
    } else {
        // [CENÁRIO NORMAL]: Recebemos um ID. Buscamos no banco.
        const usuario = await usuarioRepo.findOne({ where: { id: destinatario } });

        if (!usuario?.email) {
          throw new Error("USUARIO_SEM_EMAIL");
        }
        
        emailParaEnviar = usuario?.email;
        usuarioIdParaSalvar = destinatario;
    }

    await EmailService.send(
      emailParaEnviar,
      titulo,
      mensagem
    );

    // 3. (Opcional) Se tivermos o ID confirmado, salvamos também no banco interno
    if (usuarioIdParaSalvar) {
        return await this.enviar(usuarioIdParaSalvar, titulo, mensagem);
    }
  },

};