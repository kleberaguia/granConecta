import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, Alert, Box,
  ToggleButton, ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, Radio, RadioGroup, FormLabel, Grid, Divider,
  IconButton, InputAdornment, Autocomplete
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../api/api';
import toast from 'react-hot-toast';

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

  // Estados de Controle
  const [tipoUsuario, setTipoUsuario] = useState<'MORADOR' | 'PRESTADOR'>('MORADOR');
  const [categorias, setCategorias] = useState<any[]>([]);
  const [condominios, setCondominios] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [novaEspecialidade, setNovaEspecialidade] = useState('');
  const [novoTipoCategoria, setNovoTipoCategoria] = useState<'servico' | 'loja'>('servico');
  const [isOutraEspecialidade, setIsOutraEspecialidade] = useState(false);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<number | ''>('');
  const [nomeGrupoAutomatico, setNomeGrupoAutomatico] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefone: '',
    password: '',
    categoria: '',
    categoriaid: '',
    is_empreendedor: false,
    origem: 'EXTERNO',
    condominio_id: '',
    bloco: '',
    unidade: '',
    codigo_acesso: '',
    endereco_externo: '',
    bairro: '',
    cidade: '',
    uf: '',
  });

  useEffect(() => {
    api.get('/tipos-combo').then(res => setCategorias(res.data)).catch(err => console.error(err));
    api.get('/condominio').then(res => setCondominios(res.data)).catch(err => console.error(err));

    // ✅ Busca os novos grupos do banco
    api.get('/grupos-home').then(res => setGrupos(res.data)).catch(err => console.error(err));
  }, []);

  const handleTypeChange = (_event: any, newType: 'MORADOR' | 'PRESTADOR') => {
    if (newType) {
      setTipoUsuario(newType);
      setFormData(prev => ({
        ...prev,
        is_empreendedor: false,
        categoriaid: '',
        categoria: '',
        origem: newType === 'MORADOR' ? 'INTERNO' : 'EXTERNO'
      }));
      setIsOutraEspecialidade(false);
      // Reseta o tipo de categoria padrão conforme o usuário
      setNovoTipoCategoria(newType === 'PRESTADOR' ? 'servico' : 'loja');
    }
  };

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCheckChange = (e: any) => {
    const { checked } = e.target;
    setFormData({ ...formData, is_empreendedor: checked });
    if (checked) setNovoTipoCategoria('loja');
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError('');

  //   let servicoIdFinal = formData.categoriaid;
  //   let categoriaNomeFinal = formData.categoria;
  //   let finalIsEmpreendedor = formData.is_empreendedor;

  //   if (tipoUsuario === 'PRESTADOR') {
  //     finalIsEmpreendedor = novoTipoCategoria === 'loja';
  //   }

  //   // ✅ LOGICA DE NOVA CATEGORIA (CARD COM INICIAIS)
  //   if (isOutraEspecialidade && novaEspecialidade) {
  //     try {
  //       // Garantimos que pegamos o texto que o usuário digitou no campo "Nome da Categoria"
  //       const nomeDaEspecialidadeRaw = novaEspecialidade;
  //       const nomeLimpo = sanitizarTexto(nomeDaEspecialidadeRaw);

  //       // 1. Gerar as iniciais da CATEGORIA (Ex: PSICOPEDAGOGIA -> PS)
  //       // Fazemos o split para caso o nome seja composto (Ex: "Marido de Aluguel")
  //       const partes = nomeLimpo.split(' ');
  //       const iniciais = partes.length > 1
  //         ? (partes[0][0] + partes[1][0]).toUpperCase()
  //         : nomeLimpo.substring(0, 2).toUpperCase();

  //       // 2. Gerar uma cor de fundo aleatória para o card da categoria
  //       const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  //       const corCard = cores[Math.floor(Math.random() * cores.length)];

  //       console.log("Cadastrando nova categoria:", nomeLimpo); // Debug para conferir no console

  //       // 3. Criar a CATEGORIA no banco
  //       const resTipo = await api.post('/servico-tipo/find-or-create', {
  //         name: nomeLimpo,          // Nome da Profissão (Ex: PSICOPEDAGOGIA)
  //         tipo: novoTipoCategoria,  // 'servico' ou 'loja'
  //         grupo_id: grupoSelecionadoId,
  //         iniciais: iniciais,       // Iniciais da Profissão
  //         cor_card: corCard,        // Cor do Card
  //         storeId: formData.condominio_id || null
  //       });

  //       // Atualizamos as variáveis para o registro do usuário apontar para esta nova ID
  //       servicoIdFinal = resTipo.data.id;
  //       categoriaNomeFinal = nomeLimpo;

  //     } catch (err) {
  //       console.error("Erro ao criar tipo:", err);
  //       setError("Erro ao processar nova categoria.");
  //       setLoading(false);
  //       return;
  //     }
  //   }

  //   // ✅ LOGICA DE REGISTRO DO USUÁRIO
  //   try {
  //     const payload = {
  //       ...formData,
  //       tipo: tipoUsuario,
  //       is_prestador: tipoUsuario === 'PRESTADOR',
  //       is_empreendedor: finalIsEmpreendedor,

  //       // O usuario é vinculado à categoria, mas a categoria agora tem sua própria identidade
  //       categoriaid: (tipoUsuario === 'PRESTADOR' || finalIsEmpreendedor) ? servicoIdFinal : null,
  //       categoria: (tipoUsuario === 'PRESTADOR' || finalIsEmpreendedor) ? categoriaNomeFinal : null,
  //       origem: (tipoUsuario === 'MORADOR' || formData.origem === 'INTERNO') ? 'INTERNO' : 'EXTERNO',

  //     };


  //     //const response = await api.post('/auth/register', payload);

  //     localStorage.setItem(
  //       'pendingRegister',
  //       JSON.stringify(payload)
  //     );
  //     localStorage.removeItem('pendingRegister');

  //     toast.success("Agora escolha seu plano!");

  //     navigate('/pagamento-orientacoes', {
  //       state: {
  //         isEmpreendedor: finalIsEmpreendedor
  //       }
  //     });

  //     // if (response.data.token) {
  //     //   const token = response.data.token;
  //     //   localStorage.setItem('token', token);
  //     //   api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  //     //   toast.success("Cadastro realizado com sucesso!");

  //     //   setTimeout(() => {
  //     //     navigate(tipoUsuario === 'PRESTADOR' || finalIsEmpreendedor ? '/pagamento-orientacoes' : '/login/MORADOR');
  //     //   }, 150);
  //     // }
  //   } catch (err: any) {
  //     setError(err.response?.data?.error || "Erro ao realizar o cadastro.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    let servicoIdFinal = formData.categoriaid;
    let categoriaNomeFinal = formData.categoria;
    let finalIsEmpreendedor = formData.is_empreendedor;

    if (tipoUsuario === 'PRESTADOR') {
      finalIsEmpreendedor = novoTipoCategoria === 'loja';
    }

    // ✅ LOGICA DE NOVA CATEGORIA (CARD COM INICIAIS)
    if (isOutraEspecialidade && novaEspecialidade) {
      try {

        const nomeDaEspecialidadeRaw = novaEspecialidade;

        const nomeLimpo = sanitizarTexto(nomeDaEspecialidadeRaw);
        const partes = nomeLimpo.split(' ');
        const iniciais = partes.length > 1
          ? (partes[0][0] + partes[1][0]).toUpperCase()
          : nomeLimpo.substring(0, 2).toUpperCase();
        const cores = [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#ec4899'
        ];

        const corCard =
          cores[Math.floor(Math.random() * cores.length)];

        console.log(
          "Cadastrando nova categoria:",
          nomeLimpo
        );

        // 3. Criar a CATEGORIA no banco
        const resTipo = await api.post(
          '/servico-tipo/find-or-create',
          {
            name: nomeLimpo,
            tipo: novoTipoCategoria,
            grupo_id: grupoSelecionadoId,
            iniciais: iniciais,
            cor_card: corCard,
            storeId: formData.condominio_id || null
          }
        );

        // Atualizamos as variáveis para o registro do usuário apontar para esta nova ID
        servicoIdFinal = resTipo.data.id;
        categoriaNomeFinal = nomeLimpo;

      } catch (err) {

        console.error("Erro ao criar tipo:", err);

        setError("Erro ao processar nova categoria.");

        setLoading(false);

        return;
      }
    }

    // ✅ LOGICA DE REGISTRO DO USUÁRIO
    try {

      const payload = {
        ...formData,

        tipo: tipoUsuario,

        is_prestador: tipoUsuario === 'PRESTADOR',

        is_empreendedor: finalIsEmpreendedor,

        // O usuario é vinculado à categoria,
        // mas a categoria agora tem sua própria identidade
        categoriaid:
          (tipoUsuario === 'PRESTADOR' || finalIsEmpreendedor)
            ? servicoIdFinal
            : null,

        categoria:
          (tipoUsuario === 'PRESTADOR' || finalIsEmpreendedor)
            ? categoriaNomeFinal
            : null,

        origem:
          (tipoUsuario === 'MORADOR' ||
            formData.origem === 'INTERNO')
            ? 'INTERNO'
            : 'EXTERNO',
      };

      console.log("SALVANDO CADASTRO TEMPORÁRIO:", payload);

      // ✅ SALVA TODOS OS DADOS DO FORMULÁRIO
      localStorage.setItem(
        'pendingRegister',
        JSON.stringify(payload)
      );

      toast.success("Agora escolha seu plano!");

      // ✅ ENVIA PARA PAGAMENTO
      navigate('/pagamento-orientacoes', {
        state: {
          isEmpreendedor: finalIsEmpreendedor
        }
      });

    } catch (err: any) {

      console.error(err);

      setError(
        err.response?.data?.error ||
        "Erro ao realizar o cadastro."
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
          <TextField fullWidth label="Nome Completo" name="name" onChange={handleChange} margin="dense" required sx={inputStyle(corDestaque)} />
          <TextField fullWidth label="E-mail" name="email" type="email" onChange={handleChange} margin="dense" required sx={inputStyle(corDestaque)} />
          <TextField fullWidth label="WhatsApp" name="telefone" onChange={handleChange} margin="dense" required sx={inputStyle(corDestaque)} />
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

          {/* DADOS DO CONDOMÍNIO */}
          {(tipoUsuario === 'MORADOR' || (tipoUsuario === 'PRESTADOR' && formData.origem === 'INTERNO')) && (
            <Box sx={{ p: 2, bgcolor: '#252525', borderRadius: 2, mb: 2 }}>
              <Typography variant="caption" sx={{ color: corDestaque, fontWeight: 'bold' }}>📍 LOCALIZAÇÃO INTERNA</Typography>
              <FormControl fullWidth margin="dense" required sx={inputStyle(corDestaque)}>
                <InputLabel shrink>Condomínio</InputLabel>
                <Select name="condominio_id" value={formData.condominio_id} onChange={handleChange} notched>
                  {condominios.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
                </Select>
              </FormControl>
              <Grid container spacing={1}>
                <Grid size={6}><TextField fullWidth label="Bloco" name="bloco" onChange={handleChange} sx={inputStyle(corDestaque)} /></Grid>
                <Grid size={6}><TextField fullWidth label="Unid." name="unidade" onChange={handleChange} required sx={inputStyle(corDestaque)} /></Grid>
              </Grid>
              <TextField fullWidth type="password" label="Código Acesso" name="codigo_acesso" onChange={handleChange} margin="dense" required sx={inputStyle(corDestaque)} />
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
                      <TextField fullWidth label="Endereço / Bairro" name="endereco_externo" onChange={handleChange} margin="dense" required sx={inputStyle(corDestaque)} size="small" />
                      <Grid container spacing={1}>
                        <Grid size={8}><TextField fullWidth label="Cidade" name="cidade" onChange={handleChange} required sx={inputStyle(corDestaque)} size="small" /></Grid>
                        <Grid size={4}><TextField fullWidth label="UF" name="uf" onChange={handleChange} required sx={inputStyle(corDestaque)} size="small" /></Grid>
                      </Grid>
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 2, bgcolor: corDestaque, color: 'black', fontWeight: 'bold', py: 1.5,
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