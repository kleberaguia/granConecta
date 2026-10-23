import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@mui/material";
import api from "../../api/api";
import { API_URL } from "../../utils/config";
import styles from "./DocumentoLegalPage.module.css";

type DocumentoLegal = {
  id: string;
  tipo: string;
  titulo: string;
  versao: string;
  conteudo: string;
  arquivo_url?: string;
  obrigatorio: boolean;
};

const tipoPorSlug: Record<string, string> = {
  "termos-de-uso": "TERMOS_USO",
  "politica-de-privacidade": "POLITICA_PRIVACIDADE",
  "termo-prestador": "TERMO_PRESTADOR",
  "termo-empreendedor": "TERMO_EMPREENDEDOR"
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
  conteudo = conteudo.replace(/(\d{1,2}\.\s*[A-ZÀ-Ú][A-ZÀ-Ú\s]+)/g, "\n\n$1\n");
  conteudo = conteudo.replace(/\s*\*\s*/g, "\n• ");
  conteudo = conteudo.replace(/([.;])(?=\s*[A-ZÀ-Ú])/g, "$1\n\n");
  conteudo = conteudo.replace(/\n{3,}/g, "\n\n");

  return conteudo.trim();
};

const formatarDocumento = (texto?: string) => {
  if (!texto) return null;

  const linhas = normalizarTextoDocumento(texto)
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
        <h1 key={index} className={styles.documentTitle}>
          {linha}
        </h1>
      );
    }

    if (isMeta) {
      return (
        <p key={index} className={styles.documentMeta}>
          {linha}
        </p>
      );
    }

    if (isSecao) {
      return (
        <h2 key={index} className={styles.sectionTitle}>
          {linha}
        </h2>
      );
    }

    if (isLista) {
      return (
        <p key={index} className={styles.listItem}>
          • {linha.replace(/^[-•]/, "").trim()}
        </p>
      );
    }

    return (
      <p key={index} className={styles.paragraph}>
        {linha}
      </p>
    );
  });
};

export default function DocumentoLegalPage() {
  const { slug = "termos-de-uso" } = useParams();
  const [docs, setDocs] = useState<DocumentoLegal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get("/documentos-legais")
      .then((res) => {
        if (mounted) setDocs(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error("Erro ao carregar documentos:", err))
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const documento = useMemo(() => {
    const tipo = tipoPorSlug[slug] || "TERMOS_USO";
    return docs.find((doc) => doc.tipo === tipo);
  }, [docs, slug]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>Carregando documento...</div>
      </main>
    );
  }

  if (!documento) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <h1>Documento não encontrado</h1>
          <p>Não foi possível localizar este documento legal.</p>
          <Link to="/" className={styles.backLink}>Voltar para a home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <Link to="/" className={styles.logoLink}>
          <img src={`${API_URL}/uploads/images/logo1.png`} alt="GranConecta" />
        </Link>
        <span>Documento oficial</span>
        <h1>{documento.titulo}</h1>
        <p>Versão {documento.versao}</p>
      </header>

      <article className={styles.card}>
        <div className={styles.actions}>
          <Button onClick={handlePrint} variant="outlined">
            Imprimir / Salvar PDF
          </Button>

          {documento.arquivo_url && (
            <Button
              component="a"
              href={documento.arquivo_url}
              target="_blank"
              rel="noreferrer"
              variant="contained"
            >
              Baixar PDF
            </Button>
          )}
        </div>

        <div className={styles.content}>
          {formatarDocumento(documento.conteudo)}
        </div>
      </article>
    </main>
  );
}
