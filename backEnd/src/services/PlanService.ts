import { AppDataSource } from "../config/data-source";
import { Plan } from "../models/PlanModel";

export class PlanService {
  private repo = AppDataSource.getRepository(Plan);

  async create(data: Partial<Plan>) {
    if (!data.id?.trim()) {
      throw new Error("O ID do plano é obrigatório");
    }

    if (!data.titulo?.trim()) {
      throw new Error("O título do plano é obrigatório");
    }

    const existingPlan = await this.repo.findOne({
      where: {
        id: data.id.trim().toUpperCase(),
      },
    });

    if (existingPlan) {
      throw new Error("Já existe um plano com esse ID");
    }

    const normalizedPrices = this.normalizePrices(
      data
    );

    if (
      !Array.isArray(data.vantagens) ||
      data.vantagens.length === 0
    ) {
      throw new Error(
        "Cadastre pelo menos uma vantagem para o plano"
      );
    }

    const vantagens = data.vantagens
      .map((vantagem) => String(vantagem).trim())
      .filter(Boolean);

    if (vantagens.length === 0) {
      throw new Error(
        "Cadastre pelo menos uma vantagem para o plano"
      );
    }

    const plan = this.repo.create({
      ...data,

      ...normalizedPrices,

      id: data.id.trim().toUpperCase(),

      titulo: data.titulo.trim(),

      vantagens,

      destaque: this.normalizeBoolean(
        data.destaque
      ),

      ativo:
        data.ativo === undefined
          ? true
          : this.normalizeBoolean(data.ativo),
    });

    return this.repo.save(plan);
  }

  /**
   * Utilizado na tela pública de contratação.
   * Retorna somente planos ativos.
   */
  async findAll() {
    return this.repo.find({
      where: {
        ativo: true,
      },

      order: {
        titulo: "ASC",
      },
    });
  }

  /**
   * Utilizado no painel administrativo.
   * Inclui planos ativos e inativos.
   */
  async findAllAdmin() {
    return this.repo.find({
      order: {
        titulo: "ASC",
      },
    });
  }

  async findById(id: string) {
    if (!id?.trim()) {
      throw new Error("O ID do plano é obrigatório");
    }

    return this.repo.findOne({
      where: {
        id: id.trim().toUpperCase(),
      },
    });
  }

  async update(
    id: string,
    data: Partial<Plan>
  ) {
    const normalizedId =
      id.trim().toUpperCase();

    const existingPlan =
      await this.findById(normalizedId);

    if (!existingPlan) {
      throw new Error("Plano não encontrado");
    }

    const normalizedPrices = this.normalizePrices(
      data,
      true
    );

    const sanitizedData: Partial<Plan> = {
      ...normalizedPrices,
    };

    if (data.titulo !== undefined) {
      if (!data.titulo.trim()) {
        throw new Error(
          "O título do plano é obrigatório"
        );
      }

      sanitizedData.titulo =
        data.titulo.trim();
    }

    if (data.vantagens !== undefined) {
      if (!Array.isArray(data.vantagens)) {
        throw new Error(
          "As vantagens do plano são inválidas"
        );
      }

      const vantagens =
        data.vantagens
          .map((vantagem) =>
            String(vantagem).trim()
          )
          .filter(Boolean);

      if (vantagens.length === 0) {
        throw new Error(
          "Cadastre pelo menos uma vantagem para o plano"
        );
      }

      sanitizedData.vantagens = vantagens;
    }

    if (data.ativo !== undefined) {
      sanitizedData.ativo =
        this.normalizeBoolean(data.ativo);
    }

    if (data.destaque !== undefined) {
      sanitizedData.destaque =
        this.normalizeBoolean(data.destaque);
    }

    const gatewayFields = [
      "stripe_product_id",
      "stripe_price_mensal_id",
      "stripe_price_trimestral_id",
      "stripe_price_anual_id",
      "mercado_pago_plan_mensal_id",
      "mercado_pago_plan_trimestral_id",
      "mercado_pago_plan_anual_id",
    ] as const;

    for (const field of gatewayFields) {
      if (data[field] !== undefined) {
        const value = data[field];

        sanitizedData[field] = value
          ? String(value).trim()
          : null;
      }
    }

    this.repo.merge(
      existingPlan,
      sanitizedData
    );

    return this.repo.save(existingPlan);
  }

  /**
   * Desativação lógica.
   * O registro não é removido do banco.
   */
  async delete(id: string) {
    const plan = await this.findById(id);

    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    plan.ativo = false;

    return this.repo.save(plan);
  }

  private validatePrices(
    data: Partial<Plan>,
    partial = false
  ) {
    const prices = [
      {
        field: "preco_mensal",
        label: "Preço mensal",
        value: data.preco_mensal,
      },
      {
        field: "preco_trimestral",
        label: "Preço trimestral",
        value: data.preco_trimestral,
      },
      {
        field: "preco_anual",
        label: "Preço anual",
        value: data.preco_anual,
      },
    ];

    for (const price of prices) {
      if (
        !partial &&
        (
          price.value === undefined ||
          price.value === null
        )
      ) {
        throw new Error(
          `${price.label} é obrigatório`
        );
      }

      if (
        price.value !== undefined &&
        price.value !== null
      ) {
        const numericValue = Number(
          String(price.value)
            .trim()
            .replace(",", ".")
        );

        if (
          !Number.isFinite(numericValue) ||
          numericValue <= 0
        ) {
          throw new Error(
            `${price.label} inválido`
          );
        }
      }
    }
  }

  private normalizePrices(
    data: Partial<Plan>,
    partial = false
  ): Partial<Plan> {
    this.validatePrices(data, partial);

    const result: Partial<Plan> = {};
    const fields = [
      "preco_mensal",
      "preco_trimestral",
      "preco_anual",
    ] as const;

    for (const field of fields) {
      const value = data[field];

      if (value !== undefined && value !== null) {
        result[field] = Number(
          String(value).trim().replace(",", ".")
        );
      }
    }

    return result;
  }

  private normalizeBoolean(value: unknown): boolean {
    if (typeof value === "string") {
      return ["true", "1", "sim"].includes(
        value.trim().toLowerCase()
      );
    }

    return value === true || value === 1;
  }
}