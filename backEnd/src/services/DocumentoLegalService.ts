import { AppDataSource } from "../config/data-source";
import { DocumentoLegal } from "../models/DocumentoLegalModel";
import { AceiteDocumento } from "../models/AceiteDocumentoModel";

export class DocumentoLegalService {
  private documentoRepo = AppDataSource.getRepository(DocumentoLegal);
  private aceiteRepo = AppDataSource.getRepository(AceiteDocumento);

  async listarAtivos() {
    return this.documentoRepo.find({
      where: { ativo: true },
      order: { createdAt: "DESC" },
    });
  }

  async buscarPorId(id: string) {
    const doc = await this.documentoRepo.findOne({ where: { id } });

    if (!doc) {
      throw new Error("Documento não encontrado.");
    }

    return doc;
  }

  async registrarAceites(params: {
    email: string;
    usuarioId?: string;
    tipo_usuario: string;
    documentosIds: string[];
    ip?: string;
    userAgent?: string;
  }) {
    const tipoUsuario = String(params.tipo_usuario || "").toUpperCase();

    const documentos = await this.documentoRepo.findByIds(params.documentosIds);

    if (!documentos.length) {
      throw new Error("Nenhum documento válido informado.");
    }

    const obrigatorios = await this.documentoRepo
      .createQueryBuilder("doc")
      .where("doc.ativo = :ativo", { ativo: true })
      .andWhere("doc.obrigatorio = :obrigatorio", { obrigatorio: true })
      .andWhere(
        "(doc.tipo IS NULL OR doc.tipo = '' OR UPPER(doc.tipo) = :tipoUsuario OR UPPER(doc.tipo) = 'GERAL')",
        { tipoUsuario },
      )
      .getMany();

    const idsAceitos = new Set(params.documentosIds);

    const faltando = obrigatorios.filter((doc) => !idsAceitos.has(doc.id));

    if (faltando.length > 0) {
      throw new Error("É necessário aceitar todos os documentos obrigatórios.");
    }

    const aceites = documentos.map((doc) =>
      this.aceiteRepo.create({
        usuarioId: params.usuarioId,
        email: params.email,
        documentoId: doc.id,
        tipo_usuario: tipoUsuario,
        aceito: true,
        ip_aceite: params.ip,
        user_agent: params.userAgent,
        versao_documento: doc.versao,
        ip_address: params.ip,
        data_aceite: new Date(),
      }),
    );

    return this.aceiteRepo.save(aceites);
  }
}