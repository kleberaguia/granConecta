import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from "@mui/material";

import api from "../../api/api";

export type EnderecoCepValue = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

type Props = {
  value: EnderecoCepValue;

  onChange: (
    value: EnderecoCepValue
  ) => void;

  corDestaque?: string;

  required?: boolean;

  titulo?: string;

  mostrarComplemento?: boolean;
};

const limparCep = (
  valor: string
): string =>
  String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 8);

const formatarCep = (
  valor: string
): string => {
  const cep = limparCep(valor);

  if (cep.length <= 5) {
    return cep;
  }

  return `${cep.slice(0, 5)}-${cep.slice(5)}`;
};

export default function EnderecoCep({
  value,
  onChange,
  corDestaque = "#FFD700",
  required = true,
  titulo = "Endereço",
  mostrarComplemento = true,
}: Props) {
  const [buscandoCep, setBuscandoCep] =
    useState(false);

  const [erroCep, setErroCep] =
    useState("");

  const [cepLocalizado, setCepLocalizado] =
    useState(false);

  /*
   * Evita consultar novamente o mesmo CEP
   * em renders subsequentes.
   */
  const ultimoCepConsultado =
    useRef("");
  const valorAtualRef = useRef(value);
  valorAtualRef.current = value;

  const inputStyle = {
    "& .MuiInputBase-input": {
      color: "white",
    },

    "& .MuiInputLabel-root": {
      color: "#aaa",
      bgcolor: "#252525",
      px: 0.5,
    },

    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "#444",
      },

      "&:hover fieldset": {
        borderColor: corDestaque,
      },

      "&.Mui-focused fieldset": {
        borderColor: corDestaque,
      },
    },
  };

  const atualizarCampo = (
    campo: keyof EnderecoCepValue,
    valor: string
  ) => {
    onChange({
      ...value,
      [campo]: valor,
    });
  };

  const buscarCep = async (
    cepInformado: string
  ) => {
    const cep = limparCep(
      cepInformado
    );

    if (cep.length !== 8) {
      return;
    }

    if (
      ultimoCepConsultado.current === cep
    ) {
      return;
    }

    ultimoCepConsultado.current = cep;

    setBuscandoCep(true);
    setErroCep("");
    setCepLocalizado(false);

    try {
      /*
       * IMPORTANTE:
       *
       * Preferimos passar pelo nosso backend
       * em vez de chamar BrasilAPI diretamente
       * do navegador.
       *
       * Vamos criar este endpoint no próximo
       * passo:
       *
       * GET /condominio/consultar-cep/:cep
       */
      const response = await api.get(
        `/condominio/consultar-cep/${cep}`
      );

      const endereco =
        response.data?.endereco ||
        response.data ||
        {};

      // Preserva dados do DOT e alterações feitas enquanto o CEP era consultado.
      const atual = valorAtualRef.current;
      if (limparCep(atual.cep) !== cep) return;
      onChange({
        ...atual,
        cep,
        logradouro: atual.logradouro || endereco.logradouro || endereco.street || "",
        numero: atual.numero || "",
        complemento: atual.complemento || "",
        bairro: atual.bairro || endereco.bairro || endereco.neighborhood || "",
        cidade: atual.cidade || endereco.cidade || endereco.city || "",
        uf: (atual.uf || String(endereco.uf || endereco.state || "")).toUpperCase(),
      });

      setCepLocalizado(true);
    } catch (error: any) {
      console.error(
        "Erro ao consultar CEP:",
        error
      );

      /*
       * Permite corrigir e tentar novamente
       * o mesmo CEP.
       */
      ultimoCepConsultado.current = "";

      setErroCep(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Não foi possível localizar este CEP."
      );
    } finally {
      setBuscandoCep(false);
    }
  };

  /*
   * Quando completar os oito números,
   * consulta automaticamente.
   */
  useEffect(() => {
    const cep = limparCep(
      value.cep
    );

    if (cep.length === 8) {
      void buscarCep(cep);
    } else {
      setCepLocalizado(false);
      setErroCep("");

      if (
        ultimoCepConsultado.current &&
        ultimoCepConsultado.current !== cep
      ) {
        ultimoCepConsultado.current = "";
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.cep]);

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: "#252525",
        borderRadius: 2,
        border: "1px solid #3a3a3a",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: corDestaque,
          fontWeight: "bold",
          display: "block",
          mb: 1,
        }}
      >
        📍 {titulo}
      </Typography>

      <TextField
        fullWidth
        label="CEP"
        value={formatarCep(
          value.cep
        )}
        onChange={(e) => {
          const novoCep =
            limparCep(
              e.target.value
            );

          onChange({
            ...value,

            cep: novoCep,

            /*
             * Se trocar o CEP depois de uma
             * consulta, limpamos os campos
             * derivados para não misturar
             * endereços.
             */
            logradouro:
              novoCep ===
              limparCep(value.cep)
                ? value.logradouro
                : "",

            bairro:
              novoCep ===
              limparCep(value.cep)
                ? value.bairro
                : "",

            cidade:
              novoCep ===
              limparCep(value.cep)
                ? value.cidade
                : "",

            uf:
              novoCep ===
              limparCep(value.cep)
                ? value.uf
                : "",
          });
        }}
        required={required}
        margin="dense"
        placeholder="00000-000"
        inputProps={{
          inputMode: "numeric",
          maxLength: 9,
        }}
        InputProps={{
          endAdornment:
            buscandoCep ? (
              <CircularProgress
                size={20}
                sx={{
                  color:
                    corDestaque,
                }}
              />
            ) : undefined,
        }}
        sx={inputStyle}
      />

      {erroCep && (
        <Alert
          severity="warning"
          sx={{
            mt: 1,
            mb: 1,
          }}
        >
          {erroCep}
        </Alert>
      )}

      {cepLocalizado && (
        <Alert
          severity="success"
          sx={{
            mt: 1,
            mb: 1,
          }}
        >
          Endereço localizado pelo CEP.
        </Alert>
      )}

      <TextField
        fullWidth
        label="Logradouro"
        value={value.logradouro}
        onChange={(e) =>
          atualizarCampo(
            "logradouro",
            e.target.value
          )
        }
        required={required}
        margin="dense"
        sx={inputStyle}
      />

      <Grid
        container
        spacing={1}
      >
        <Grid
          size={
            mostrarComplemento
              ? 5
              : 12
          }
        >
          <TextField
            fullWidth
            label="Número"
            value={value.numero}
            onChange={(e) =>
              atualizarCampo(
                "numero",
                e.target.value
              )
            }
            required={required}
            margin="dense"
            sx={inputStyle}
          />
        </Grid>

        {mostrarComplemento && (
          <Grid size={7}>
            <TextField
              fullWidth
              label="Complemento"
              value={value.complemento}
              onChange={(e) =>
                atualizarCampo(
                  "complemento",
                  e.target.value
                )
              }
              margin="dense"
              placeholder="Opcional"
              sx={inputStyle}
            />
          </Grid>
        )}
      </Grid>

      <TextField
        fullWidth
        label="Bairro"
        value={value.bairro}
        onChange={(e) =>
          atualizarCampo(
            "bairro",
            e.target.value
          )
        }
        required={required}
        margin="dense"
        sx={inputStyle}
      />

      <Grid
        container
        spacing={1}
      >
        <Grid size={8}>
          <TextField
            fullWidth
            label="Cidade"
            value={value.cidade}
            onChange={(e) =>
              atualizarCampo(
                "cidade",
                e.target.value
              )
            }
            required={required}
            margin="dense"
            sx={inputStyle}
          />
        </Grid>

        <Grid size={4}>
          <TextField
            fullWidth
            label="UF"
            value={value.uf}
            onChange={(e) =>
              atualizarCampo(
                "uf",
                e.target.value
                  .toUpperCase()
                  .slice(0, 2)
              )
            }
            required={required}
            margin="dense"
            inputProps={{
              maxLength: 2,
            }}
            sx={inputStyle}
          />
        </Grid>
      </Grid>
    </Box>
  );
}