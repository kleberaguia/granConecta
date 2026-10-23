import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, Alert, Box,
  ToggleButton, ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, Radio, RadioGroup, FormLabel, Grid, Divider,
  IconButton, InputAdornment, Autocomplete
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../api/api';
import toast from 'react-hot-toast';
import AceiteDocumentos from "../AceiteDocumentos/AceiteDocumentos";
import EnderecoCep, { type EnderecoCepValue } from "../EnderecoCep/EnderecoCep";
// Estilos auxiliares para manter o código limpo
const inputStyle = (cor: string) => ({
  '& .MuiInputBase-input': { color: 'white' },
  '& .MuiInputLabel-root': { color: '#aaa', bgcolor: '#1e1e1e', px: 1 },
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: '#444' },
    '&:hover fieldset': { borderColor: cor },
    '&.Mui-focused fieldset': { borderColor: cor }
  }
});

const radioStyle = (cor: string) => ({
  color: '#aaa',
  '&.Mui-checked': { color: cor }
});

const sanitizarTexto = (texto: string): string => {
  if (!texto) return "";
  return texto.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';
  // Dados enviados pelo DOT: somente preenche o formulário; nunca aceita documentos.
  const cadastroTipo = searchParams.get('tipo')?.toUpperCase() === 'PRESTADOR' ? 'PRESTADOR' : 'MORADOR';
  const cadastroEmpreendedor = searchParams.get('empreendedor') === '1';
  const cadastroRamo = searchParams.get('ramo') === 'loja' ? 'loja' : 'servico';
  const cadastroMora = searchParams.get('moraEmCondominio') !== '0';


  // Estados de Controle
  const [tipoUsuario, setTipoUsuario] = useState<'MORADOR' | 'PRESTADOR'>(cadastroTipo);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [condominios, setCondominios] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [novaEspecialidade, setNovaEspecialidade] = useState('');
  const [novoTipoCategoria, setNovoTipoCategoria] = useState<'servico' | 'loja'>(cadastroRamo);
  const [isOutraEspecialidade, setIsOutraEspecialidade] = useState(false);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<number | ''>('');
  const [nomeGrupoAutomatico, setNomeGrupoAutomatico] = useState('');
  const [moraEmCondominio, setMoraEmCondominio] = useState(cadastroMora);
  const [naoEncontrouCondominio, setNaoEncontrouCondominio] = useState(false);
  const [nomeNovoCondominio, setNomeNovoCondominio] = useState('');
  const [formData, setFormData] = useState({
    name: searchParams.get('nome') || '',
    email: searchParams.get('email') || '',
    telefone: searchParams.get('telefone') || '',
    password: '',
    categoria: searchParams.get('categoria') || '',
    categoriaid: '',
    is_empreendedor: cadastroTipo === 'MORADOR' && cadastroEmpreendedor,
    origem: cadastroMora ? 'INTERNO' : 'EXTERNO',
    condominio_id: '',
    condominio_unidade_id: '',
    bloco: '',
    unidade: '',
    codigo_acesso: '', // legado: mantido temporariamente por compatibilidade
    cep: searchParams.get('cep') || '',
    logradouro: searchParams.get('logradouro') || '',
    numero: searchParams.get('numero') || '',
    complemento: searchParams.get('complemento') || '',
    endereco_externo: searchParams.get('logradouro') || '',
    bairro: searchParams.get('bairro') || '',
    cidade: searchParams.get('cidade') || '',
    uf: searchParams.get('uf') || '',
    aceita_utilidade_whatsapp: true,
    aceita_marketing_whatsapp: false,
  });

  const enderecoValue: EnderecoCepValue = {
    cep: formData.cep,
    logradouro: formData.logradouro,
    numero: formData.numero,
    complemento: formData.complemento,
    bairro: formData.bairro,
    cidade: formData.cidade,
    uf: formData.uf,
  };

  const handleEnderecoChange = (endereco: EnderecoCepValue) => {
    setFormData(prev => ({
      ...prev,
      ...endereco,
      // Compatibilidade com fluxos antigos que ainda leem endereco_externo.
      endereco_externo: endereco.logradouro,
    }));
  };

  const [documentosAceitos, setDocumentosAceitos] = useState<string[]>([]);

  useEffect(() => {
    api.get('/tipos-combo').then(res => setCategorias(res.data)).catch(err => console.error(err));
    api.get('/condominio').then(res => setCondominios(res.data)).catch(err => console.error(err));

    // ✅ Busca os novos grupos do banco
    api.get('/grupos-home').then(res => setGrupos(res.data)).catch(err => console.error(err));
  }, []);

  // Seleciona a categoria sugerida pelo DOT após o carregamento da API.
  // O usuário pode alterar a escolha antes de confirmar o cadastro.
  useEffect(() => {
    const nome = searchParams.get('categoria')?.trim();
    if (!nome || !categorias.length) return;
    const normalizar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    const encontrada = categorias.find((cat) =>
      cat.tipo === cadastroRamo && normalizar(String(cat.name || '')) === normalizar(nome)
    );
    if (!encontrada) return;
    setFormData((prev) => prev.categoriaid ? prev : {
      ...prev, categoriaid: String(encontrada.id), categoria: String(encontrada.name),
    });
    if (encontrada.grupo) {
      setNomeGrupoAutomatico(encontrada.grupo.nome);
      setGrupoSelecionadoId(encontrada.grupo.id);
    }
  }, [categorias, searchParams, cadastroRamo]);

  const handleTypeChange = (_event: any, newType: 'MORADOR' | 'PRESTADOR') => {
    if (newType) {
      setTipoUsuario(newType);
      setDocumentosAceitos([]);

      setFormData(prev => ({
        ...prev,
        is_empreendedor: false,
        categoriaid: '',
        categoria: '',
        origem: newType === 'MORADOR' ? 'INTERNO' : 'EXTERNO'
      }));

      setIsOutraEspecialidade(false);
      setNovoTipoCategoria(newType === 'PRESTADOR' ? 'servico' : 'loja');
    }
  };

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleMoradiaChange = (_event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    const interno = value === 'SIM';

    setMoraEmCondominio(interno);

    if (!interno) {
      setNaoEncontrouCondominio(false);
      setNomeNovoCondominio('');
    }

    setFormData(prev => ({
      ...prev,
      origem: interno ? 'INTERNO' : 'EXTERNO',
      condominio_id: interno ? prev.condominio_id : '',
      condominio_unidade_id: '',
      bloco: interno ? prev.bloco : '',
      unidade: interno ? prev.unidade : '',
      codigo_acesso: ''
    }));
  };

  const handleCheckChange = (e: any) => {
    const { checked } = e.target;

    setDocumentosAceitos([]);
    setFormData({ ...formData, is_empreendedor: checked });
    if (checked) setNovoTipoCategoria('loja');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    let servicoIdFinal = formData.categoriaid;
    let categoriaNomeFinal = formData.categoria;
    let finalIsEmpreendedor = formData.is_empreendedor;

    if (tipoUsuario === "PRESTADOR") {
      finalIsEmpreendedor = novoTipoCategoria === "loja";
    }

    try {
      let condominioIdFinal = formData.condominio_id || '';
      let condominioUnidadeIdFinal = formData.condominio_unidade_id || '';

      /*
       * Novo fluxo residencial:
       * CEP/endereço -> condomínio -> bloco/torre -> unidade.
       *
       * O backend é a fonte de verdade para CEP, condomínio e unidade.
       * Mesmo quando o condomínio já existe, /solicitar-cadastro apenas
       * reutiliza o registro e cria/reutiliza a unidade.
       */
      if (tipoUsuario === "MORADOR" && moraEmCondominio) {
        const condominioSelecionado = condominios.find(
          (c) => String(c.id) === String(formData.condominio_id)
        );

        const nomeCondominio = naoEncontrouCondominio
          ? nomeNovoCondominio.trim()
          : String(condominioSelecionado?.nome || '').trim();

        if (!/^\d{8}$/.test(String(formData.cep || '').replace(/\D/g, ''))) {
          throw new Error("Informe um CEP válido antes de continuar.");
        }

        if (!formData.numero.trim()) {
          throw new Error("Informe o número do condomínio.");
        }

        if (!nomeCondominio) {
          throw new Error(
            naoEncontrouCondominio
              ? "Informe o nome do condomínio."
              : "Selecione o condomínio ou escolha “Não encontrei meu condomínio”."
          );
        }

        if (!formData.bloco.trim()) {
          throw new Error("Informe o bloco ou torre.");
        }

        if (!formData.unidade.trim()) {
          throw new Error("Informe o apartamento ou unidade.");
        }

        const respostaCondominio = await api.post(
          "/condominio/solicitar-cadastro",
          {
            nome: nomeCondominio,
            cep: formData.cep,
            numero: formData.numero,
            complemento: formData.complemento || null,
            bloco_torre: formData.bloco,
            unidade_apto: formData.unidade,
          }
        );

        condominioIdFinal =
          respostaCondominio.data?.condominio?.id || '';

        condominioUnidadeIdFinal =
          respostaCondominio.data?.unidade?.id || '';

        if (!condominioIdFinal || !condominioUnidadeIdFinal) {
          throw new Error(
            "Não foi possível identificar o condomínio e a unidade residencial."
          );
        }
      }

      if (isOutraEspecialidade && novaEspecialidade) {
        const nomeLimpo = sanitizarTexto(novaEspecialidade);
        const partes = nomeLimpo.split(" ");

        const iniciais =
          partes.length > 1
            ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
            : nomeLimpo.substring(0, 2).toUpperCase();

        const cores = [
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
        ];

        const corCard = cores[Math.floor(Math.random() * cores.length)];

        const resTipo = await api.post("/servico-tipo/find-or-create", {
          name: nomeLimpo,
          tipo: novoTipoCategoria,
          grupo_id: grupoSelecionadoId,
          iniciais,
          cor_card: corCard,
          storeId: condominioIdFinal || null,
        });

        servicoIdFinal = resTipo.data.id;
        categoriaNomeFinal = nomeLimpo;
      }

      if (!documentosAceitos.length) {
        setError("Você precisa aceitar os termos obrigatórios para continuar.");
        setLoading(false);
        return;
      }

      // Usuário sem condomínio é visitante; parceiros mantêm seu fluxo comercial.
      const tipoCadastro =
        tipoUsuario === "MORADOR" && !finalIsEmpreendedor && !condominioIdFinal
          ? "VISITANTE"
          : tipoUsuario;

      const payload = {
        ...formData,
        documentosAceitos,
        tipo: tipoCadastro,
        is_prestador: tipoUsuario === "PRESTADOR",
        is_empreendedor: finalIsEmpreendedor,

        categoriaid:
          tipoUsuario === "PRESTADOR" || finalIsEmpreendedor
            ? servicoIdFinal
            : null,

        categoria:
          tipoUsuario === "PRESTADOR" || finalIsEmpreendedor
            ? categoriaNomeFinal
            : null,

        origem:
          (tipoUsuario === "MORADOR" ? moraEmCondominio : formData.origem === "INTERNO")
            ? "INTERNO"
            : "EXTERNO",
        is_interno:
          tipoUsuario === "MORADOR"
            ? moraEmCondominio
            : formData.origem === "INTERNO",
        condominio_id:
          (tipoUsuario === "MORADOR" ? moraEmCondominio : formData.origem === "INTERNO")
            ? condominioIdFinal || null
            : null,
        condominio_unidade_id:
          tipoUsuario === "MORADOR" && moraEmCondominio
            ? condominioUnidadeIdFinal || null
            : null,
        bloco:
          (tipoUsuario === "MORADOR" ? moraEmCondominio : formData.origem === "INTERNO")
            ? formData.bloco
            : "",
        unidade:
          (tipoUsuario === "MORADOR" ? moraEmCondominio : formData.origem === "INTERNO")
            ? formData.unidade
            : "",
        codigo_acesso:
          tipoUsuario === "MORADOR"
            ? ""
            : formData.origem === "INTERNO"
              ? formData.codigo_acesso
              : "",
        // Endereço preenchido pelo componente de CEP.
        cep: formData.cep,
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
        endereco_externo: formData.logradouro,
      };

      const isMoradorComum =
        tipoUsuario === "MORADOR" && !finalIsEmpreendedor;

      if (isMoradorComum) {
        const response = await api.post("/auth/register", payload);

        localStorage.removeItem("pendingRegister");

        const usuarioId =
          response.data?.user?.id ||
          response.data?.usuario?.id ||
          response.data?.usuarioId;

        if (!usuarioId) {
          throw new Error("Cadastro criado, mas não foi possível identificar o usuário para registrar o aceite.");
        }


        if (response.data?.token) {
          const tipoUsuarioDocumentos = finalIsEmpreendedor
            ? "EMPREENDEDOR"
            : tipoCadastro;

          localStorage.setItem(
            "pendingRegister",
            JSON.stringify({
              ...payload,
              tipo_usuario_documentos: tipoUsuarioDocumentos,
            }),
          );

          api.defaults.headers.common.Authorization =
            `Bearer ${response.data.token}`;
        }

        await api.post("/documentos-legais/aceitar", {
          email: payload.email,
          usuarioId,
          tipo_usuario: tipoCadastro,
          documentosIds: documentosAceitos,
        });


        toast.success("Cadastro realizado com sucesso!");

        const loginParams = new URLSearchParams();

        if (payload.email) {
          loginParams.set("email", String(payload.email).trim().toLowerCase());
        }

        if (redirectPath) {
          loginParams.set("redirect", redirectPath);
        }

        const loginQuery = loginParams.toString();

        navigate(
          `/login/morador${loginQuery ? `?${loginQuery}` : ""}`,
          {
            replace: true,
          },
        );

        return;
      }

      localStorage.setItem("pendingRegister", JSON.stringify(payload));

      toast.success("Cadastro preenchido. Agora escolha seu plano!");

      navigate("/pagamento-orientacoes", {
        state: {
          isEmpreendedor: finalIsEmpreendedor,
          tipoUsuario,
        },
      });
    } catch (err: any) {
      console.error("Erro ao realizar cadastro:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Erro ao realizar o cadastro.",
      );
    } finally {
      setLoading(false);
    }
  };


  const corDestaque = tipoUsuario === 'PRESTADOR' ? '#00d4ff' : '#FFD700';

  return (
    <Container
      maxWidth="xs"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column', // Mudança para facilitar o fluxo
        justifyContent: { xs: 'flex-start', sm: 'center' }, // No mobile começa do topo
        py: { xs: 2, sm: 4 }, // Padding menor no mobile
        px: { xs: 1, sm: 2 }
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: { xs: 2, sm: 4 }, // Menos padding interno no mobile para ganhar espaço
          width: '100%',
          bgcolor: '#1e1e1e',
          color: 'white',
          borderRadius: 2,
          mb: 4 // Margem inferior para o botão não colar no fim da tela
        }}
      >

        <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', color: corDestaque }}>
          Cadastro
        </Typography>

        {/* Toggle Principal: Morador vs Prestador */}
        <Box display="flex" justifyContent="center" mb={3}>
          <ToggleButtonGroup value={tipoUsuario} exclusive onChange={handleTypeChange} sx={{ bgcolor: '#333', p: 0.5 }}>
            <ToggleButton
              value="MORADOR"
              sx={{
                color: 'white', width: 120,
                opacity: tipoUsuario === 'MORADOR' ? 1 : 0.3,
                '&.Mui-selected': { bgcolor: '#FFD700', color: 'black', fontWeight: 'bold' }
              }}
            >
              Morador
            </ToggleButton>
            <ToggleButton
              value="PRESTADOR"
              sx={{
                color: 'white', width: 120,
                opacity: tipoUsuario === 'PRESTADOR' ? 1 : 0.3,
                '&.Mui-selected': { bgcolor: '#00d4ff', color: 'black', fontWeight: 'bold' }
              }}
            >
              Prestador
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Nome Completo" name="name" value={formData.name} onChange={handleChange} margin="dense" required sx={inputStyle(corDestaque)} />
          <TextField fullWidth label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} margin="dense" required sx={inputStyle(corDestaque)} />
          <TextField fullWidth label="WhatsApp" name="telefone" value={formData.telefone} onChange={handleChange} margin="dense" required sx={inputStyle(corDestaque)} />
          <Box
            sx={{
              mt: 1.5,
              mb: 1,
              p: 1.5,
              bgcolor: '#252525',
              borderRadius: 2,
              border: '1px solid #3a3a3a',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: corDestaque,
                fontWeight: 'bold',
                display: 'block',
                mb: 0.5,
              }}
            >
              Avisos pelo WhatsApp
            </Typography>

            <FormControlLabel
              sx={{
                alignItems: 'flex-start',
                m: 0,
                mb: 0.5,
              }}
              control={
                <Checkbox
                  checked={formData.aceita_utilidade_whatsapp}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      aceita_utilidade_whatsapp: e.target.checked,
                    }))
                  }
                  sx={{
                    color: '#aaa',
                    pt: 0.3,
                    '&.Mui-checked': {
                      color: corDestaque,
                    },
                  }}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{ color: '#ddd', lineHeight: 1.4 }}
                >
                  Quero receber avisos importantes do GranConecta pelo WhatsApp,
                  como interesses nos meus recados, pedidos e atendimentos.
                </Typography>
              }
            />

            <FormControlLabel
              sx={{
                alignItems: 'flex-start',
                m: 0,
              }}
              control={
                <Checkbox
                  checked={formData.aceita_marketing_whatsapp}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      aceita_marketing_whatsapp: e.target.checked,
                    }))
                  }
                  sx={{
                    color: '#aaa',
                    pt: 0.3,
                    '&.Mui-checked': {
                      color: corDestaque,
                    },
                  }}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{ color: '#bbb', lineHeight: 1.4 }}
                >
                  Quero receber novidades, ofertas e campanhas do GranConecta.
                </Typography>
              }
            />

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#888',
                mt: 0.5,
                lineHeight: 1.4,
              }}
            >
              Você poderá alterar essas preferências depois.
            </Typography>
          </Box>
          <TextField
            fullWidth label="Senha" name="password"
            type={showPassword ? 'text' : 'password'}
            onChange={handleChange} margin="dense" required sx={inputStyle(corDestaque)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: '#aaa' }}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {tipoUsuario === 'MORADOR' && (
            <FormControlLabel
              sx={{ mt: 1, color: 'white' }}
              control={<Checkbox name="is_empreendedor" checked={formData.is_empreendedor} onChange={handleCheckChange} sx={{ color: '#aaa', '&.Mui-checked': { color: corDestaque } }} />}
              label={<Typography variant="body2">Sou Empreendedor (Tenho Loja)</Typography>}
            />
          )}

          <Divider sx={{ my: 2, bgcolor: '#444' }} />

          {tipoUsuario === 'MORADOR' && (
            <Box sx={{ p: 2, bgcolor: '#252525', borderRadius: 2, mb: 2 }}>
              <FormLabel sx={{ color: corDestaque, fontSize: '0.82rem', fontWeight: 'bold' }}>
                Você mora em condomínio?
              </FormLabel>

              <RadioGroup
                row
                value={moraEmCondominio ? 'SIM' : 'NAO'}
                onChange={handleMoradiaChange}
                sx={{ mt: 1 }}
              >
                <FormControlLabel value="SIM" control={<Radio sx={radioStyle(corDestaque)} />} label="Sim" />
                <FormControlLabel value="NAO" control={<Radio sx={radioStyle(corDestaque)} />} label="Não" />
              </RadioGroup>

              {!moraEmCondominio && (
                <Alert severity="info" sx={{ mt: 1.5 }}>
                  Sem problema. Informe seu CEP e endereço para concluir o cadastro.
                </Alert>
              )}
            </Box>
          )}

          {/* ENDEREÇO DO MORADOR - usado tanto para condomínio quanto para residência externa */}
          {tipoUsuario === 'MORADOR' && (
            <Box sx={{ mb: 2 }}>
              <EnderecoCep
                value={enderecoValue}
                onChange={handleEnderecoChange}
                corDestaque={corDestaque}
                required
                titulo={
                  moraEmCondominio
                    ? "Endereço do condomínio"
                    : "Seu endereço"
                }
                mostrarComplemento={!moraEmCondominio}
              />
            </Box>
          )}

          {/* NOVO FLUXO DE CONDOMÍNIO DO MORADOR */}
          {tipoUsuario === 'MORADOR' && moraEmCondominio && (
            <Box sx={{ p: 2, bgcolor: '#252525', borderRadius: 2, mb: 2 }}>
              <Typography
                variant="caption"
                sx={{ color: corDestaque, fontWeight: 'bold', display: 'block', mb: 1 }}
              >
                🏢 CONDOMÍNIO E UNIDADE
              </Typography>

              {!naoEncontrouCondominio ? (
                <>
                  <Autocomplete
                    options={condominios}
                    value={
                      condominios.find(
                        (c) => String(c.id) === String(formData.condominio_id)
                      ) || null
                    }
                    getOptionLabel={(option) => option?.nome || ""}
                    isOptionEqualToValue={(option, value) =>
                      String(option.id) === String(value.id)
                    }
                    onChange={(_event, value) => {
                      setFormData(prev => ({
                        ...prev,
                        condominio_id: value?.id || '',
                        condominio_unidade_id: '',
                      }));
                    }}
                    noOptionsText="Nenhum condomínio encontrado"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Procure seu condomínio"
                        required
                        sx={inputStyle(corDestaque)}
                      />
                    )}
                  />

                  <Button
                    type="button"
                    onClick={() => {
                      setNaoEncontrouCondominio(true);
                      setNomeNovoCondominio('');
                      setFormData(prev => ({
                        ...prev,
                        condominio_id: '',
                        condominio_unidade_id: '',
                      }));
                    }}
                    sx={{
                      mt: 1,
                      px: 0,
                      color: corDestaque,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    + NÃO ENCONTREI MEU CONDOMÍNIO
                  </Button>
                </>
              ) : (
                <>
                  <Alert severity="info" sx={{ mb: 1.5 }}>
                    Informe o nome do condomínio. O GranConecta verificará o endereço antes de criar o cadastro.
                  </Alert>

                  <TextField
                    fullWidth
                    label="Nome do condomínio"
                    value={nomeNovoCondominio}
                    onChange={(e) => setNomeNovoCondominio(e.target.value)}
                    required
                    margin="dense"
                    sx={inputStyle(corDestaque)}
                  />

                  <Button
                    type="button"
                    onClick={() => {
                      setNaoEncontrouCondominio(false);
                      setNomeNovoCondominio('');
                    }}
                    sx={{
                      mt: 0.5,
                      px: 0,
                      color: '#aaa',
                      fontSize: '0.72rem',
                    }}
                  >
                    ← Voltar para a lista de condomínios
                  </Button>
                </>
              )}

              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Bloco / Torre"
                    name="bloco"
                    value={formData.bloco}
                    onChange={handleChange}
                    required
                    sx={inputStyle(corDestaque)}
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Apartamento / Unidade"
                    name="unidade"
                    value={formData.unidade}
                    onChange={handleChange}
                    required
                    sx={inputStyle(corDestaque)}
                  />
                </Grid>
              </Grid>

              <Typography
                variant="caption"
                sx={{ color: '#888', display: 'block', mt: 1.5, lineHeight: 1.5 }}
              >
                O código da unidade será gerado automaticamente pelo GranConecta.
                Você não precisa informar o antigo código de acesso do condomínio.
              </Typography>
            </Box>
          )}

          {/* Prestador interno: mantemos temporariamente o fluxo legado nesta etapa */}
          {tipoUsuario === 'PRESTADOR' && formData.origem === 'INTERNO' && (
            <Box sx={{ p: 2, bgcolor: '#252525', borderRadius: 2, mb: 2 }}>
              <Typography variant="caption" sx={{ color: corDestaque, fontWeight: 'bold' }}>
                📍 LOCALIZAÇÃO INTERNA
              </Typography>

              <FormControl fullWidth margin="dense" required sx={inputStyle(corDestaque)}>
                <InputLabel shrink>Condomínio</InputLabel>
                <Select
                  name="condominio_id"
                  value={formData.condominio_id}
                  onChange={handleChange}
                  notched
                >
                  {condominios.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={1}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Bloco"
                    name="bloco"
                    value={formData.bloco}
                    onChange={handleChange}
                    sx={inputStyle(corDestaque)}
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Unid."
                    name="unidade"
                    value={formData.unidade}
                    onChange={handleChange}
                    required
                    sx={inputStyle(corDestaque)}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                type="password"
                label="Código Acesso"
                name="codigo_acesso"
                value={formData.codigo_acesso}
                onChange={handleChange}
                margin="dense"
                required
                sx={inputStyle(corDestaque)}
              />
            </Box>
          )}

          {/* CATEGORIA E RAMO (PARCEIROS) */}
          {(tipoUsuario === 'PRESTADOR' || formData.is_empreendedor) && (
            <Box sx={{ p: 2, bgcolor: '#252525', borderRadius: 2, mb: 2, border: `1px solid ${corDestaque}33` }}>

              {/* Toggle de Ramo: Filtra o Combo */}
              {tipoUsuario === 'PRESTADOR' && (
                <Box mb={2} display="flex" flexDirection="column" alignItems="center">
                  <Typography variant="caption" sx={{ color: '#888', mb: 1 }}>O que você oferece?</Typography>
                  <ToggleButtonGroup
                    value={novoTipoCategoria}
                    exclusive
                    onChange={(_e, val) => { if (val) setNovoTipoCategoria(val) }}
                    size="small"
                    sx={{ bgcolor: '#333' }}
                  >
                    <ToggleButton value="servico" sx={{ color: 'white', fontSize: '0.7rem', opacity: novoTipoCategoria === 'servico' ? 1 : 0.3, '&.Mui-selected': { bgcolor: corDestaque, color: 'black' } }}>Serviços</ToggleButton>
                    <ToggleButton value="loja" sx={{ color: 'white', fontSize: '0.7rem', opacity: novoTipoCategoria === 'loja' ? 1 : 0.3, '&.Mui-selected': { bgcolor: corDestaque, color: 'black' } }}>Loja/Produtos</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              <Autocomplete
                key={`${novoTipoCategoria}-${isOutraEspecialidade}`} // Reseta o autocomplete se mudar o tipo
                options={categorias.filter(cat => cat.tipo === novoTipoCategoria)}
                getOptionLabel={(option) => option.name || ""}
                onChange={(_e, val) => {
                  setIsOutraEspecialidade(false);
                  setFormData({ ...formData, categoriaid: val?.id || '', categoria: val?.name || '' });

                  if (val?.grupo) {
                    setNomeGrupoAutomatico(val.grupo.nome);
                    setGrupoSelecionadoId(val.grupo.id);
                  } else {
                    setNomeGrupoAutomatico('');
                    setGrupoSelecionadoId('');
                  }
                }}
                noOptionsText={
                  <Button onClick={() => setIsOutraEspecialidade(true)} sx={{ color: corDestaque }}>
                    + NÃO ENCONTREI MINHA CATEGORIA
                  </Button>
                }
                renderInput={(p) => <TextField {...p} label={`Categoria de ${novoTipoCategoria}`} sx={inputStyle(corDestaque)} required={!isOutraEspecialidade} />}
              />

              {/* ✅ EXIBIÇÃO OU ESCOLHA DO GRUPO */}
              {(formData.categoriaid || isOutraEspecialidade) && (
                <Box mt={2} p={1.5} sx={{ bgcolor: '#333', borderRadius: 1, border: '1px dashed #555' }}>
                  {nomeGrupoAutomatico && !isOutraEspecialidade ? (
                    <Typography variant="caption" sx={{ color: '#00ff88', display: 'flex', alignItems: 'center', gap: 1 }}>
                      ✨ Esta categoria faz parte do grupo: <strong>{nomeGrupoAutomatico}</strong>
                    </Typography>
                  ) : (
                    <>
                      <Typography variant="caption" sx={{ color: corDestaque, mb: 1, display: 'block' }}>
                        Em qual setor sua atividade se encaixa?
                      </Typography>
                      <FormControl fullWidth size="small" sx={inputStyle(corDestaque)}>
                        <InputLabel>Selecione o Grupo</InputLabel>
                        <Select
                          value={grupoSelecionadoId}
                          label="Selecione o Grupo"
                          onChange={(e) => setGrupoSelecionadoId(e.target.value as number)}
                          required
                        >
                          {grupos.map(g => (
                            <MenuItem key={g.id} value={g.id}>{g.nome}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </>
                  )}
                </Box>
              )}

              {isOutraEspecialidade && (
                <Box mt={2} display="flex" flexDirection="column" gap={1}>
                  <Typography variant="caption" color="gray">Cadastrando nova categoria:</Typography>
                  <TextField
                    fullWidth
                    label="Nome da Categoria"
                    onChange={(e) => setNovaEspecialidade(e.target.value)}
                    sx={inputStyle(corDestaque)}
                    size="small"
                    required
                  />
                </Box>
              )}


              {tipoUsuario === 'PRESTADOR' && (
                <>
                  <RadioGroup row name="origem" value={formData.origem} onChange={handleChange} sx={{ mt: 2 }}>
                    <FormLabel sx={{ width: '100%', color: '#aaa', fontSize: '0.75rem' }}>Mora no condomínio parceiro?</FormLabel>
                    <FormControlLabel value="INTERNO" control={<Radio sx={radioStyle(corDestaque)} />} label="Sim" />
                    <FormControlLabel value="EXTERNO" control={<Radio sx={radioStyle(corDestaque)} />} label="Não" />
                  </RadioGroup>

                  {formData.origem === 'EXTERNO' && (
                    <Box mt={2}>
                      <EnderecoCep
                        value={enderecoValue}
                        onChange={handleEnderecoChange}
                        corDestaque={corDestaque}
                        required
                        titulo={
                          moraEmCondominio
                            ? "Endereço do condomínio"
                            : "Seu endereço"
                        }
                        mostrarComplemento={!moraEmCondominio}
                      />
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}

          <AceiteDocumentos
            value={documentosAceitos}
            onChange={setDocumentosAceitos}
            corDestaque={corDestaque}
            tipoUsuario={tipoUsuario}
            isEmpreendedor={formData.is_empreendedor}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || !documentosAceitos.length}
            sx={{
              mt: 2,
              bgcolor: corDestaque,
              color: 'black',
              fontWeight: 'bold',
              py: 1.5,
              '&:hover': { bgcolor: corDestaque, filter: 'brightness(1.1)' }
            }}
          >
            {loading ? 'Finalizando...' : 'Concluir Registro'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}