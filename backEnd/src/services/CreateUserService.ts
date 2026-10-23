import { AppDataSource } from "../config/data-source";
import { Usuario } from "../models/UserModels";
import { UsuarioAuth } from "../models/UsuarioAuthModels"; // Certifique-se de importar este
import { Condominio } from "../models/condominiosModels";
import { hash } from "bcryptjs";

// Interface compatível com o seu JSON
interface IRequest {
  nome: string;
  email: string;
  password: string;
  // ✅ ADICIONE "| 'ADMIN'" AQUI:
  tipo: 'MORADOR'|'PRESTADOR'|'ADMIN'|'EMPREENDEDOR'|'PORTARIA'|'VISITANTE'; 
  condominio_id?: string;
  bloco?: string;
  unidade?: string;
  codigo_acesso?: string;
  tipo_servico_id?: string;
  is_empreendedor?: boolean;
  origem?: 'INTERNO' | 'EXTERNO';
}

export class CreateUserService {
  public async execute({
    nome,
    email,
    password,
    tipo,
    condominio_id,
    bloco,
    unidade,
    codigo_acesso,
    tipo_servico_id,
    is_empreendedor,
    origem
  }: IRequest) {

    if (tipo === 'MORADOR') {
      if (!condominio_id) throw new Error("Condomínio é obrigatório para moradores.");
      
      const condominioRepo = AppDataSource.getRepository(Condominio);
      const condominio = await condominioRepo.findOne({ where: { id: condominio_id } });
      
      if (!condominio) throw new Error("Condomínio não encontrado.");
      if (codigo_acesso && condominio.codigo_acesso !== codigo_acesso) {
        throw new Error("Código de acesso do condomínio inválido.");
      }
    }

    const hashedPassword = await hash(password, 8);

    return await AppDataSource.transaction(async (manager) => {      
      const emailExists = await manager.findOne(UsuarioAuth, { where: { email } });
      if (emailExists) {
        throw new Error("Este e-mail já está cadastrado.");
      }

      const user = new Usuario();
      user.name = nome;
      user.email = email;
      user.tipo = tipo;
      user.is_empreendedor = is_empreendedor || false;
    
      const savedUser = await manager.save(user);
      const auth = new UsuarioAuth();
      auth.email = email;
      auth.usuario = Promise.resolve(savedUser) as any;
      auth.role = tipo === 'ADMIN' ? 'ADMIN' : 'USER';
      
      await manager.save(auth);

      return savedUser;
    });
  }
}