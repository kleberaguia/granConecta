import { AppDataSource } from "../../config/data-source";
import { Store } from "../../models/StoreModels";

/**
 * Diagnóstico cadastral da vitrine do proprietário autenticado.
 * Este serviço NÃO autentica requisições e NÃO libera acesso administrativo.
 * O userId deve vir exclusivamente do JWT validado pelo controller.
 */
export type BusinessReadinessStatus =
  | "PRECISA_DE_AJUSTES"
  | "PRONTA_PARA_DIVULGACAO"
  | "DESTAQUE_CADASTRAL";

export type BusinessReadinessCheck = {
  key: string;
  label: string;
  complete: boolean;
  points: number;
  maxPoints: number;
};

export type OwnedBusinessContext = {
  storeId: string;
  name: string;
  isProvisionalName: boolean;
  slug: string;
  tipo: string;
  ativa: boolean;
  landingPath: string;
  hasDraft: boolean;
  hasPublishedPage: boolean;
  productCount: number;
  score: number;
  status: BusinessReadinessStatus;
  checks: BusinessReadinessCheck[];
  recommendations: string[];
};

export type BusinessOwnerContext = {
  authenticatedUserId: string;
  isBusinessOwner: boolean;
  businesses: OwnedBusinessContext[];
};

export class GranConectaBusinessOwnerContextService {
  private hasText(value: unknown): boolean {
    return typeof value === "string" && value.trim().length > 0;
  }

  private hasStructuredContent(value: unknown): boolean {
    if (value == null) return false;
    if (typeof value === "string") {
      const text = value.trim();
      if (!text) return false;
      try {
        return this.hasStructuredContent(JSON.parse(text));
      } catch {
        return true;
      }
    }
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return false;
  }

  async build(authenticatedUserId: string): Promise<BusinessOwnerContext> {
    const userId = String(authenticatedUserId || "").trim();
    if (!userId) {
      return { authenticatedUserId: "", isBusinessOwner: false, businesses: [] };
    }

    // A consulta sempre usa a identidade validada no backend, nunca o userId
    // informado livremente no corpo de uma requisição HTTP.
    const stores = await AppDataSource.getRepository(Store)
      .createQueryBuilder("store")
      .loadRelationCountAndMap("store.productCount", "store.products")
      .where("store.usuarioId = :userId", { userId })
      .orderBy("store.name", "ASC")
      .getMany();

    const businesses = stores.map((store): OwnedBusinessContext => {
      const normalizedName = String(store.name || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const isProvisionalName = ["minha loja", "minha empresa", "meu negocio"].includes(normalizedName);

      const productCount = Number(
        (store as Store & { productCount?: number }).productCount ?? 0,
      );
      const hasPublishedPage =
        this.hasText(store.pageHtmlPublished) ||
        this.hasStructuredContent(store.pageSpecPublished);
      const hasDraft =
        this.hasText(store.pageHtmlDraft) ||
        this.hasStructuredContent(store.pageSpecDraft);

      const rawChecks: Array<[string, string, boolean, number]> = [
        ["published", "Landing page publicada", hasPublishedPage, 25],
        ["cover", "Imagem de capa cadastrada", this.hasText(store.capa_url), 20],
        ["logo", "Logotipo cadastrado", this.hasText(store.logo_url), 10],
        ["description", "Descrição comercial cadastrada", this.hasText(store.descricao_loja), 15],
        ["whatsapp", "WhatsApp cadastrado", this.hasText(store.telefoneWhatsapp), 10],
        ["catalog", "Produtos cadastrados", productCount > 0, 20],
      ];

      const checks: BusinessReadinessCheck[] = rawChecks.map(
        ([key, label, complete, maxPoints]) => ({
          key,
          label,
          complete,
          points: complete ? maxPoints : 0,
          maxPoints,
        }),
      );
      const score = checks.reduce((sum, check) => sum + check.points, 0);

      // A existência de página publicada é requisito mínimo, mesmo quando
      // a pontuação cadastral for alta.
      const essentialsReady =
        hasPublishedPage &&
        this.hasText(store.capa_url) &&
        this.hasText(store.descricao_loja) &&
        this.hasText(store.telefoneWhatsapp) &&
        Boolean(store.ativa) &&
        !isProvisionalName;

      const status: BusinessReadinessStatus = !essentialsReady
        ? "PRECISA_DE_AJUSTES"
        : score === 100
          ? "DESTAQUE_CADASTRAL"
          : "PRONTA_PARA_DIVULGACAO";

      const recommendations = checks
        .filter((check) => !check.complete)
        .map((check) => `Completar: ${check.label.toLowerCase()}.`);
      if (isProvisionalName) {
        recommendations.unshift(
          "O nome do negócio ainda parece provisório. Perguntar ao proprietário qual nome comercial deseja utilizar; não alterar automaticamente.",
        );
      }
      if (!store.ativa) {
        recommendations.unshift(
          "Verificar por que o negócio está marcado como inativo antes de divulgá-lo.",
        );
      }
      if (hasPublishedPage) {
        recommendations.push(
          "Revisar visualmente a página e testar seus botões antes da campanha; a publicação não garante qualidade visual.",
        );
      } else if (hasDraft) {
        recommendations.unshift(
          "Existe um rascunho da página; revisar e publicar quando estiver pronto.",
        );
      } else {
        recommendations.unshift("Criar a landing page do negócio.");
      }

      return {
        storeId: store.id,
        name: store.name,
        isProvisionalName,
        slug: store.slug,
        tipo: store.tipo,
        ativa: Boolean(store.ativa),
        landingPath: `/pagina/${encodeURIComponent(store.slug)}`,
        hasDraft,
        hasPublishedPage,
        productCount,
        score,
        status,
        checks,
        recommendations,
      };
    });

    return {
      authenticatedUserId: userId,
      isBusinessOwner: businesses.length > 0,
      businesses,
    };
  }
}

export default GranConectaBusinessOwnerContextService;
