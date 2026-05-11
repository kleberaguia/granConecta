import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

import api from '../../api/api';
import toast from 'react-hot-toast';

const BLUE = "#120a8f";

export default function PaymentInstructions() {
  const location = useLocation();

  const [loading, setLoading] = useState(false);

  const isEmpreendedor =
    location.state?.isEmpreendedor || false;

  const todosRecursos = [
    { key: 'visibilidade', texto: 'Nome e Telefone visíveis' },
    { key: 'categoria', texto: 'Aparece em 1 categoria' },
    { key: 'perfil', texto: 'Perfil padrão' },
    { key: 'fotos', texto: 'Fotos dos serviços/produtos' },
    { key: 'landing', texto: 'Página customizada' },
    { key: 'desc', texto: 'Descrição completa' },
    { key: 'topo', texto: 'Topo dos resultados' },
    { key: 'selo', texto: 'Selo de Verificado' },
    { key: 'suporte', texto: 'Suporte Prioritário' },
    { key: 'stats', texto: 'Estatísticas de acesso' },
  ];

  const planosBase = [
    {
      id: 'BASICO',
      titulo: 'Básico',
      precoMensal: 1.50,
      precoAnual: 1.00,
      vantagens: [
        'visibilidade',
        'categoria',
        'perfil'
      ],
      destaque: false
    },
    {
      id: 'INTERMEDIARIO',
      titulo: 'Profissional',
      precoMensal: 2.50,
      precoAnual: 1.00,
      vantagens: [
        'visibilidade',
        'categoria',
        'perfil',
        'fotos',
        'landing',
        'desc',
        'selo'
      ],
      destaque: true
    },
    {
      id: 'PREMIUM',
      titulo: 'Premium',
      precoMensal: 3.50,
      precoAnual: 1.00,
      vantagens: [
        'visibilidade',
        'categoria',
        'perfil',
        'fotos',
        'landing',
        'desc',
        'topo',
        'selo',
        'suporte',
        'stats'
      ],
      destaque: false
    }
  ];

  const brl = (v: number) =>
    `R$ ${v.toFixed(2).replace(".", ",")}`;

  // const handleAssinarAgora = async (plano: any) => {
  //   setLoading(true);

  //   try {

  //     // =========================================
  //     // PEGA DADOS DO CADASTRO TEMPORÁRIO
  //     // =========================================
  //     const pendingRegister =
  //       localStorage.getItem('pendingRegister');

  //     if (!pendingRegister) {
  //       toast.error('Dados do cadastro não encontrados');
  //       setLoading(false);
  //       return;
  //     }

  //     // =========================================
  //     // CONVERTE PAYLOAD
  //     // =========================================
  //     const payload = JSON.parse(pendingRegister);

  //     // =========================================
  //     // ADICIONA PLANO ESCOLHIDO
  //     // =========================================
  //     payload.plano = plano.id;

  //     // =========================================
  //     // AGORA SIM CRIA O USUÁRIO
  //     // =========================================
  //     const responseRegister = await api.post(
  //       '/auth/register',
  //       payload
  //     );

  //     // =========================================
  //     // REMOVE SOMENTE APÓS SUCESSO
  //     // =========================================
  //     localStorage.removeItem('pendingRegister');

  //     // =========================================
  //     // TOKEN
  //     // =========================================
  //     const token =
  //       responseRegister.data?.token;

  //     if (!token) {
  //       toast.error('Erro ao gerar sessão');
  //       return;
  //     }

  //     // =========================================
  //     // SALVA TOKEN
  //     // =========================================
  //     localStorage.setItem('token', token);

  //     api.defaults.headers.common[
  //       'Authorization'
  //     ] = `Bearer ${token}`;

  //     // =========================================
  //     // DECODE TOKEN
  //     // =========================================
  //     const payloadToken = JSON.parse(
  //       window.atob(token.split('.')[1])
  //     );

  //     const userId =
  //       payloadToken.usuarioId ||
  //       payloadToken.id;

  //     // =========================================
  //     // DEFINE TIPO
  //     // =========================================
  //     const tipoUsuario = isEmpreendedor
  //       ? 'EMPREENDEDOR'
  //       : 'PRESTADOR';

  //     // =========================================
  //     // PAYLOAD CHECKOUT
  //     // =========================================
  //     const checkoutPayload = {
  //       usuarioId: userId,
  //       itens: [
  //         {
  //           plano: plano.id,
  //           tipo: tipoUsuario,
  //           valor: plano.precoAnual,
  //           frequencia: 'ANUAL'
  //         }
  //       ]
  //     };

  //     const responseCheckout =
  //       await api.post(
  //         '/create-session',
  //         checkoutPayload
  //       );

  //       // aqui pagamento é redirecionado
  //     if (responseCheckout.data.checkoutUrl) {
  //       window.location.href =
  //         responseCheckout.data.checkoutUrl;
  //     }

  //   } catch (err: any) {
  //     console.error(err);

  //     toast.error(
  //       err.response?.data?.error ||
  //       'Erro ao processar pagamento.'
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleAssinarAgora = async (plano: any) => {

    setLoading(true);

    try {

      const existingToken =
        localStorage.getItem('token');
      let userId = null;
      const tipoUsuario = isEmpreendedor
        ? 'EMPREENDEDOR'
        : 'PRESTADOR';


      if (existingToken) {

        api.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${existingToken}`;

        const payloadToken = JSON.parse(
          window.atob(existingToken.split('.')[1])
        );

        userId =
          payloadToken.usuarioId ||
          payloadToken.id;

        console.log(
          '✅ Usuário já logado, reutilizando sessão'
        );

      } else {
        const pendingRegister =
          localStorage.getItem('pendingRegister');

        if (!pendingRegister) {

          toast.error(
            'Dados do cadastro não encontrados'
          );

          setLoading(false);

          return;
        }
        const payload =
          JSON.parse(pendingRegister);
        payload.plano = plano.id;

        const responseRegister =
          await api.post(
            '/auth/register',
            payload
          );

        localStorage.removeItem(
          'pendingRegister'
        );

        const token =
          responseRegister.data?.token;
        if (!token) {

          toast.error(
            'Erro ao gerar sessão'
          );

          return;
        }
        localStorage.setItem(
          'token',
          token
        );
        api.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${token}`;
        const payloadToken = JSON.parse(
          window.atob(token.split('.')[1])
        );
        userId =
          payloadToken.usuarioId ||
          payloadToken.id;
        console.log(
          '✅ Novo usuário criado com sucesso'
        );
      }

      if (!userId) {

        toast.error(
          'Usuário não identificado'
        );

        return;
      }

      const checkoutPayload = {
        usuarioId: userId,

        itens: [
          {
            plano: plano.id,
            tipo: tipoUsuario,
            valor: plano.precoAnual,
            frequencia: 'ANUAL'
          }
        ]
      };

      const responseCheckout =
        await api.post(
          '/create-session',
          checkoutPayload
        );

      if (
        responseCheckout.data.checkoutUrl
      ) {

        if (responseCheckout.data.reused) {

          toast(
            'Retomando pagamento pendente...',
            {
              icon: '💳'
            }
          );

        } else {

          toast.success(
            'Checkout criado com sucesso!'
          );
        }

        window.location.href =
          responseCheckout.data.checkoutUrl;

        return;
      }

      toast.error(
        'Não foi possível iniciar pagamento'
      );

    } catch (err: any) {

      console.error(err);

      toast.error(
        err.response?.data?.error ||
        'Erro ao processar pagamento.'
      );

    } finally {

      setLoading(false);
    }
  };
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" mb={6}>
        <Typography
          variant="h3"
          color={BLUE}
          fontWeight="900"
          gutterBottom
        >
          Selecione seu Plano
        </Typography>
      </Box>

      <Grid
        container
        spacing={4}
        justifyContent="center"
      >
        {planosBase.map((p) => {

          const economiaPct = Math.round(
            (
              (
                (p.precoMensal * 12) -
                p.precoAnual
              ) /
              (p.precoMensal * 12)
            ) * 100
          );

          return (
            <Grid
              size={{ xs: 12, md: 4 }}
              key={p.id}
            >
              <Card
                sx={{
                  position: "relative",
                  bgcolor: "#181818",
                  color: "white",
                  borderRadius: 8,
                  border: p.destaque
                    ? "2px solid #00d4ff"
                    : "1px solid #2a2a2a",
                  transition: '0.3s',

                  '&:hover': {
                    transform: 'translateY(-10px)'
                  }
                }}
              >

                {economiaPct > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      bgcolor: "#22c55e",
                      color: "black",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 999,
                      fontWeight: 900,
                      fontSize: 12
                    }}
                  >
                    -{economiaPct}%
                  </Box>
                )}

                <CardContent sx={{ p: 5 }}>

                  <Typography
                    variant="h4"
                    fontWeight="900"
                    textAlign="center"
                  >
                    {p.titulo}
                  </Typography>

                  <Box
                    sx={{
                      textAlign: "center",
                      my: 4
                    }}
                  >
                    <Typography
                      variant="h3"
                      fontWeight="900"
                      color={
                        p.destaque
                          ? "#00d4ff"
                          : "inherit"
                      }
                    >
                      {brl(p.precoAnual / 12)}

                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          color: "#666",
                          ml: 0.8
                        }}
                      >
                        /mês
                      </Typography>
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        color: "#888",
                        display: 'block'
                      }}
                    >
                      Pagamento anual único:
                      {' '}
                      {brl(p.precoAnual)}
                    </Typography>
                  </Box>

                  <Divider
                    sx={{
                      mb: 4,
                      bgcolor: "#2a2a2a"
                    }}
                  />

                  <Box sx={{ minHeight: 320 }}>
                    {todosRecursos.map((item) => (

                      <Typography
                        key={item.key}
                        variant="body2"
                        sx={{
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          color: p.vantagens.includes(item.key)
                            ? "#fff"
                            : "#444"
                        }}
                      >

                        {p.vantagens.includes(item.key)
                          ? (
                            <CheckCircleOutlineIcon
                              sx={{
                                fontSize: 18,
                                mr: 1,
                                color: "#22c55e"
                              }}
                            />
                          )
                          : (
                            <CancelOutlinedIcon
                              sx={{
                                fontSize: 18,
                                mr: 1,
                                color: "#666"
                              }}
                            />
                          )
                        }

                        {item.texto}

                      </Typography>
                    ))}
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    onClick={() => handleAssinarAgora(p)}
                    sx={{
                      mt: 4,
                      py: 2,
                      borderRadius: 4,
                      fontWeight: "900",
                      bgcolor: p.destaque
                        ? "#00d4ff"
                        : "#fff",
                      color: "black"
                    }}
                  >
                    {loading
                      ? 'PROCESSANDO...'
                      : 'ATIVAR AGORA'
                    }
                  </Button>

                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}