import { useEffect, useState } from "react";
import api from "../../../api/api";
import { API_URL } from "../../../utils/config";

type ProductForVitrine = {
  id: string | number;
  name?: string;
  description?: string;
  price?: number | string;
  image_url?: string;
  image?: string;
  foto_perfil?: string;
  stock?: number;
  displayName?: string;
  displayDescription?: string;
  displayPrice?: number | string;
};

type ProductSelectorEditorProps = {
  aiData: any;
  handleInputChange: (field: string, value: any) => void;
};

export function ProductSelectorEditor({
  aiData,
  handleInputChange,
}: ProductSelectorEditorProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedProducts: ProductForVitrine[] =
    aiData.selectedProducts || aiData.produtos || [];

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);

    try {
      const res = await api.get("/produtos/lojas/meus-produtos");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setProducts(list);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
    } finally {
      setLoading(false);
    }
  }

  function normalizeProduct(product: any): ProductForVitrine {
    return {
      id: product.id,
      name: product.name || product.nome || "Produto",
      description:
        product.description ||
        product.descricao ||
        product.short_description ||
        "",
      price: product.price ?? product.preco ?? product.valor ?? 0,
      image_url:
        product.imageUrl ||
        product.foto_perfil ||
        product.image ||
        product.imagem ||
        "",
      stock: product.stock ?? product.estoque ?? 0,

      displayName: product.displayName || product.name || product.nome || "Produto",
      displayDescription:
        product.displayDescription ||
        product.description ||
        product.descricao ||
        "",
      displayPrice:
        product.displayPrice ?? product.price ?? product.preco ?? product.valor ?? 0,
    };
  }

  function toggleProduct(product: any) {
    const normalized = normalizeProduct(product);

    const exists = selectedProducts.some(
      (item) => String(item.id) === String(normalized.id),
    );

    const next = exists
      ? selectedProducts.filter(
          (item) => String(item.id) !== String(normalized.id),
        )
      : [...selectedProducts, normalized];

    handleInputChange("selectedProducts", next);
    handleInputChange("produtos", next);
  }

  function updateSelectedProduct(
    productId: string | number,
    field: "displayName" | "displayDescription" | "displayPrice",
    value: string,
  ) {
    const next = selectedProducts.map((product) => {
      if (String(product.id) !== String(productId)) return product;

      return {
        ...product,
        [field]: value,
      };
    });

    handleInputChange("selectedProducts", next);
    handleInputChange("produtos", next);
  }

  function resolveImageUrl(product: ProductForVitrine) {
    const raw =
      product.image_url ||
      product.image ||
      product.foto_perfil ||
      "";

    if (!raw) return "";

    if (
      String(raw).startsWith("http://") ||
      String(raw).startsWith("https://") ||
      String(raw).startsWith("data:")
    ) {
      return String(raw);
    }

    return `${API_URL.replace(/\/$/, "")}${raw}`;
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-4 text-sm text-gray-500">
        Carregando produtos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
        Escolha os produtos que devem aparecer na vitrine. O ID original do
        produto será preservado para o carrinho.
      </div>

      <div className="space-y-3">
        {products.map((product) => {
          const normalized = normalizeProduct(product);

          const selected = selectedProducts.some(
            (item) => String(item.id) === String(normalized.id),
          );

          const imageUrl = resolveImageUrl(normalized);

          return (
            <button
              type="button"
              key={normalized.id}
              onClick={() => toggleProduct(product)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex gap-3">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={normalized.name}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-bold uppercase text-gray-400">
                    sem foto
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-gray-800">
                    {normalized.name}
                  </div>

                  <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {normalized.description || "Sem descrição"}
                  </div>

                  <div className="mt-1 text-sm font-black text-green-600">
                    {Number(normalized.price || 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedProducts.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-xs font-black uppercase text-gray-400">
            Personalizar vitrine
          </h4>

          {selectedProducts.map((product) => (
            <div
              key={product.id}
              className="space-y-2 rounded-xl border border-gray-200 bg-white p-3"
            >
              <div className="text-xs font-black text-gray-700">
                Produto ID: {product.id}
              </div>

              <input
                value={product.displayName || ""}
                onChange={(event) =>
                  updateSelectedProduct(
                    product.id,
                    "displayName",
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
                placeholder="Nome exibido"
              />

              <textarea
                value={product.displayDescription || ""}
                onChange={(event) =>
                  updateSelectedProduct(
                    product.id,
                    "displayDescription",
                    event.target.value,
                  )
                }
                className="min-h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
                placeholder="Descrição exibida"
              />

              <input
                value={String(product.displayPrice ?? "")}
                onChange={(event) =>
                  updateSelectedProduct(
                    product.id,
                    "displayPrice",
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
                placeholder="Preço exibido"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}