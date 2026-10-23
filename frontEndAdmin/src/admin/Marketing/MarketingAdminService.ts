import api from "../../api/api";

import type {
  ApiMarketingResponse,
  CapturarLeadInput,
  CriarBannerInstitucionalInput,
  ConfigurarCanalInput,
  CriarCampanhaInput,
  ListaCampanhasResponse,
  ListaCampanhasNormalizada,
  MarketingCampanha,
  MarketingCampanhaStatus,
  MarketingCampanhaDestinoTipo,
  MarketingCampanhaCanal,
  MarketingCanal,
  MarketingLead,
  MarketingBanner,
  TestarEnvioInput,
  ResultadoCanal,
} from "./MarketingAdminTypes";

const BASE = "/admin/marketing";

export const MarketingAdminService = {
  async listarCampanhas(params?: {
    status?: MarketingCampanhaStatus | "";
    lojaId?: string;
    prestadorId?: string;
    tipoDestino?: MarketingCampanhaDestinoTipo | "";
    categoriaId?: number | string;
    pagina?: number;
    limite?: number;
  }) {
    const response = await api.get<ListaCampanhasResponse>(
      `${BASE}/campanhas`,
      { params },
    );
    return {
      ...response.data,
      campanhas: response.data.dados || [],
    } satisfies ListaCampanhasNormalizada;
  },

  async buscarCampanha(id: number) {
    const response = await api.get<
      ApiMarketingResponse<never> & { campanha: MarketingCampanha }
    >(`${BASE}/campanhas/${id}`);
    return response.data.campanha;
  },

  async criarCampanha(input: CriarCampanhaInput) {
    const response = await api.post<
      ApiMarketingResponse<never> & { campanha: MarketingCampanha }
    >(`${BASE}/campanhas`, input);
    return response.data.campanha;
  },

  async atualizarCampanha(id: number, input: Partial<CriarCampanhaInput>) {
    const response = await api.put<
      ApiMarketingResponse<never> & { campanha: MarketingCampanha }
    >(`${BASE}/campanhas/${id}`, input);
    return response.data.campanha;
  },

  async criarBannerInstitucional(input: CriarBannerInstitucionalInput) {
    const response = await api.post<{
      sucesso: boolean;
      banner: MarketingBanner;
    }>(`${BASE}/banners`, input);
    return response.data.banner;
  },

  async configurarCanais(id: number, canais: ConfigurarCanalInput[]) {
    const response = await api.put<{
      sucesso: boolean;
      total: number;
      canais: MarketingCampanhaCanal[];
    }>(`${BASE}/campanhas/${id}/canais`, { canais });
    return response.data.canais;
  },

  async listarCanais(id: number) {
    const response = await api.get<{
      sucesso: boolean;
      total: number;
      canais: MarketingCampanhaCanal[];
    }>(`${BASE}/campanhas/${id}/canais`);
    return response.data.canais || [];
  },

  async executarCanal(id: number, canal: MarketingCanal) {
    const response = await api.post<
      ApiMarketingResponse<ResultadoCanal>
    >(`${BASE}/campanhas/${id}/canais/${canal}/executar`, {});
    return response.data.resultado;
  },

  async cancelarCanal(id: number, canal: MarketingCanal) {
    const response = await api.post<{
      sucesso: boolean;
      canal: MarketingCampanhaCanal;
    }>(`${BASE}/campanhas/${id}/canais/${canal}/cancelar`, {});
    return response.data.canal;
  },

  async acaoCampanha(
    id: number,
    acao:
      | "contratar"
      | "confirmar-pagamento"
      | "aprovar"
      | "cancelar"
      | "gerar-fila"
      | "recalcular",
  ) {
    const response = await api.post<ApiMarketingResponse<unknown>>(
      `${BASE}/campanhas/${id}/${acao}`,
    );
    return response.data;
  },

  async agendarCampanha(id: number, dataAgendamento: string) {
    const response = await api.post<ApiMarketingResponse<unknown>>(
      `${BASE}/campanhas/${id}/agendar`,
      { dataAgendamento },
    );
    return response.data;
  },

  async listarLeads(condominioId: string) {
    const response = await api.get<{
      sucesso: boolean;
      total: number;
      leads: MarketingLead[];
    }>(`${BASE}/leads`, {
      params: { condominioId },
    });
    return response.data;
  },

  async capturarLead(input: CapturarLeadInput) {
    const response = await api.post<ApiMarketingResponse<unknown>>(
      `${BASE}/leads`,
      input,
    );
    return response.data;
  },

  async processarFila(input: {
    campanhaId?: number;
    limite?: number;
    maxTentativas?: number;
  }) {
    const response = await api.post<ApiMarketingResponse<unknown>>(
      `${BASE}/processar-fila`,
      input,
    );
    return response.data;
  },

  async executarCiclo() {
    const response = await api.post<ApiMarketingResponse<unknown>>(
      `${BASE}/executar-ciclo`,
    );
    return response.data;
  },

  async testarEnvio(input: TestarEnvioInput) {
    const response = await api.post<ApiMarketingResponse<unknown>>(
      `${BASE}/testar-envio`,
      input,
    );
    return response.data;
  },
};

export default MarketingAdminService;