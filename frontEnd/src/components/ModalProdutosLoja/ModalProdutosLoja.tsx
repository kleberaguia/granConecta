import { useEffect, useMemo, useState } from "react";
import {
    Modal,
    Box,
    Typography,
    Button,
    Stack,
    IconButton,
    Fade,
    Card,
    CardMedia,
    CardContent,
    Chip,
    CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import api, { API_URL } from "../../api/api";
import toast from "react-hot-toast";
import { ModalLojaInteresse } from "../ModalLojaInteresse/ModalLojaInteresse";

const style = {
    position: "absolute" as const,
    top: "6%",
    left: "50%",
    transform: "translateX(-50%)",
    width: { xs: "96%", md: 980 },
    bgcolor: "background.paper",
    borderRadius: 4,
    boxShadow: 24,
    overflow: "hidden",
    outline: "none",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
};

type Produto = {
    id: string | number;
    nome?: string;
    name?: string;
    titulo?: string;
    descricao?: string;
    description?: string;
    preco?: number | string;
    price?: number | string;
    imageUrl?: string;
    image_url?: string;
    imagem_url?: string;
    foto_url?: string;
    foto?: string;
    imagem?: string;
    image?: string;
    capa_url?: string;
    thumbnail_url?: string;
    categoria?: string;
    tags?: string[];
    condominioId?: string | number;
};

interface Props {
    open: boolean;
    onClose: () => void;
    lojaId?: string | number;
    storeId?: string | number;
    slug?: string;
    titulo?: string;
    modo?: "colecao" | "presentes" | "combos" | "ofertas";
    onAddToCart?: (produto: Produto) => void;
}

export const ModalProdutosLoja = ({
    open,
    onClose,
    lojaId,
    storeId,
    slug,
    titulo,
    modo = "colecao",
    onAddToCart,
}: Props) => {
    const [loading, setLoading] = useState(false);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [produtoInteresse, setProdutoInteresse] = useState<Produto | null>(null);

    const lojaResolvida = lojaId || storeId;

    useEffect(() => {
        if (!open || (!lojaResolvida && !slug)) return;

        const carregarProdutos = async () => {
            setLoading(true);

            try {
                const res = slug
                    ? await api.get(`/lojas/publica/slug/${slug}`)
                    : await api.get(`/produtos/lojas/publicos/${lojaResolvida}`);

                const lista = slug
                    ? res.data?.products || []
                    : Array.isArray(res.data)
                        ? res.data
                        : res.data?.produtos || res.data?.products || [];

                        console.log('listaaaaaaaaaaaaaaa ', lista)

                setProdutos(lista);
            } catch (err) {
                console.error("Erro ao carregar produtos:", err);
                toast.error("Erro ao carregar produtos da loja.");
            } finally {
                setLoading(false);
            }
        };

        carregarProdutos();
    }, [open, lojaResolvida, slug]);

    const produtosFiltrados = useMemo(() => {
        if (modo !== "presentes") return produtos;

        return produtos.filter((p) => {
            const texto = [
                p.nome,
                p.name,
                p.titulo,
                p.descricao,
                p.description,
                p.categoria,
                ...(p.tags || []),
            ]
                .join(" ")
                .toLowerCase();

            return (
                texto.includes("presente") ||
                texto.includes("terço") ||
                texto.includes("terco") ||
                texto.includes("religioso") ||
                texto.includes("sacra") ||
                texto.includes("semi")
            );
        });
    }, [produtos, modo]);

    const getNome = (p: Produto) => p.nome || p.name || p.titulo || "Produto";

    const getDescricao = (p: Produto) =>
        p.descricao || p.description || "Produto especial da loja.";

    const getPrecoNumero = (p: Produto) => {
        const valor = p.preco ?? p.price;

        if (typeof valor === "number") {
            return Number.isFinite(valor) ? valor : 0;
        }

        const raw = String(valor ?? "")
            .replace(/R\$/gi, "")
            .replace(/\s/g, "")
            .trim();

        if (!raw) return 0;

        const normalized = raw.includes(",")
            ? raw.replace(/\./g, "").replace(",", ".")
            : raw;

        const numero = Number(normalized);

        return Number.isFinite(numero) ? numero : 0;
    };

    const getPreco = (p: Produto) => {
        const numero = getPrecoNumero(p);

        if (!numero) return "Consultar";

        return numero.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    };

    const resolveImg = (p: Produto) => {
        const img =
            p.imageUrl ||
            p.image_url ||
            p.imagem_url ||
            p.foto_url ||
            p.foto ||
            p.imagem ||
            p.capa_url ||
            p.thumbnail_url ||
            p.image ||
            "";

        if (!img) return "https://via.placeholder.com/500x400?text=Produto";

        if (String(img).startsWith("http")) return String(img);

        const base = String(API_URL || "").replace(/\/$/, "");
        const clean = String(img).replace(/\\/g, "/");

        if (clean.startsWith("/")) return `${base}${clean}`;

        return `${base}/${clean}`;
    };

    const buildCartPayload = (produto: Produto) => {
        const productId = String(produto.id || "").trim();
        const nome = getNome(produto);
        const preco = getPrecoNumero(produto);
        const image = resolveImg(produto);

        return {
            ...produto,
            id: productId,
            productId,
            produtoId: productId,
            storeId: lojaResolvida,
            lojaId: lojaResolvida,
            name: nome,
            nome,
            title: nome,
            titulo: nome,
            price: preco,
            preco,
            image,
            image_url: image,
            imagem_url: image,
            quantidade: 1,
        };
    };

    const handleAddToCart = (produto: Produto) => {
        const payload = buildCartPayload(produto);

        if (!payload.productId) {
            toast.error("Produto sem ID. Não foi possível adicionar ao carrinho.");
            return;
        }

        if (onAddToCart) {
            onAddToCart(payload);
            toast.success("Produto adicionado ao carrinho.");
            return;
        }

        window.postMessage(
            {
                type: "ADD_TO_CART",
                payload,
            },
            "*",
        );

        window.postMessage(
            {
                type: "GC_ADD_TO_CART",
                payload,
            },
            "*",
        );

        toast.success("Produto adicionado ao carrinho.");
    };

    return (
        <>
            <Modal open={open} onClose={onClose} disableScrollLock>
                <Fade in={open}>
                    <Box sx={style}>
                        <Box
                            sx={{
                                p: 2.2,
                                bgcolor: "#7A4D42",
                                color: "white",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Box>
                                <Typography variant="h6" fontWeight={900}>
                                    {titulo ||
                                        (modo === "presentes"
                                            ? "Escolha um presente especial"
                                            : "Conheça nossas coleções")}
                                </Typography>

                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Selecione produtos, veja detalhes ou registre seu interesse.
                                </Typography>
                            </Box>

                            <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        <Box sx={{ p: 3, overflowY: "auto" }}>
                            {loading ? (
                                <Box sx={{ py: 8, textAlign: "center" }}>
                                    <CircularProgress />
                                </Box>
                            ) : produtosFiltrados.length === 0 ? (
                                <Box sx={{ py: 6, textAlign: "center" }}>
                                    <Typography fontWeight={800}>
                                        Nenhum produto encontrado.
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Cadastre produtos na loja para aparecerem aqui.
                                    </Typography>
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: "repeat(2, minmax(0, 1fr))",
                                            md: "repeat(3, minmax(0, 1fr))",
                                        },
                                        gap: 2.4,
                                    }}
                                >
                                    {produtosFiltrados.map((produto) => (
                                        <Card
                                            key={produto.id}
                                            sx={{
                                                borderRadius: 3,
                                                overflow: "hidden",
                                                border: "1px solid #ead8c8",
                                                boxShadow: "0 12px 28px rgba(122,77,66,0.10)",
                                            }}
                                        >
                                            <CardMedia
                                                component="img"
                                                height="210"
                                                image={resolveImg(produto)}
                                                alt={getNome(produto)}
                                                sx={{ objectFit: "cover" }}
                                            />

                                            <CardContent>
                                                <Stack spacing={1.2}>
                                                    <Chip
                                                        label={modo === "presentes" ? "Presente" : "Coleção"}
                                                        size="small"
                                                        sx={{
                                                            alignSelf: "flex-start",
                                                            bgcolor: "#FFF3EA",
                                                            color: "#7A4D42",
                                                            fontWeight: 800,
                                                        }}
                                                    />

                                                    <Typography
                                                        fontWeight={900}
                                                        sx={{
                                                            color: "#7A4D42",
                                                            fontFamily: "Marcellus, serif",
                                                            fontSize: 20,
                                                        }}
                                                    >
                                                        {getNome(produto)}
                                                    </Typography>

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            minHeight: 40,
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {getDescricao(produto)}
                                                    </Typography>

                                                    <Typography fontWeight={900} sx={{ color: "#7A4D42" }}>
                                                        {getPreco(produto)}
                                                    </Typography>

                                                    <Stack direction="row" spacing={1}>
                                                        <Button
                                                            fullWidth
                                                            variant="contained"
                                                            startIcon={<ShoppingCartIcon />}
                                                            onClick={() => handleAddToCart(produto)}
                                                            sx={{
                                                                bgcolor: "#B98B73",
                                                                borderRadius: 999,
                                                                fontWeight: 800,
                                                                "&:hover": { bgcolor: "#7A4D42" },
                                                            }}
                                                        >
                                                            Carrinho
                                                        </Button>

                                                        <Button
                                                            variant="outlined"
                                                            onClick={() => setProdutoInteresse(produto)}
                                                            sx={{
                                                                minWidth: 48,
                                                                borderRadius: 999,
                                                                borderColor: "#B98B73",
                                                                color: "#7A4D42",
                                                            }}
                                                        >
                                                            <FavoriteBorderIcon />
                                                        </Button>
                                                    </Stack>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Fade>
            </Modal>

            <ModalLojaInteresse
                open={Boolean(produtoInteresse)}
                onClose={() => setProdutoInteresse(null)}
                lojaId={lojaId}
                storeId={storeId}
                produto={produtoInteresse}
                origem="LANDING_PAGE"
            />
        </>
    );
};