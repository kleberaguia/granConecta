import { useEffect, useState } from "react";
import api from "../../api/api";

interface UseStoreBuilderProps {
  storeId: string;
}

export function useStoreBuilder({
  storeId
}: UseStoreBuilderProps) {

  const [loading, setLoading] = useState(true);

  const [templateJson, setTemplateJson] = useState<any>(null);

  const [aiData, setAiData] = useState<any>({
    titulo: "Meu Site",
    subtitulo: "",
    produtos: []
  });

  const [estilos, setEstilos] = useState({
    primaryColor: "#DE1F5A",
    bodyBgColor: "#0E0E0E",
    textColor: "#FFFFFF",
    fontFamily: "Inter"
  });

  useEffect(() => {

    if (!storeId) return;

    const loadStore = async () => {
      try {

        setLoading(true);

        const { data } = await api.get(
          `/lojas/stores/${storeId}`
        );

        console.log("STORE DATA", data);

        // TEMPLATE JSON
        if (data.templateJson) {
          setTemplateJson(data.templateJson);
        }

        // AI DATA
        if (data.aiData) {
          setAiData(data.aiData);
        }

        // ESTILOS
        if (data.estilo) {

          setEstilos({
            primaryColor:
              data.estilo.primary_color || "#DE1F5A",

            bodyBgColor:
              data.estilo.body_bg || "#0E0E0E",

            textColor:
              data.estilo.body_text_color || "#FFFFFF",

            fontFamily:
              data.estilo.body_font || "Inter"
          });
        }

      } catch (err) {

        console.error(
          "Erro ao carregar loja:",
          err
        );

      } finally {

        setLoading(false);

      }
    };

    loadStore();

  }, [storeId]);

  return {

    loading,

    templateJson,
    setTemplateJson,

    aiData,
    setAiData,

    estilos,
    setEstilos
  };
}