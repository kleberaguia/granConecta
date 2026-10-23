import { useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { API_URL } from "../../utils/config";

export interface ProdutoDetalhes {
    id: string;
    nome?: string;
    name?: string;
    titulo?: string;
    title?: string;
    descricao?: string;
    description?: string;
    descricaoCompleta?: string;
    descricao_completa?: string;
    preco?: number | string | null;
    price?: number | string | null;
    precoPromocional?: number | string | null;
    preco_promocional?: number | string | null;
    imagem_url?: string | null;
    imageUrl?: string | null;
    imagem?: string | null;
    imagens?: Array<string | { url?: string; imagem_url?: string }> | null;
    categoria?: string | null;
    estoque?: number | null;
    ativo?: boolean;
    [key: string]: unknown;
}

type ModalDetalhesProdutoProps = {
    open: boolean;
    produto: ProdutoDetalhes | null;
    onClose: () => void;
    onAdicionarCarrinho?: (produto: ProdutoDetalhes, quantidade: number) => void;
    onComprarAgora?: (produto: ProdutoDetalhes, quantidade: number) => void;
    onFalarNoChat?: (produto: ProdutoDetalhes) => void;
};

const normalizeMoney = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;

    const raw = String(value).trim();
    if (!raw) return null;

    const normalized =
        raw.includes(",") && raw.includes(".")
            ? raw.replace(/\./g, "").replace(",", ".")
            : raw.replace(",", ".");

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
};

const formatBRL = (value: unknown) => {
    const number = normalizeMoney(value);
    if (number === null) return null;

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(number);
};

const getImageUrl = (produto: ProdutoDetalhes | null): string => {
    if (!produto) return "";

    const direct =
        produto.imagem_url ||
        produto.imageUrl ||
        produto.imagem ||
        "";

    if (direct) return String(direct);

    const first = Array.isArray(produto.imagens) ? produto.imagens[0] : null;

    if (typeof first === "string") return first;

    if (first && typeof first === "object") {
        return String(first.url || first.imagem_url || "");
    }

    return "";
};

export default function ModalDetalhesProduto({
    open,
    produto,
    onClose,
    onAdicionarCarrinho,
    onComprarAgora,
    onFalarNoChat,
}: ModalDetalhesProdutoProps) {
    const [quantidade, setQuantidade] = useState(1);


    const normalizeUrl = (url?: string) => {
        if (!url) return "";

        const raw = String(url).trim();

        if (
            raw.startsWith("http://") ||
            raw.startsWith("https://") ||
            raw.startsWith("data:")
        ) {
            return raw;
        }

        let clean = raw.replace(/\\/g, "/");

        let base = (API_URL || "http://localhost:3000").replace(/\/$/, "");

        if (base.endsWith("/api")) {
            base = base.slice(0, -4);
        }

        const uploadIndex = clean.toLowerCase().indexOf("/uploads/");

        if (uploadIndex !== -1) {
            clean = clean.substring(uploadIndex);
            return `${base}${clean.startsWith("/") ? clean : `/${clean}`}`;
        }

        if (clean.startsWith("uploads/")) {
            return `${base}/${clean}`;
        }

        if (clean.startsWith("/")) {
            return `${base}${clean}`;
        }

        return `${base}/uploads/images/${clean}`;
    };

    const nome = useMemo(
        () =>
            String(
                produto?.nome ||
                produto?.name ||
                produto?.titulo ||
                produto?.title ||
                "Produto",
            ),
        [produto],
    );

    const descricao = useMemo(
        () =>
            String(
                produto?.descricaoCompleta ||
                produto?.descricao_completa ||
                produto?.descricao ||
                produto?.description ||
                "",
            ),
        [produto],
    );

    const imagem = useMemo(() => getImageUrl(produto), [produto]);

    const preco = produto?.preco ?? produto?.price ?? null;
    const precoPromocional =
        produto?.precoPromocional ?? produto?.preco_promocional ?? null;

    const precoFormatado = formatBRL(preco);
    const precoPromocionalFormatado = formatBRL(precoPromocional);

    const estoque =
        typeof produto?.estoque === "number" && produto.estoque >= 0
            ? produto.estoque
            : null;

    const aumentar = () => {
        setQuantidade((atual) => {
            if (estoque !== null) return Math.min(atual + 1, Math.max(estoque, 1));
            return atual + 1;
        });
    };

    const diminuir = () => {
        setQuantidade((atual) => Math.max(1, atual - 1));
    };

    const handleClose = () => {
        setQuantidade(1);
        onClose();
    };

    const indisponivel = estoque === 0 || produto?.ativo === false;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            scroll="paper"
            PaperProps={{
                sx: {
                    borderRadius: { xs: 0, sm: 3 },
                    m: { xs: 0, sm: 2 },
                    width: { xs: "100%", sm: "calc(100% - 32px)" },
                    maxHeight: { xs: "100dvh", sm: "calc(100dvh - 64px)" },
                },
            }}
        >
            <DialogTitle sx={{ pr: 7 }}>
                Detalhes do produto
                <IconButton
                    aria-label="Fechar detalhes do produto"
                    onClick={handleClose}
                    sx={{ position: "absolute", right: 12, top: 10 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                {!produto ? (
                    <Typography color="text.secondary">
                        Produto não encontrado.
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
                            gap: { xs: 2.5, md: 4 },
                            alignItems: "start",
                        }}
                    >
                        <Box
                            sx={{
                                width: "100%",
                                aspectRatio: "1 / 1",
                                borderRadius: 2.5,
                                overflow: "hidden",
                                bgcolor: "grey.100",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {imagem ? (
                                <Box
                                    component="img"
                                    src={normalizeUrl(imagem)}
                                    alt={nome}
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <Typography color="text.secondary">
                                    Produto sem imagem
                                </Typography>
                            )}
                        </Box>

                        <Stack spacing={2}>
                            <Box>
                                {produto.categoria ? (
                                    <Chip
                                        size="small"
                                        label={String(produto.categoria)}
                                        sx={{ mb: 1.5 }}
                                    />
                                ) : null}

                                <Typography
                                    component="h2"
                                    variant="h4"
                                    sx={{
                                        fontWeight: 700,
                                        lineHeight: 1.15,
                                        fontSize: { xs: "1.65rem", sm: "2rem" },
                                    }}
                                >
                                    {nome}
                                </Typography>
                            </Box>

                            <Box>
                                {precoPromocionalFormatado ? (
                                    <>
                                        {precoFormatado ? (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ textDecoration: "line-through" }}
                                            >
                                                {precoFormatado}
                                            </Typography>
                                        ) : null}

                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                            {precoPromocionalFormatado}
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        {precoFormatado || "Consulte o preço"}
                                    </Typography>
                                )}
                            </Box>

                            {descricao ? (
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{ whiteSpace: "pre-line", lineHeight: 1.7 }}
                                >
                                    {descricao}
                                </Typography>
                            ) : (
                                <Typography variant="body1" color="text.secondary">
                                    Mais informações sobre este produto estarão disponíveis em breve.
                                </Typography>
                            )}

                            {estoque !== null ? (
                                <Typography
                                    variant="body2"
                                    color={estoque > 0 ? "text.secondary" : "error.main"}
                                >
                                    {estoque > 0
                                        ? `${estoque} unidade${estoque === 1 ? "" : "s"} disponível${estoque === 1 ? "" : "is"}`
                                        : "Produto indisponível no momento"}
                                </Typography>
                            ) : null}

                            {!indisponivel && (onAdicionarCarrinho || onComprarAgora) ? (
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ pt: 0.5 }}
                                >
                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                        Quantidade
                                    </Typography>

                                    <IconButton
                                        size="small"
                                        onClick={diminuir}
                                        disabled={quantidade <= 1}
                                        aria-label="Diminuir quantidade"
                                    >
                                        <RemoveIcon fontSize="small" />
                                    </IconButton>

                                    <Typography
                                        sx={{
                                            minWidth: 32,
                                            textAlign: "center",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {quantidade}
                                    </Typography>

                                    <IconButton
                                        size="small"
                                        onClick={aumentar}
                                        disabled={estoque !== null && quantidade >= estoque}
                                        aria-label="Aumentar quantidade"
                                    >
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            ) : null}
                        </Stack>
                    </Box>
                )}
            </DialogContent>

            <Divider />

            <DialogActions
                sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    gap: 1,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                }}
            >
                {produto && onFalarNoChat ? (
                    <Button
                        variant="outlined"
                        startIcon={<ChatOutlinedIcon />}
                        onClick={() => onFalarNoChat(produto)}
                    >
                        Falar no chat
                    </Button>
                ) : null}

                {produto && onAdicionarCarrinho ? (
                    <Button
                        variant="outlined"
                        startIcon={<ShoppingCartOutlinedIcon />}
                        disabled={indisponivel}
                        onClick={() => onAdicionarCarrinho(produto, quantidade)}
                    >
                        Adicionar ao carrinho
                    </Button>
                ) : null}

                {produto && onComprarAgora ? (
                    <Button
                        variant="contained"
                        disabled={indisponivel}
                        onClick={() => onComprarAgora(produto, quantidade)}
                    >
                        Comprar agora
                    </Button>
                ) : null}
            </DialogActions>
        </Dialog>
    );
}
