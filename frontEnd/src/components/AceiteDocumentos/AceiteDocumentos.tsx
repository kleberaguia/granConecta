import { useEffect, useState } from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Link,
  Stack,
} from "@mui/material";
import api from "../../api/api";
import { API_URL } from "../../utils/config";

type DocumentoLegal = {
  id: string;
  tipo: string;
  titulo: string;
  versao: string;
  conteudo: string;
  arquivo_url?: string;
  obrigatorio: boolean;
};

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
  corDestaque: string;
  tipoUsuario: "MORADOR" | "PRESTADOR";
  isEmpreendedor: boolean;
};

export default function AceiteDocumentos({
  value,
  onChange,
  corDestaque,
  tipoUsuario,
  isEmpreendedor,
}: Props) {
  const [docs, setDocs] = useState<DocumentoLegal[]>([]);
  const [docAberto, setDocAberto] = useState<DocumentoLegal | null>(null);

  useEffect(() => {
    api
      .get("/documentos-legais")
      .then((res) => setDocs(res.data))
      .catch((err) => console.error("Erro ao carregar documentos:", err));
  }, []);

  const docsFiltrados = docs.filter((doc) => {
    if (doc.tipo === "TERMOS_USO") return true;
    if (doc.tipo === "POLITICA_PRIVACIDADE") return true;

    if (tipoUsuario === "PRESTADOR") {
      return (
        doc.tipo === "TERMO_PRESTADOR" ||
        doc.tipo === "TERMO_EMPREENDEDOR"
      );
    }

    if (tipoUsuario === "MORADOR" && isEmpreendedor) {
      return doc.tipo === "TERMO_EMPREENDEDOR";
    }

    return false;
  });

  const toggleDoc = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...value, id]);
    } else {
      onChange(value.filter((x) => x !== id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const normalizarTextoDocumento = (texto: string) => {
    let conteudo = texto || "";

    conteudo = conteudo.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    conteudo = conteudo.replace(
      /(TERMOS DE USO DA PLATAFORMA GRANCONECTA|POLÍTICA DE PRIVACIDADE DA PLATAFORMA GRANCONECTA|TERMO DE RESPONSABILIDADE DO PRESTADOR DE SERVIÇOS|TERMO DE RESPONSABILIDADE DO EMPREENDEDOR E LOJISTA)/gi,
      "\n\n$1\n\n"
    );

    conteudo = conteudo.replace(/(Versão\s+\d+(?:\.\d+)?)/gi, "\n$1\n");
    conteudo = conteudo.replace(/(Última atualização:\s*\d{2}\/\d{2}\/\d{4})/gi, "\n$1\n\n");

    conteudo = conteudo.replace(
      /(\d{1,2}\.\s*[A-ZÀ-Ú][A-ZÀ-Ú\s]+)/g,
      "\n\n$1\n"
    );

    conteudo = conteudo.replace(/\s*\*\s*/g, "\n• ");

    conteudo = conteudo.replace(/([.;])(?=\s*[A-ZÀ-Ú])/g, "$1\n\n");
    conteudo = conteudo.replace(/\n{3,}/g, "\n\n");

    return conteudo.trim();
  };

  const formatarDocumento = (texto?: string) => {
    if (!texto) return null;

    const conteudo = normalizarTextoDocumento(texto);

    const linhas = conteudo
      .split("\n")
      .map((linha) => linha.trim())
      .filter(Boolean);

    return linhas.map((linha, index) => {
      const isTituloPrincipal =
        /^TERMOS DE USO/i.test(linha) ||
        /^POLÍTICA DE PRIVACIDADE/i.test(linha) ||
        /^TERMO DE RESPONSABILIDADE/i.test(linha);

      const isMeta =
        /^Versão/i.test(linha) ||
        /^Última atualização/i.test(linha);

      const isSecao = /^\d{1,2}\.\s/.test(linha);

      const isLista = linha.startsWith("•") || linha.startsWith("-");

      if (isTituloPrincipal) {
        return (
          <Typography
            key={index}
            sx={{
              textAlign: "center",
              fontWeight: 800,
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              lineHeight: 1.35,
              mb: 1.2,
              color: "#0f172a",
              textTransform: "uppercase",
            }}
          >
            {linha}
          </Typography>
        );
      }

      if (isMeta) {
        return (
          <Typography
            key={index}
            sx={{
              textAlign: "center",
              color: "#64748b",
              fontSize: "0.78rem",
              mb: 0.7,
            }}
          >
            {linha}
          </Typography>
        );
      }

      if (isSecao) {
        return (
          <Typography
            key={index}
            sx={{
              mt: 2.2,
              mb: 0.8,
              fontWeight: 800,
              fontSize: { xs: "0.84rem", sm: "0.92rem" },
              color: "#0f172a",
              borderBottom: "1px solid #e5e7eb",
              pb: 0.45,
              textTransform: "uppercase",
            }}
          >
            {linha}
          </Typography>
        );
      }

      if (isLista) {
        return (
          <Typography
            key={index}
            sx={{
              ml: 2,
              mb: 0.45,
              fontSize: { xs: "0.8rem", sm: "0.86rem" },
              lineHeight: 1.55,
              color: "#334155",
            }}
          >
            • {linha.replace(/^[-•]/, "").trim()}
          </Typography>
        );
      }

      return (
        <Typography
          key={index}
          sx={{
            mb: 1.1,
            fontSize: { xs: "0.8rem", sm: "0.86rem" },
            lineHeight: 1.7,
            textAlign: "justify",
            color: "#334155",
          }}
        >
          {linha}
        </Typography>
      );
    });
  };

  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: "#252525", borderRadius: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{
          color: corDestaque,
          mb: 1,
          fontSize: "0.82rem",
          fontWeight: 700,
        }}
      >
        Termos e documentos obrigatórios
      </Typography>

      {docsFiltrados.map((doc) => (
        <Box key={doc.id} sx={{ mb: 0.3 }}>
          <FormControlLabel
            sx={{
              alignItems: "center",
              m: 0,
              width: "100%",
              "& .MuiFormControlLabel-label": {
                width: "100%",
              },
            }}
            control={
              <Checkbox
                size="small"
                checked={value.includes(doc.id)}
                onChange={(e) => toggleDoc(doc.id, e.target.checked)}
                sx={{
                  color: "#aaa",
                  p: 0.6,
                  "&.Mui-checked": { color: corDestaque },
                }}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{
                  color: "white",
                  fontSize: "0.72rem",
                  lineHeight: 1.15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Li e aceito{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={() => setDocAberto(doc)}
                  sx={{
                    color: corDestaque,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    verticalAlign: "baseline",
                  }}
                >
                  {doc.titulo}
                </Link>
              </Typography>
            }
          />

          {doc.arquivo_url && (
            <Typography variant="caption" sx={{ ml: 4 }}>
              <a href={doc.arquivo_url} target="_blank" rel="noreferrer">
                Baixar documento
              </a>
            </Typography>
          )}
        </Box>
      ))}

      <Dialog
        open={!!docAberto}
        onClose={() => setDocAberto(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "#f8fafc",
          },
        }}
      >
        <DialogContent
          dividers
          sx={{
            p: 0,
            bgcolor: "#f8fafc",
          }}
        >
          <Box
            className="no-print"
            sx={{
              background:
                "linear-gradient(135deg, #020617 0%, #0f172a 45%, #1e3a8a 100%)",
              color: "white",
              textAlign: "center",
              px: 3,
              py: 2,
            }}
          >
            <Box
              component="img"
              src={`${API_URL}/uploads/images/logo1.png`}
              alt="GranConecta"
              sx={{
                width: { xs: 48, sm: 62 },
                maxWidth: "30%",
                mb: 1,
              }}
            />

            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                letterSpacing: 0.2,
                fontSize: { xs: "0.95rem", sm: "1.05rem" },
                lineHeight: 1.25,
              }}
            >
              {docAberto?.titulo}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                opacity: 0.85,
                fontSize: "0.75rem",
              }}
            >
              Versão {docAberto?.versao}
            </Typography>
          </Box>

          <Box
            sx={{
              maxWidth: 780,
              mx: "auto",
              my: { xs: 0, sm: 3 },
              p: { xs: 2, sm: 3 },
              bgcolor: "white",
              color: "#1f2937",
              boxShadow: {
                xs: "none",
                sm: "0 8px 24px rgba(15, 23, 42, 0.10)",
              },
              borderRadius: { xs: 0, sm: 2 },
            }}
          >
            <Box
              sx={{
                display: "none",
                "@media print": {
                  display: "block",
                  textAlign: "center",
                  mb: 3,
                },
              }}
            >
              <Typography variant="h6" fontWeight={800}>
                {docAberto?.titulo}
              </Typography>

              <Typography variant="body2">
                Versão {docAberto?.versao}
              </Typography>
            </Box>

            <Box sx={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
              {formatarDocumento(docAberto?.conteudo)}
            </Box>

            <Box
              sx={{
                borderTop: "1px solid #e2e8f0",
                mt: 3,
                pt: 1.5,
                textAlign: "center",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Documento oficial da plataforma GranConecta
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          className="no-print"
          sx={{
            px: 3,
            py: 2,
            bgcolor: "#f8fafc",
          }}
        >
          <Stack direction="row" spacing={1}>
            <Button onClick={handlePrint} variant="outlined">
              Imprimir / Salvar PDF
            </Button>

            {docAberto?.arquivo_url && (
              <Button
                component="a"
                href={docAberto.arquivo_url}
                target="_blank"
                variant="outlined"
              >
                Baixar PDF
              </Button>
            )}

            <Button
              onClick={() => setDocAberto(null)}
              variant="contained"
              sx={{
                bgcolor: "#0f172a",
                "&:hover": { bgcolor: "#1e293b" },
              }}
            >
              Fechar
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}