import { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2, Trash2, ShoppingBag, Settings2 } from "lucide-react";
import api from "../../../../api/api";
import { API_URL } from "../../../../utils/config";
import toast from "react-hot-toast";

// --- COMPONENTES INTERNOS DE UI (EditorUI) ---
const InputField = ({ label, value, onChange, placeholder }: any) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
    />
  </div>
);

const ColorPicker = ({ label, value, onChange }: any) => (
  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
    <label className="text-[10px] font-bold text-gray-500 uppercase">{label}</label>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-8 h-8 rounded-md cursor-pointer border-none bg-transparent"
    />
  </div>
);

// --- COMPONENTE PRINCIPAL ---
interface VitrineEditorProps {
  aiData: any;
  handleInputChange: (field: string, value: any) => void;
  primaryColor: string;
  store_id: any;
  field?: string;
}

export const VitrineEditor = ({
  aiData,
  handleInputChange,
  primaryColor,
  store_id,
  field = "produtos"
}: VitrineEditorProps) => {
  const [meusProdutosDB, setMeusProdutosDB] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Determinação de chaves dinâmicas
  const labelConfig = useMemo(() => {
    return {
      titleKey: `${field}_titulo`,
      colorKey: `${field}_title_color`,
      bgKey: `${field}_bg_color`,
      layoutKey: `vitrine_layout`

    };
  }, [field]);

  // 2. Filtra produtos que já estão no rascunho
  const produtosSelecionados = useMemo(() => {
    const lista = Array.isArray(aiData?.[field]) ? aiData[field] : [];
    return lista.filter((p: any) => p && p.id);
  }, [aiData, field]);

  // 3. Helper de Seleção (Crucial para o Checkbox visual)
  const isProdutoSelecionado = useCallback((id: any) => {
    return produtosSelecionados.some((p: any) => String(p.id) === String(id));
  }, [produtosSelecionados]);

  // 4. Helper de Imagem (Resolve o caminho para o Iframe)
  const obterImagemProduto = useCallback((produto: any) => {
    const imgPath = produto.image_url || produto.imageUrl || produto.imagem || produto.image;

    console.log('imgPath ', imgPath)
    if (!imgPath) return null;
    if (imgPath.startsWith('http')) return imgPath;

    const baseUrl = API_URL.replace(/\/$/, '');



    return `${baseUrl}/${imgPath.replace(/^\//, '')}`;
  }, []);

  // 5. Carregar Estoque
  useEffect(() => {
    // LOG DE DEBUG: Verifique se o store_id existe quando o componente monta
    console.log("Tentando carregar produtos para store_id:", store_id);

    if (!store_id) {
      console.warn("Aviso: store_id está indefinido.");
      return;
    }

    const carregarProdutos = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("@App:token");

        const response = await api.get(`/produtos/lojas/meus-produtos/${store_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Resposta da API:", response.data);

        // Tratativa mais robusta para diferentes formatos de retorno
        let dados = [];
        if (Array.isArray(response.data)) {
          dados = response.data;
        } else if (response.data?.products) {
          dados = response.data.products;
        } else if (response.data?.data) { // Comum em certas APIs
          dados = response.data.data;
        }

        setMeusProdutosDB(dados);
      } catch (error) {
        console.error("Erro na requisição:", error);
        toast.error("Erro ao carregar estoque.");
      } finally {
        setLoading(false);
      }
    };
    carregarProdutos();
  }, [store_id]);
  // 6. Alternar Produto (Manda o objeto exato para o injectVitrine)
  const alternarProduto = (produto: any) => {
    const urlCompleta = obterImagemProduto(produto);

    if (isProdutoSelecionado(produto.id)) {
      const novaLista = produtosSelecionados.filter((item: any) => String(item.id) !== String(produto.id));
      handleInputChange(field, novaLista);
    } else {
      // ✅ ESTE OBJETO É O QUE O IFRAME CONSOME
      const novoProduto = {
        id: produto.id,
        name: produto.name || produto.nome,
        price: produto.price || produto.preco,
        old_price: produto.old_price || produto.preco_anterior || null,
        image_url: urlCompleta, // Campo usado no seu injectVitrine
        dynamicFields: { buttonText: "Adicionar" }
      };
      handleInputChange(field, [...produtosSelecionados, novoProduto]);
    }
  };

  return (
    <div className="space-y-4 p-1">
      {/* SEÇÃO 1: IDENTIDADE */}
      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Settings2 size={16} className="text-blue-600" />
          <span className="text-[11px] font-black uppercase text-gray-500 tracking-tighter">Configurações Visuais</span>
        </div>

        <InputField
          label="Título da Seção"
          value={aiData[labelConfig.titleKey] || ""}
          onChange={(v: string) => handleInputChange(labelConfig.titleKey, v)}
          placeholder="Ex: Nossos Lanches"
        />

        <div className="grid grid-cols-2 gap-2">
          <ColorPicker
            label="Cor Título"
            value={aiData[labelConfig.colorKey] || primaryColor}
            onChange={(v: string) => handleInputChange(labelConfig.colorKey, v)}
          />
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Layout</label>
            <select
              value={aiData[labelConfig.layoutKey] || "grid-modern"}
              onChange={(e) => handleInputChange(labelConfig.layoutKey, e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="grid-modern">Grade Clean (Mínimalista)</option>
              <option value="card-glass">Glassmorphism (Transparência)</option>
              <option value="bento-box">Bento Grid (Estilo Apple)</option>
              <option value="horizontal-luxury">Card Luxo (Horizontal)</option>
              <option value="masonry-creative">Masonry (Visual Criativo)</option>
            </select>
          </div>
        </div>

        <ColorPicker
          label="Fundo da Seção"
          value={aiData[labelConfig.bgKey] || "transparent"}
          onChange={(v: string) => handleInputChange(labelConfig.bgKey, v)}
        />
      </div>

      {/* SEÇÃO 2: CATÁLOGO DO BANCO */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escolher Produtos</span>
          {loading && <Loader2 size={14} className="animate-spin text-blue-500" />}
        </div>

        <div className="max-h-[250px] overflow-y-auto border border-gray-100 rounded-2xl p-1 bg-gray-50/50 space-y-1 custom-scrollbar">
          {meusProdutosDB.length === 0 && !loading && (
            <p className="text-[10px] text-center p-4 text-gray-400">Nenhum produto encontrado nesta loja.</p>
          )}

          {meusProdutosDB.map((produto: any) => {
            const selecionado = isProdutoSelecionado(produto.id);
            const img = obterImagemProduto(produto);

            console.log('imgggggggggggggggg ', img)

            return (
              <div
                key={produto.id}
                onClick={() => alternarProduto(produto)}
                className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${selecionado
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/20"
                  : "border-white bg-white hover:border-gray-200 shadow-sm"
                  }`}
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-50">
                  {img ? (
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300">S/ FOTO</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-800 truncate">{produto.name || produto.nome}</p>
                  <p className="text-[10px] text-blue-600 font-black">
                    {Number(produto.price || produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>

                {selecionado && (
                  <div className="bg-blue-600 p-1.5 rounded-full shadow-lg shadow-blue-200">
                    <ShoppingBag size={10} className="text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 3: LISTA DE EXIBIÇÃO (REMOVER) */}
      {produtosSelecionados.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase px-1">
            Ativos no Iframe ({produtosSelecionados.length})
          </span>
          <div className="grid grid-cols-1 gap-2">
            {produtosSelecionados.map((produto: any, idx: number) => (
              <div key={produto.id} className="flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <img src={produto.image_url} className="w-8 h-8 rounded-md object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-700 truncate">{produto.name}</p>
                    <p className="text-[9px] text-blue-600 font-black">
                      {Number(produto.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <button
                    onClick={() => alternarProduto(produto)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* CAMPO DE PREÇO ANTERIOR MANUAAL */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  <label className="text-[8px] font-black text-gray-400 uppercase italic">Preço s/ Desconto:</label>
                  <input
                    type="number"
                    placeholder="Ex: 100.00"
                    className="flex-1 bg-gray-50 border-none rounded p-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-blue-400"
                    value={produto.old_price || ""}
                    onChange={(e) => {
                      const novaLista = [...produtosSelecionados];
                      novaLista[idx].old_price = e.target.value;
                      handleInputChange(field, novaLista);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};