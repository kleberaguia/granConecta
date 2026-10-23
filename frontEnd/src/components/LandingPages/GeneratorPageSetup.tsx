import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ImagePlus, Loader2, Rocket, Store, UploadCloud } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import generatorApi from "../../api/generatorApi";
import api from "../../api/api";

type GeneratorProjectType = "LANDING" | "ECOMMERCE" | "HYBRID";

type SetupState = {
    storeId?: string;
    id?: string;
    tipo?: string;
    pageKind?: "loja" | "servico";
    generatorProjectId?: string;
    store?: {
        id?: string;
        name?: string;
        nome?: string;
        slug?: string;
    };
    name?: string;
    nome?: string;
    slug?: string;
};

type GeneratedLayout = {
    id: string;
    projectId?: string;
    html?: string;
    css?: string;
    approved?: boolean;
};

function slugify(value: string): string {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function resolveLayout(data: any): GeneratedLayout | null {
    const candidate =
        data?.layout ||
        data?.generatedLayout ||
        data?.data?.layout ||
        data?.data?.generatedLayout ||
        data;

    if (!candidate?.id) return null;

    return {
        id: String(candidate.id),
        projectId: candidate.projectId ? String(candidate.projectId) : undefined,
        html: typeof candidate.html === "string" ? candidate.html : undefined,
        css: typeof candidate.css === "string" ? candidate.css : undefined,
        approved: candidate.approved === true,
    };
}

export default function GeneratorPageSetup() {
    const location = useLocation();
    const navigate = useNavigate();
    const initialState = (location.state || {}) as SetupState;

    const storeId = String(
        initialState.storeId ||
        initialState.id ||
        initialState.store?.id ||
        "",
    ).trim();

    const tipo = String(initialState.tipo || "").toUpperCase();

    const projectType: GeneratorProjectType = useMemo(() => {
        if (initialState.pageKind === "loja") return "ECOMMERCE";
        if (initialState.pageKind === "servico") return "LANDING";
        if (tipo === "EMPREENDEDOR") return "ECOMMERCE";
        return "LANDING";
    }, [initialState.pageKind, tipo]);

    const [businessName, setBusinessName] = useState(
        String(
            initialState.store?.name ||
            initialState.store?.nome ||
            initialState.name ||
            initialState.nome ||
            "",
        ),
    );

    const [slug, setSlug] = useState(
        String(initialState.store?.slug || initialState.slug || ""),
    );

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState("");
    const [coverUrl, setCoverUrl] = useState("");

    const [projectId, setProjectId] = useState(
        String(initialState.generatorProjectId || ""),
    );
    const [layoutId, setLayoutId] = useState("");

    const [generating, setGenerating] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const generatorBaseUrl = String(
        import.meta.env.VITE_GENERATOR_API_URL ||
        "https://generator.dev.granconecta.net.br",
    ).replace(/\/$/, "");

    const resolvedSlug = slugify(slug || businessName);

    const previewUrl =
        projectId && layoutId
            ? `${generatorBaseUrl}/api/projects/${encodeURIComponent(
                projectId,
            )}/layouts/${encodeURIComponent(layoutId)}/preview`
            : "";

    function handleNameChange(value: string) {
        setBusinessName(value);

        if (!slug.trim()) {
            setSlug(slugify(value));
        }
    }

    function handleSlugChange(value: string) {
        setSlug(slugify(value));
    }

    async function handleCoverChange(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Escolha um arquivo de imagem.");
            return;
        }

        if (!storeId) {
            toast.error("Não encontrei o storeId do negócio.");
            return;
        }

        setCoverFile(file);

        const localPreview = URL.createObjectURL(file);

        setCoverPreview((current) => {
            if (current && current.startsWith("blob:")) {
                URL.revokeObjectURL(current);
            }

            return localPreview;
        });

        const loadingToast = toast.loading("Atualizando imagem de capa...");

        try {
            // 1) Faz o upload físico da imagem no GranConecta.
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await api.post("/lojas/store/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const uploadedUrl = String(
                uploadResponse.data?.url ||
                uploadResponse.data?.imageUrl ||
                uploadResponse.data?.image_url ||
                uploadResponse.data?.fileUrl ||
                uploadResponse.data?.file_url ||
                uploadResponse.data?.path ||
                uploadResponse.data?.filename ||
                "",
            ).trim();

            if (!uploadedUrl) {
                throw new Error("O servidor não retornou a URL da nova capa.");
            }

            // Mantém a URL em memória. A gravação definitiva em stores.capa_url
            // acontece somente quando o usuário aprovar e publicar a página.
            setCoverUrl(uploadedUrl);

            toast.success("Capa carregada. Publique a página para confirmar a alteração.", {
                id: loadingToast,
            });
        } catch (error: any) {
            console.error("GENERATOR PAGE SETUP - ERRO AO ATUALIZAR CAPA", error);

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Não foi possível atualizar a capa.",
                { id: loadingToast },
            );
        }
    }

    async function ensureProject(): Promise<string> {
        if (projectId) return projectId;

        if (!storeId) {
            throw new Error(
                "Não encontrei o storeId do negócio. Abra esta tela a partir do dashboard.",
            );
        }

        const response = await generatorApi.post("/api/projects", {
            origin: "GRANCONECTA",
            externalStoreId: storeId,
            projectType,
            generationMode: "layout-base-ai",
            name: businessName.trim(),
            business: {
                name: businessName.trim(),
                slug: resolvedSlug,
                type: tipo || (projectType === "ECOMMERCE" ? "EMPREENDEDOR" : "PRESTADOR"),
            },
        });

        const id = String(
            response.data?.project?.id ||
            response.data?.id ||
            response.data?.data?.id ||
            "",
        ).trim();

        if (!id) {
            throw new Error("O Generator não retornou o ID do projeto.");
        }

        setProjectId(id);
        return id;
    }

    async function uploadCover(currentProjectId: string) {
        if (!coverFile) return null;

        const formData = new FormData();
        formData.append("files", coverFile);
        formData.append("kind", "HERO");
        formData.append("purpose", "cover");
        formData.append("label", "Imagem de capa");

        const response = await generatorApi.post(
            `/api/projects/${currentProjectId}/assets`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
        );

        const addedAssets =
            response.data?.added ||
            response.data?.data?.added ||
            [];

        if (Array.isArray(addedAssets) && addedAssets.length > 0) {
            return addedAssets[addedAssets.length - 1];
        }

        return (
            response.data?.asset ||
            response.data?.data?.asset ||
            null
        );
    }

    async function handleGenerate() {
        if (!businessName.trim()) {
            toast.error("Informe o nome do negócio.");
            return;
        }

        if (!resolvedSlug) {
            toast.error("Informe um slug válido.");
            return;
        }

        if (!storeId) {
            toast.error("Não encontrei o storeId do negócio.");
            return;
        }

        setGenerating(true);
        const loadingToast = toast.loading("Gerando página profissional...");

        try {
            const currentProjectId = await ensureProject();
            const uploadedCover = await uploadCover(currentProjectId);

            const generationResponse = await generatorApi.post(
                `/api/projects/${currentProjectId}/generate`,
                {
                    business: {
                        name: businessName.trim(),
                        slug: resolvedSlug,
                        type:
                            tipo ||
                            (projectType === "ECOMMERCE" ? "EMPREENDEDOR" : "PRESTADOR"),
                    },
                    projectType,
                    pageKind: projectType === "ECOMMERCE" ? "loja" : "servico",
                    objective:
                        projectType === "ECOMMERCE"
                            ? "Criar uma página comercial premium, elegante, responsiva e focada em conversão."
                            : "Criar uma página profissional premium, elegante, responsiva e focada em atendimento e conversão.",
                    coverAssetId:
                        uploadedCover?.id ||
                        uploadedCover?.assetId ||
                        uploadedCover?.asset_id ||
                        null,
                },
            );

            const layout = resolveLayout(generationResponse.data);

            if (!layout?.id) {
                throw new Error("O Generator não retornou um layout válido.");
            }

            setLayoutId(layout.id);

            toast.success("Página gerada com sucesso.", {
                id: loadingToast,
            });

            const url = `${generatorBaseUrl}/api/projects/${encodeURIComponent(
                currentProjectId,
            )}/layouts/${encodeURIComponent(layout.id)}/preview`;

            window.open(url, "_blank", "noopener,noreferrer");
        } catch (error: any) {
            console.error("GENERATOR PAGE SETUP - ERRO AO GERAR", error);

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Não foi possível gerar a página.",
                { id: loadingToast },
            );
        } finally {
            setGenerating(false);
        }
    }

    async function handlePublish() {
        if (!projectId || !layoutId) {
            toast.error("Gere uma página antes de publicar.");
            return;
        }

        setPublishing(true);
        const loadingToast = toast.loading("Publicando página...");

        try {
            const approvalResponse = await generatorApi.post(
                `/api/projects/${projectId}/layouts/${layoutId}/approve`,
            );

            if (approvalResponse.data?.approved !== true) {
                throw new Error("O Generator não confirmou a aprovação do layout.");
            }

            const publishResponse = await generatorApi.post(
                `/api/projects/${projectId}/layouts/${layoutId}/publish`,
            );

            if (publishResponse.data?.success !== true) {
                throw new Error("O Generator não confirmou a publicação.");
            }

            // A capa só se torna definitiva depois que a publicação do Generator
            // foi confirmada. Este é o mesmo momento de confirmação do site.
            const capaUrl = String(coverUrl || "").trim();

            if (storeId && capaUrl) {
                console.log("[GENERATOR PAGE SETUP] Salvando capa da loja", {
                    storeId,
                    capaUrl,
                });

                await api.put(
                    `/lojas/stores/${encodeURIComponent(storeId)}`,
                    {
                        capa_url: capaUrl,
                    },
                );
            }

            toast.success("Página publicada com sucesso.", {
                id: loadingToast,
            });

            const publishedSlug = String(
                publishResponse.data?.storeSlug || resolvedSlug,
            ).trim();

            if (publishedSlug) {
                window.open(
                    `/pagina/${encodeURIComponent(publishedSlug)}`,
                    "_blank",
                    "noopener,noreferrer",
                );
            }
        } catch (error: any) {
            console.error("GENERATOR PAGE SETUP - ERRO AO PUBLICAR", error);

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Não foi possível publicar a página.",
                { id: loadingToast },
            );
        } finally {
            setPublishing(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
            <Toaster position="top-right" />

            <div className="mx-auto w-full max-w-4xl">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-6 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-900"
                >
                    Voltar
                </button>

                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
                    <div className="border-b border-slate-800 px-6 py-6 md:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
                                <Store size={24} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-black text-white">
                                    Criar Página Profissional
                                </h1>
                                <p className="mt-1 text-sm text-slate-400">
                                    Informe apenas os dados essenciais. O Generator cuida de todo
                                    o design.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-8 p-6 md:grid-cols-[1fr_320px] md:p-8">
                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                                    Nome do negócio
                                </label>

                                <input
                                    value={businessName}
                                    onChange={(event) => handleNameChange(event.target.value)}
                                    placeholder="Ex.: Espaço Almarse"
                                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                                    Endereço da página
                                </label>

                                <div className="flex overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 focus-within:border-blue-500">
                                    <span className="flex items-center border-r border-slate-800 px-4 text-sm text-slate-500">
                                        /pagina/
                                    </span>

                                    <input
                                        value={slug}
                                        onChange={(event) => handleSlugChange(event.target.value)}
                                        placeholder="espaco-almarse"
                                        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-white outline-none"
                                    />
                                </div>

                                {resolvedSlug && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Sua página ficará em{" "}
                                        <strong className="text-slate-300">
                                            /pagina/{resolvedSlug}
                                        </strong>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                                    Imagem de capa
                                </label>

                                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-600 bg-slate-950 px-5 py-5 text-sm font-bold text-slate-300 transition hover:border-blue-500 hover:bg-slate-900">
                                    <UploadCloud size={20} />
                                    {coverFile ? "Trocar imagem de capa" : "Escolher imagem de capa"}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverChange}
                                        className="hidden"
                                    />
                                </label>

                                {coverFile && (
                                    <p className="mt-2 truncate text-xs text-slate-500">
                                        {coverFile.name}
                                    </p>
                                )}

                                {coverUrl && (
                                    <p className="mt-1 text-xs font-semibold text-emerald-400">
                                        Capa carregada. Será confirmada ao publicar.
                                    </p>
                                )}
                            </div>

                            <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/30 p-4 text-sm leading-relaxed text-emerald-200">
                                O GranConecta não vai editar o layout. O HTML, CSS,
                                responsividade, tipografia e composição visual ficam sob
                                responsabilidade exclusiva do Generator.
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={generating || publishing}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {generating ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Rocket size={18} />
                                    )}

                                    {generating ? "Gerando..." : "Gerar página"}
                                </button>

                                {previewUrl && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            window.open(
                                                previewUrl,
                                                "_blank",
                                                "noopener,noreferrer",
                                            )
                                        }
                                        className="rounded-2xl border border-slate-700 px-5 py-4 text-sm font-black text-slate-200 transition hover:bg-slate-800"
                                    >
                                        Ver página
                                    </button>
                                )}

                                {layoutId && (
                                    <button
                                        type="button"
                                        onClick={handlePublish}
                                        disabled={publishing || generating}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {publishing && (
                                            <Loader2 size={18} className="animate-spin" />
                                        )}

                                        {publishing ? "Publicando..." : "Aprovar e publicar"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="sticky top-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
                                <div className="aspect-[4/5] bg-slate-900">
                                    {coverPreview ? (
                                        <img
                                            src={coverPreview}
                                            alt="Prévia da capa"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-slate-600">
                                            <ImagePlus size={42} strokeWidth={1.5} />
                                            <span className="text-sm font-semibold">
                                                A imagem de capa aparecerá aqui
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-slate-800 p-4">
                                    <div className="truncate text-base font-black text-white">
                                        {businessName || "Nome do negócio"}
                                    </div>

                                    <div className="mt-1 truncate text-xs text-slate-500">
                                        /pagina/{resolvedSlug || "seu-slug"}
                                    </div>

                                    <div className="mt-3 inline-flex rounded-full border border-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        {projectType}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
