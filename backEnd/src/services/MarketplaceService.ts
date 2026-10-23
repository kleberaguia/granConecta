import { AppDataSource } from "../config/data-source";
import { MarketPlaceModel } from "../models/MarketPlaceModel";

export type LocalExibicaoBanner =
  | "MARKETPLACE"
  | "SERVICOS";

class MarketplaceService {
  private bannerRepository =
    AppDataSource.getRepository(
      MarketPlaceModel,
    );

  async getMyBanners(
    lojaId: string,
  ): Promise<MarketPlaceModel[]> {
    return this.bannerRepository.find({
      where: {
        loja_id: lojaId,
      },
      order: {
        data_inicio: "DESC",
      },
    });
  }

  async getActiveBanners(
  condominioId: string | null,
  localInformado: string = "MARKETPLACE",
): Promise<MarketPlaceModel[]> {
  const local =
    String(localInformado)
      .trim()
      .toUpperCase() === "SERVICOS"
      ? "SERVICOS"
      : "MARKETPLACE";

  const query =
    this.bannerRepository
      .createQueryBuilder(
        "banner",
      )
      .where(
        "banner.status = :status",
        {
          status: "aprovado",
        },
      )
      .andWhere(
        "banner.pago = :pago",
        {
          pago: true,
        },
      )
      .andWhere(
        "banner.ativo = :ativo",
        {
          ativo: true,
        },
      )
      .andWhere(
        "banner.data_inicio <= NOW()",
      )
      .andWhere(
        "banner.data_fim >= NOW()",
      )
      .andWhere(
        `(
          banner.local_exibicao = :local
          OR banner.local_exibicao = :ambos
        )`,
        {
          local,
          ambos: "AMBOS",
        },
      );

  if (condominioId) {
    query.andWhere(
      `(
        banner.condominio_id = :condominioId
        OR banner.condominio_id IS NULL
      )`,
      {
        condominioId,
      },
    );
  } else {
    query.andWhere(
      "banner.condominio_id IS NULL",
    );
  }

  return query
    .orderBy(
      "banner.id",
      "DESC",
    )
    .getMany();
}

  async createBanner(
    data: Partial<MarketPlaceModel>,
  ): Promise<MarketPlaceModel> {
    try {
      const novoBanner =
        this.bannerRepository.create(
          {
            ...data,
            loja_id:
              data.loja_id ||
              null,
            condominio_id:
              data.condominio_id ||
              null,
            status:
              "pendente",
            pago: false,
            ativo: true,
          },
        );

      return this.bannerRepository.save(
        novoBanner,
      );
    } catch (error) {
      console.error(
        "[MarketplaceService] Erro ao criar banner:",
        error,
      );

      throw error;
    }
  }

  async updateBannerStatus(
    id: number,
    status: string,
    pago: boolean,
  ): Promise<void> {
    await this.bannerRepository.update(
      {
        id,
      },
      {
        status,
        pago,
      },
    );
  }
}

export default new MarketplaceService();