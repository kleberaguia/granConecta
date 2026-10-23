import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddPhotoAlternate as AddPhotoIcon,
  Close as CloseIcon,
  DeleteOutline as DeleteIcon,
  Storefront as StorefrontIcon,
  CheckCircleOutline as CheckCircleIcon,
  HourglassTop as HourglassIcon,
  ErrorOutline as ErrorIcon,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

import { toast } from "react-toastify";

import api from "../../api/api";

/**
 * ============================================================
 * TIPOS
 * ============================================================
 */

type ClassificadoCategoria =
  | "ELETRONICOS"
  | "INFORMATICA"
  | "CELULARES"
  | "MOVEIS"
  | "ELETRODOMESTICOS"
  | "CASA"
  | "INFANTIL"
  | "ESPORTES"
  | "BICICLETAS"
  | "VEICULOS"
  | "LIVROS"
  | "MODA"
  | "OUTROS";

type ClassificadoCondicao =
  | "NOVO"
  | "SEMINOVO"
  | "USADO";

type ClassificadoStatus =
  | "RASCUNHO"
  | "AGUARDANDO_PAGAMENTO"
  | "PAGO"
  | "EM_ANALISE"
  | "ATIVO"
  | "RESERVADO"
  | "VENDIDO"
  | "EXPIRADO"
  | "CANCELADO"
  | "REJEITADO"
  | "BLOQUEADO_COMERCIAL";

interface Classificado {
  id: string;

  usuarioId?: string;

  condominioId?: string | null;

  titulo: string;

  descricao: string;

  categoria: ClassificadoCategoria;

  condicao: ClassificadoCondicao;

  preco: string;

  status: ClassificadoStatus;

  creditoId?: string | null;

  duracaoDias?: number | null;

  createdAt?: string;

  updatedAt?: string;
}

interface ModeracaoTexto {
  permitido: boolean;

  classificacao: string;

  destino:
    | "EMPREENDEDOR"
    | "PRESTADOR"
    | null;

  motivos: string[];

  scoreComercial?: number;

  mensagem?: string;
}

interface ModeracaoImagemItem {
  id: string;

  url: string;

  permitido: boolean;

  classificacao: string;

  destino:
    | "EMPREENDEDOR"
    | "PRESTADOR"
    | null;

  possuiTexto?: boolean;

  possuiTelefone?: boolean;

  possuiWhatsapp?: boolean;

  possuiRedeSocial?: boolean;

  possuiQrCode?: boolean;

  parecePublicidade?: boolean;

  pareceCardapio?: boolean;

  pareceCatalogo?: boolean;

  conteudoImproprio?: boolean;

  textoDetectado?: string[];

  motivos?: string[];

  confianca?: number;

  mensagem?: string;
}

interface ModeracaoImagens {
  permitido: boolean;

  classificacao: string;

  destino:
    | "EMPREENDEDOR"
    | "PRESTADOR"
    | null;

  motivos: string[];

  imagens: ModeracaoImagemItem[];
}

export interface ResultadoAnalise {
  message?: string;

  classificado: Classificado;

  moderacao?: ModeracaoTexto;

  moderacaoImagens?: ModeracaoImagens;
}

interface ClassificadoNovoDialogProps {
  open: boolean;

  onClose: () => void;

  /**
   * Chamado quando o backend conclui a análise.
   *
   * O dashboard poderá usar o resultado para:
   *
   * - atualizar a listagem;
   * - abrir o fluxo de crédito;
   * - iniciar a publicação.
   */
  onAnalisado?: (
    resultado: ResultadoAnalise
  ) => void;
}

/**
 * ============================================================
 * CATEGORIAS
 * ============================================================
 */

const CATEGORIAS: Array<{
  value: ClassificadoCategoria;
  label: string;
}> = [
  {
    value: "ELETRONICOS",
    label: "Eletrônicos",
  },
  {
    value: "INFORMATICA",
    label: "Informática",
  },
  {
    value: "CELULARES",
    label: "Celulares",
  },
  {
    value: "MOVEIS",
    label: "Móveis",
  },
  {
    value: "ELETRODOMESTICOS",
    label: "Eletrodomésticos",
  },
  {
    value: "CASA",
    label: "Casa",
  },
  {
    value: "INFANTIL",
    label: "Infantil",
  },
  {
    value: "ESPORTES",
    label: "Esportes",
  },
  {
    value: "BICICLETAS",
    label: "Bicicletas",
  },
  {
    value: "VEICULOS",
    label: "Veículos",
  },
  {
    value: "LIVROS",
    label: "Livros",
  },
  {
    value: "MODA",
    label: "Moda",
  },
  {
    value: "OUTROS",
    label: "Outros",
  },
];

/**
 * ============================================================
 * CONDIÇÕES
 * ============================================================
 */

const CONDICOES: Array<{
  value: ClassificadoCondicao;
  label: string;
}> = [
  {
    value: "NOVO",
    label: "Novo",
  },
  {
    value: "SEMINOVO",
    label: "Seminovo",
  },
  {
    value: "USADO",
    label: "Usado",
  },
];

/**
 * ============================================================
 * CONSTANTES
 * ============================================================
 */

const MAX_IMAGENS = 8;

const MAX_TAMANHO_IMAGEM =
  10 * 1024 * 1024;

/**
 * ============================================================
 * COMPONENTE
 * ============================================================
 */

export default function ClassificadoNovoDialog({
  open,
  onClose,
  onAnalisado,
}: ClassificadoNovoDialogProps) {
  /**
   * ============================================================
   * FORMULÁRIO
   * ============================================================
   */

  const [titulo, setTitulo] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [categoria, setCategoria] =
    useState<ClassificadoCategoria>(
      "OUTROS"
    );

  const [condicao, setCondicao] =
    useState<ClassificadoCondicao>(
      "USADO"
    );

  const [preco, setPreco] =
    useState("");

  /**
   * ============================================================
   * IMAGENS
   * ============================================================
   */

  const [imagens, setImagens] =
    useState<File[]>([]);

  /**
   * ============================================================
   * PROCESSAMENTO
   * ============================================================
   */

  const [
    processando,
    setProcessando,
  ] = useState(false);

  const [etapa, setEtapa] =
    useState<
      | "FORMULARIO"
      | "CRIANDO"
      | "ENVIANDO_IMAGENS"
      | "ANALISANDO"
      | "RESULTADO"
    >("FORMULARIO");

  const [
    resultado,
    setResultado,
  ] =
    useState<ResultadoAnalise | null>(
      null
    );

  /**
   * ============================================================
   * PREVIEW DAS IMAGENS
   * ============================================================
   */

  const previews = useMemo(() => {
    return imagens.map((file) => ({
      file,

      url: URL.createObjectURL(file),
    }));
  }, [imagens]);

  /**
   * Libera os object URLs.
   */

  useEffect(() => {
    return () => {
      previews.forEach((item) => {
        URL.revokeObjectURL(
          item.url
        );
      });
    };
  }, [previews]);

  /**
   * ============================================================
   * RESET
   * ============================================================
   */

  const resetarFormulario = () => {
    setTitulo("");

    setDescricao("");

    setCategoria("OUTROS");

    setCondicao("USADO");

    setPreco("");

    setImagens([]);

    setResultado(null);

    setEtapa("FORMULARIO");

    setProcessando(false);
  };

  /**
   * ============================================================
   * FECHAR
   * ============================================================
   */

  const handleFechar = () => {
    if (processando) {
      return;
    }

    resetarFormulario();

    onClose();
  };

  /**
   * ============================================================
   * IMAGENS
   * ============================================================
   */

  const handleSelecionarImagens = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const arquivos = Array.from(
      event.target.files || []
    );

    /**
     * Permite selecionar novamente
     * o mesmo arquivo.
     */
    event.target.value = "";

    if (!arquivos.length) {
      return;
    }

    const apenasImagens =
      arquivos.filter((file) =>
        file.type.startsWith(
          "image/"
        )
      );

    if (
      apenasImagens.length !==
      arquivos.length
    ) {
      toast.error(
        "Alguns arquivos foram ignorados porque não são imagens."
      );
    }

    const dentroDoLimite =
      apenasImagens.filter(
        (file) =>
          file.size <=
          MAX_TAMANHO_IMAGEM
      );

    if (
      dentroDoLimite.length !==
      apenasImagens.length
    ) {
      toast.error(
        "Cada imagem deve possuir no máximo 10 MB."
      );
    }

    setImagens((anteriores) => {
      const total = [
        ...anteriores,
        ...dentroDoLimite,
      ];

      if (
        total.length >
        MAX_IMAGENS
      ) {
        toast.error(
          `Você pode adicionar no máximo ${MAX_IMAGENS} imagens.`
        );
      }

      return total.slice(
        0,
        MAX_IMAGENS
      );
    });
  };

  const handleRemoverImagem = (
    index: number
  ) => {
    if (processando) {
      return;
    }

    setImagens((anteriores) =>
      anteriores.filter(
        (_, i) => i !== index
      )
    );
  };

  /**
   * ============================================================
   * PREÇO
   * ============================================================
   */

  const normalizarPreco = (
    valor: string
  ): string | null => {
    const limpo = valor
      .trim()
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    if (!limpo) {
      return null;
    }

    const numero =
      Number(limpo);

    if (
      !Number.isFinite(numero)
    ) {
      return null;
    }

    if (numero < 0) {
      return null;
    }

    return numero.toFixed(2);
  };

  /**
   * ============================================================
   * VALIDAÇÃO
   * ============================================================
   */

  const validarFormulario =
    (): boolean => {
      if (!titulo.trim()) {
        toast.error(
          "Informe o título do anúncio."
        );

        return false;
      }

      if (
        titulo.trim().length < 3
      ) {
        toast.error(
          "O título deve possuir pelo menos 3 caracteres."
        );

        return false;
      }

      if (
        titulo.trim().length >
        160
      ) {
        toast.error(
          "O título deve possuir no máximo 160 caracteres."
        );

        return false;
      }

      if (!descricao.trim()) {
        toast.error(
          "Informe a descrição do produto."
        );

        return false;
      }

      if (
        descricao.trim().length <
        5
      ) {
        toast.error(
          "Descreva um pouco melhor o produto."
        );

        return false;
      }

      const precoNormalizado =
        normalizarPreco(preco);

      if (
        precoNormalizado === null
      ) {
        toast.error(
          "Informe um preço válido."
        );

        return false;
      }

      if (
        Number(
          precoNormalizado
        ) <= 0
      ) {
        toast.error(
          "O preço deve ser maior que zero."
        );

        return false;
      }

      if (!imagens.length) {
        toast.error(
          "Adicione pelo menos uma foto do produto."
        );

        return false;
      }

      return true;
    };

  /**
   * ============================================================
   * CRIAR RASCUNHO
   * ============================================================
   */

  const criarRascunho =
    async (): Promise<Classificado> => {
      const precoNormalizado =
        normalizarPreco(preco);

      if (!precoNormalizado) {
        throw new Error(
          "Preço inválido."
        );
      }

      const response =
        await api.post(
          "/classificados",
          {
            titulo:
              titulo.trim(),

            descricao:
              descricao.trim(),

            categoria,

            condicao,

            preco:
              precoNormalizado,
          }
        );

      /**
       * Mantém compatibilidade
       * caso o backend retorne:
       *
       * { classificado: {...} }
       *
       * ou diretamente o objeto.
       */

      const classificado =
        response.data
          ?.classificado ??
        response.data;

      if (
        !classificado?.id
      ) {
        throw new Error(
          "O backend não retornou o ID do classificado."
        );
      }

      return classificado as Classificado;
    };

  /**
   * ============================================================
   * UPLOAD DAS IMAGENS
   * ============================================================
   */

  const enviarImagens = async (
    classificadoId: string
  ) => {
    const formData =
      new FormData();

    imagens.forEach(
      (file) => {
        /**
         * Campo esperado pelo backend.
         */
        formData.append(
          "classificado_imagens",
          file
        );
      }
    );

    await api.post(
      `/classificados/${classificadoId}/imagens`,
      formData
    );
  };

  /**
   * ============================================================
   * MODERAÇÃO
   * ============================================================
   */

  const analisarClassificado =
    async (
      classificadoId: string
    ): Promise<ResultadoAnalise> => {
      const response =
        await api.post(
          `/classificados/${classificadoId}/enviar-analise`
        );

      return response.data as ResultadoAnalise;
    };

  /**
   * ============================================================
   * FLUXO COMPLETO
   * ============================================================
   */

  const handleEnviarParaAnalise =
    async () => {
      if (
        !validarFormulario()
      ) {
        return;
      }

      setProcessando(true);

      setResultado(null);

      let classificadoCriado:
        | Classificado
        | null = null;

      try {
        /**
         * 1. Criar rascunho
         */

        setEtapa(
          "CRIANDO"
        );

        classificadoCriado =
          await criarRascunho();

        /**
         * 2. Enviar imagens
         */

        setEtapa(
          "ENVIANDO_IMAGENS"
        );

        await enviarImagens(
          classificadoCriado.id
        );

        /**
         * 3. Analisar
         */

        setEtapa(
          "ANALISANDO"
        );

        const resultadoAnalise =
          await analisarClassificado(
            classificadoCriado.id
          );

        setResultado(
          resultadoAnalise
        );

        setEtapa(
          "RESULTADO"
        );

        /**
         * Não fechamos o modal.
         *
         * O usuário precisa visualizar
         * o resultado da análise.
         */

        const status =
          resultadoAnalise
            .classificado
            ?.status;

        if (
          status ===
          "AGUARDANDO_PAGAMENTO"
        ) {
          toast.success(
            "Anúncio aprovado na análise!"
          );
        } else if (
          status ===
          "BLOQUEADO_COMERCIAL"
        ) {
          toast.info(
            "Identificamos características de atividade comercial."
          );
        } else if (
          status ===
          "REJEITADO"
        ) {
          toast.error(
            "O anúncio precisa ser corrigido antes de continuar."
          );
        } else if (
          status ===
          "EM_ANALISE"
        ) {
          toast.info(
            "O anúncio permanecerá em análise."
          );
        }
      } catch (error: any) {
        console.error(
          "Erro ao criar classificado:",
          error?.response?.data ||
            error
        );

        const mensagem =
          error?.response?.data
            ?.message ||
          error?.response?.data
            ?.error ||
          error?.message ||
          "Não foi possível enviar o anúncio para análise.";

        toast.error(
          mensagem
        );

        /**
         * Se o rascunho já foi criado,
         * não criamos outro automaticamente.
         */

        if (
          classificadoCriado?.id
        ) {
          console.warn(
            "Classificado criado antes da falha:",
            classificadoCriado.id
          );
        }

        setEtapa(
          "FORMULARIO"
        );
      } finally {
        setProcessando(false);
      }
    };

  /**
   * ============================================================
   * TEXTO DE PROCESSAMENTO
   * ============================================================
   */

  const textoProcessamento =
    () => {
      switch (etapa) {
        case "CRIANDO":
          return "Preparando seu anúncio...";

        case "ENVIANDO_IMAGENS":
          return "Enviando as fotos...";

        case "ANALISANDO":
          return "Analisando o anúncio e as imagens...";

        default:
          return "Processando...";
      }
    };

  /**
   * ============================================================
   * RESULTADO DA MODERAÇÃO
   * ============================================================
   */

  const renderResultado =
    () => {
      if (
        !resultado?.classificado
      ) {
        return null;
      }

      const status =
        resultado.classificado
          .status;

      /**
       * APROVADO
       */

      if (
        status ===
        "AGUARDANDO_PAGAMENTO"
      ) {
        return (
          <Alert
            severity="success"
            icon={
              <CheckCircleIcon />
            }
            sx={{
              borderRadius: 3,
            }}
          >
            <Typography
              fontWeight={900}
            >
              Anúncio aprovado
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
              }}
            >
              Seu anúncio passou
              pela análise. Agora
              podemos escolher o
              crédito ou plano de
              publicação.
            </Typography>
          </Alert>
        );
      }

      /**
       * ATIVIDADE COMERCIAL
       */

      if (
        status ===
        "BLOQUEADO_COMERCIAL"
      ) {
        const destino =
          resultado.moderacao
            ?.destino ??
          resultado
            .moderacaoImagens
            ?.destino;

        const ehPrestador =
          destino ===
          "PRESTADOR";

        return (
          <Alert
            severity="info"
            icon={
              <StorefrontIcon />
            }
            sx={{
              borderRadius: 3,
            }}
          >
            <Typography
              fontWeight={900}
            >
              Parece ser uma
              atividade comercial
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
              }}
            >
              {resultado.message ||
                (ehPrestador
                  ? "Identificamos que este anúncio parece divulgar uma prestação de serviço. Cadastre-se como prestador no GranConecta para divulgar seu trabalho."
                  : "Identificamos que este anúncio parece divulgar uma atividade comercial. O Classificados é destinado a vendas ocasionais entre moradores. Você pode cadastrar seu negócio no GranConecta.")}
            </Typography>

            <Button
              variant="contained"
              size="small"
              startIcon={
                <StorefrontIcon />
              }
              sx={{
                mt: 2,
                borderRadius: 2,
                textTransform:
                  "none",
                fontWeight: 800,
              }}
              onClick={() => {
                /**
                 * Depois conectaremos
                 * à rota real.
                 */
                toast.info(
                  ehPrestador
                    ? "Vamos conectar ao cadastro de prestador."
                    : "Vamos conectar ao cadastro de empreendedor."
                );
              }}
            >
              {ehPrestador
                ? "Cadastrar como prestador"
                : "Cadastrar meu negócio"}
            </Button>
          </Alert>
        );
      }

      /**
       * REJEITADO
       */

      if (
        status ===
        "REJEITADO"
      ) {
        const motivos =
          resultado
            .moderacaoImagens
            ?.motivos ?? [];

        return (
          <Alert
            severity="error"
            icon={
              <ErrorIcon />
            }
            sx={{
              borderRadius: 3,
            }}
          >
            <Typography
              fontWeight={900}
            >
              Precisamos corrigir
              este anúncio
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
              }}
            >
              {resultado.message ||
                "Uma ou mais imagens não atendem às regras dos Classificados."}
            </Typography>

            {motivos.length >
              0 && (
              <Box
                sx={{
                  mt: 1.5,
                }}
              >
                {motivos.map(
                  (
                    motivo,
                    index
                  ) => (
                    <Typography
                      key={`${motivo}-${index}`}
                      variant="caption"
                      display="block"
                    >
                      • {motivo}
                    </Typography>
                  )
                )}
              </Box>
            )}

            <Typography
              variant="body2"
              sx={{
                mt: 1.5,
                fontWeight: 700,
              }}
            >
              Remova ou substitua
              a imagem indicada
              para tentar novamente.
            </Typography>
          </Alert>
        );
      }

      /**
       * EM ANÁLISE
       */

      if (
        status ===
        "EM_ANALISE"
      ) {
        return (
          <Alert
            severity="warning"
            icon={
              <HourglassIcon />
            }
            sx={{
              borderRadius: 3,
            }}
          >
            <Typography
              fontWeight={900}
            >
              Anúncio em análise
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
              }}
            >
              Não foi possível
              concluir
              automaticamente a
              análise deste anúncio.
              Ele permanecerá em
              análise antes da
              publicação.
            </Typography>
          </Alert>
        );
      }

      /**
       * OUTROS STATUS
       */

      return (
        <Alert
          severity="info"
          sx={{
            borderRadius: 3,
          }}
        >
          {resultado.message ||
            `Status do anúncio: ${status}`}
        </Alert>
      );
    };

  /**
   * ============================================================
   * ANÁLISE INDIVIDUAL DAS IMAGENS
   * ============================================================
   */

  const renderAnaliseImagens =
    () => {
      const imagensModeradas =
        resultado
          ?.moderacaoImagens
          ?.imagens ?? [];

      if (
        imagensModeradas.length ===
        0
      ) {
        return null;
      }

      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border:
              "1px solid #e2e8f0",
          }}
        >
          <Typography
            fontWeight={900}
            sx={{
              mb: 1,
            }}
          >
            Análise das fotos
          </Typography>

          {imagensModeradas.map(
            (
              imagem,
              index
            ) => (
              <Box
                key={
                  imagem.id ||
                  index
                }
                sx={{
                  py: 1,

                  borderBottom:
                    index <
                    imagensModeradas.length -
                      1
                      ? "1px solid #e2e8f0"
                      : "none",
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography
                    variant="body2"
                    fontWeight={800}
                  >
                    Foto{" "}
                    {index + 1}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight:
                        800,

                      color:
                        imagem.permitido
                          ? "success.main"
                          : "error.main",
                    }}
                  >
                    {imagem.permitido
                      ? "Aprovada"
                      : "Atenção"}
                  </Typography>
                </Stack>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{
                    mt: 0.5,
                  }}
                >
                  {imagem.mensagem ||
                    "Imagem analisada."}
                </Typography>

                {imagem.motivos &&
                  imagem.motivos
                    .length >
                    0 && (
                    <Box
                      sx={{
                        mt: 0.5,
                      }}
                    >
                      {imagem.motivos.map(
                        (
                          motivo,
                          motivoIndex
                        ) => (
                          <Typography
                            key={`${imagem.id}-${motivoIndex}`}
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            •{" "}
                            {
                              motivo
                            }
                          </Typography>
                        )
                      )}
                    </Box>
                  )}
              </Box>
            )
          )}
        </Paper>
      );
    };

  /**
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <Dialog
      open={open}
      onClose={
        processando
          ? undefined
          : handleFechar
      }
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: {
            xs: 0,
            sm: 4,
          },

          minHeight: {
            xs: "100%",
            sm: "auto",
          },
        },
      }}
      fullScreen={false}
    >
      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <DialogTitle
        sx={{
          pr: 7,
          fontWeight: 900,
        }}
      >
        {etapa ===
        "RESULTADO"
          ? "Resultado da análise"
          : "Novo Classificado"}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
          }}
        >
          Venda de forma segura
          para moradores da
          comunidade GranConecta.
        </Typography>

        <IconButton
          onClick={
            handleFechar
          }
          disabled={
            processando
          }
          sx={{
            position:
              "absolute",

            top: 12,

            right: 12,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* =====================================================
          CONTEÚDO
      ===================================================== */}

      <DialogContent
        dividers
        sx={{
          bgcolor: "#fafafa",
        }}
      >
        {/* PROCESSAMENTO */}

        {processando && (
          <Paper
            elevation={0}
            sx={{
              p: 4,

              borderRadius: 3,

              border:
                "1px solid #e2e8f0",

              textAlign:
                "center",
            }}
          >
            <CircularProgress />

            <Typography
              variant="h6"
              fontWeight={900}
              sx={{
                mt: 2,
              }}
            >
              {textoProcessamento()}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
              }}
            >
              Isso pode levar
              alguns segundos.
              Não feche esta
              janela.
            </Typography>
          </Paper>
        )}

        {/* =================================================
            FORMULÁRIO
        ================================================= */}

        {!processando &&
          etapa !==
            "RESULTADO" && (
            <Stack
              spacing={3}
            >
              <Alert
                severity="info"
                sx={{
                  borderRadius:
                    3,
                }}
              >
                Os Classificados
                são destinados a
                vendas ocasionais
                entre moradores.
                Anúncios comerciais
                ou de prestação de
                serviços poderão ser
                direcionados para
                outra área do
                GranConecta.
              </Alert>

              {/* TÍTULO */}

              <TextField
                label="Título do anúncio"
                placeholder="Ex.: Celular usado em ótimo estado"
                value={titulo}
                onChange={(
                  event
                ) =>
                  setTitulo(
                    event.target
                      .value
                  )
                }
                fullWidth
                required
                disabled={
                  processando
                }
                inputProps={{
                  maxLength:
                    160,
                }}
                helperText={`${titulo.length}/160`}
              />

              {/* DESCRIÇÃO */}

              <TextField
                label="Descrição"
                placeholder="Conte os detalhes do produto, tempo de uso, conservação e o que acompanha."
                value={
                  descricao
                }
                onChange={(
                  event
                ) =>
                  setDescricao(
                    event.target
                      .value
                  )
                }
                fullWidth
                required
                multiline
                minRows={4}
                disabled={
                  processando
                }
              />

              {/* CATEGORIA + CONDIÇÃO */}

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
              >
                <FormControl
                  fullWidth
                  required
                >
                  <InputLabel>
                    Categoria
                  </InputLabel>

                  <Select
                    value={
                      categoria
                    }
                    label="Categoria"
                    disabled={
                      processando
                    }
                    onChange={(
                      event
                    ) =>
                      setCategoria(
                        event
                          .target
                          .value as ClassificadoCategoria
                      )
                    }
                  >
                    {CATEGORIAS.map(
                      (
                        item
                      ) => (
                        <MenuItem
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>

                <FormControl
                  fullWidth
                  required
                >
                  <InputLabel>
                    Condição
                  </InputLabel>

                  <Select
                    value={
                      condicao
                    }
                    label="Condição"
                    disabled={
                      processando
                    }
                    onChange={(
                      event
                    ) =>
                      setCondicao(
                        event
                          .target
                          .value as ClassificadoCondicao
                      )
                    }
                  >
                    {CONDICOES.map(
                      (
                        item
                      ) => (
                        <MenuItem
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Stack>

              {/* PREÇO */}

              <TextField
                label="Preço"
                placeholder="0,00"
                value={preco}
                onChange={(
                  event
                ) =>
                  setPreco(
                    event.target
                      .value
                  )
                }
                fullWidth
                required
                disabled={
                  processando
                }
                inputMode="decimal"
                InputProps={{
                  startAdornment:
                    (
                      <InputAdornment position="start">
                        R$
                      </InputAdornment>
                    ),
                }}
              />

              {/* FOTOS */}

              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={900}
                >
                  Fotos do produto
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 1.5,
                  }}
                >
                  Adicione até{" "}
                  {MAX_IMAGENS}{" "}
                  fotos. As imagens
                  serão analisadas
                  antes da
                  publicação.
                </Typography>

                <Button
                  component="label"
                  variant="outlined"
                  startIcon={
                    <AddPhotoIcon />
                  }
                  disabled={
                    processando ||
                    imagens.length >=
                      MAX_IMAGENS
                  }
                  sx={{
                    borderRadius:
                      2,

                    textTransform:
                      "none",

                    fontWeight:
                      800,
                  }}
                >
                  Adicionar fotos

                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={
                      handleSelecionarImagens
                    }
                  />
                </Button>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    ml: 1.5,
                  }}
                >
                  {imagens.length}/
                  {MAX_IMAGENS}
                </Typography>
              </Box>

              {/* PREVIEW */}

              {previews.length >
                0 && (
                <Box
                  sx={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      {
                        xs: "repeat(2, 1fr)",
                        sm: "repeat(3, 1fr)",
                        md: "repeat(4, 1fr)",
                      },

                    gap: 1.5,
                  }}
                >
                  {previews.map(
                    (
                      item,
                      index
                    ) => (
                      <Box
                        key={`${item.file.name}-${item.file.lastModified}-${index}`}
                        sx={{
                          position:
                            "relative",

                          aspectRatio:
                            "1 / 1",

                          borderRadius:
                            3,

                          overflow:
                            "hidden",

                          bgcolor:
                            "#e2e8f0",

                          border:
                            "1px solid #e2e8f0",
                        }}
                      >
                        <Box
                          component="img"
                          src={
                            item.url
                          }
                          alt={`Foto ${index + 1}`}
                          sx={{
                            width:
                              "100%",

                            height:
                              "100%",

                            objectFit:
                              "cover",

                            display:
                              "block",
                          }}
                        />

                        {index ===
                          0 && (
                          <Box
                            sx={{
                              position:
                                "absolute",

                              left: 8,

                              bottom:
                                8,

                              px: 1,

                              py: 0.5,

                              bgcolor:
                                "rgba(0,0,0,.72)",

                              color:
                                "#fff",

                              borderRadius:
                                1,

                              fontSize:
                                11,

                              fontWeight:
                                800,
                            }}
                          >
                            Capa
                          </Box>
                        )}

                        <IconButton
                          size="small"
                          color="error"
                          disabled={
                            processando
                          }
                          onClick={() =>
                            handleRemoverImagem(
                              index
                            )
                          }
                          sx={{
                            position:
                              "absolute",

                            top: 6,

                            right: 6,

                            bgcolor:
                              "rgba(255,255,255,.92)",

                            "&:hover":
                              {
                                bgcolor:
                                  "#fff",
                              },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )
                  )}
                </Box>
              )}
            </Stack>
          )}

        {/* =================================================
            RESULTADO
        ================================================= */}

        {!processando &&
          etapa ===
            "RESULTADO" && (
            <Stack
              spacing={2}
            >
              {renderResultado()}

              {renderAnaliseImagens()}
            </Stack>
          )}
      </DialogContent>

      {/* =====================================================
          AÇÕES
      ===================================================== */}

      <DialogActions
        sx={{
          px: 3,
          py: 2,
        }}
      >
        {etapa ===
          "FORMULARIO" && (
          <>
            <Button
              onClick={
                handleFechar
              }
              disabled={
                processando
              }
              color="inherit"
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              onClick={
                handleEnviarParaAnalise
              }
              disabled={
                processando
              }
              sx={{
                borderRadius:
                  2,

                px: 3,

                fontWeight:
                  900,

                textTransform:
                  "none",
              }}
            >
              Enviar para análise
            </Button>
          </>
        )}

        {etapa ===
          "RESULTADO" && (
          <>
            <Button
              onClick={
                handleFechar
              }
              color="inherit"
            >
              Fechar
            </Button>

            {resultado
              ?.classificado
              ?.status ===
              "AGUARDANDO_PAGAMENTO" && (
              <Button
                variant="contained"
                sx={{
                  borderRadius:
                    2,

                  px: 3,

                  fontWeight:
                    900,

                  textTransform:
                    "none",
                }}
                onClick={() => {
                  if (
                    !resultado
                  ) {
                    return;
                  }

                  onAnalisado?.(
                    resultado
                  );
                }}
              >
                Continuar para
                publicação
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}