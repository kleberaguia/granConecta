import { AppDataSource } from "../../config/data-source";
import { Endereco } from "../../models/EnderecoModel";
import { Condominio } from "../../models/condominiosModels";

type NormalizacaoResultado = {
  alterado: boolean;
  endereco: Endereco;
  camposAlterados: string[];
};

class LegacyAddressNormalizerService {
  private enderecoRepository =
    AppDataSource.getRepository(Endereco);

  private condominioRepository =
    AppDataSource.getRepository(Condominio);

  /**
   * Separa somente formatos inequívocos:
   *
   * "Avenida X, 501"
   * "Rua X, 134"
   * "Rua X 90"
   *
   * Não tenta interpretar números no meio do nome da rua.
   */
  private separarLogradouroNumero(
    valor?: string | null
  ): {
    logradouro: string;
    numero: string;
  } | null {
    const texto = String(valor || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!texto) {
      return null;
    }

    // Preferência: número depois de vírgula.
    const comVirgula = texto.match(
      /^(.*?),\s*(\d+[A-Za-z]?)\s*$/
    );

    if (comVirgula) {
      const logradouro = comVirgula[1]?.trim();
      const numero = comVirgula[2]?.trim();

      if (logradouro && numero) {
        return {
          logradouro,
          numero,
        };
      }
    }

    // Legado sem vírgula:
    // "rua ilha da juventude 90"
    const semVirgula = texto.match(
      /^(.+?)\s+(\d+[A-Za-z]?)\s*$/
    );

    if (semVirgula) {
      const logradouro = semVirgula[1]?.trim();
      const numero = semVirgula[2]?.trim();

      if (logradouro && numero) {
        return {
          logradouro,
          numero,
        };
      }
    }

    return null;
  }

  private async enriquecerPeloCondominio(
    endereco: Endereco,
    camposAlterados: string[]
  ): Promise<void> {
    if (!endereco.condominio_id) {
      return;
    }

    const condominio =
      await this.condominioRepository.findOne({
        where: {
          id: endereco.condominio_id,
        },
      });

    if (!condominio) {
      return;
    }

    if (!endereco.cep && condominio.cep) {
      endereco.cep = String(condominio.cep)
        .replace(/\D/g, "")
        .slice(0, 8);

      camposAlterados.push("cep");
    }

    if (
      !endereco.bairro &&
      condominio.bairro
    ) {
      endereco.bairro = condominio.bairro;
      camposAlterados.push("bairro");
    }

    if (
      !endereco.cidade &&
      condominio.cidade
    ) {
      endereco.cidade = condominio.cidade;
      camposAlterados.push("cidade");
    }

    if (
      !endereco.uf &&
      condominio.uf
    ) {
      endereco.uf = String(condominio.uf)
        .trim()
        .toUpperCase();

      camposAlterados.push("uf");
    }
  }

  public async normalizarEndereco(
    enderecoId: number,
    salvar = true
  ): Promise<NormalizacaoResultado> {
    const endereco =
      await this.enderecoRepository.findOne({
        where: {
          id: enderecoId,
        },
      });

    if (!endereco) {
      throw new Error(
        "ENDERECO_NAO_ENCONTRADO"
      );
    }

    const camposAlterados: string[] = [];

    /*
     * Só separa o número quando o campo numero
     * ainda está vazio.
     */
    if (
      !String(endereco.numero || "").trim()
    ) {
      const separado =
        this.separarLogradouroNumero(
          endereco.logradouro
        );

      if (separado) {
        if (
          separado.logradouro !==
          endereco.logradouro
        ) {
          endereco.logradouro =
            separado.logradouro;

          camposAlterados.push(
            "logradouro"
          );
        }

        endereco.numero =
          separado.numero;

        camposAlterados.push("numero");
      }
    }

    /*
     * Somente condomínio explicitamente
     * vinculado pode fornecer cidade/UF/CEP.
     *
     * Não inferimos condomínio pela rua.
     */
    await this.enriquecerPeloCondominio(
      endereco,
      camposAlterados
    );

    const alterado =
      camposAlterados.length > 0;

    if (alterado && salvar) {
      await this.enderecoRepository.save(
        endereco
      );
    }

    return {
      alterado,
      endereco,
      camposAlterados,
    };
  }
}

export default new LegacyAddressNormalizerService();