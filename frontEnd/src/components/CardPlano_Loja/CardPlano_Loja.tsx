
import { Box, Button, Card, CardContent, Typography, Divider } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import StarIcon from '@mui/icons-material/Star';
import { TODOS_RECURSOS } from '../constants/planos';

const BRANCO_GELO = '#f8fafc';

interface PlanoData {
  id: string;
  titulo: string;
  precoMensal: number;
  precoAnual: number;
  desc: string;
  vantagens: string[];
  destaque: boolean;
}

interface CardPlanoProps {
  plano: PlanoData;
  frequencia: 'mensal' | 'anual';
  selecionado: boolean;
  onSelect: (id: string) => void;
}

const CardPlano_Plano = ({ plano, frequencia, selecionado, onSelect }: CardPlanoProps) => {
  const mensal = Number(plano.precoMensal || 0);
  const anual = Number(plano.precoAnual || 0);

  // ✅ Exibição: anual mostra equivalente mensal (anual/12)
  const valorExibicao = frequencia === 'anual' ? (anual > 0 ? anual / 12 : 0) : mensal;

  // ✅ Economia anual vs pagar 12x mensal
  const totalNoMensalEm12 = mensal * 12;
  const economiaReais = totalNoMensalEm12 - anual;

  const economiaPct = totalNoMensalEm12 > 0 ? (economiaReais / totalNoMensalEm12) * 100 : 0;

  const temEconomia = frequencia === 'anual' && anual > 0 && mensal > 0 && economiaReais > 0;

  const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  return (
    <Card
      sx={{
        position: 'relative',
        bgcolor: '#181818',
        color: 'white',
        borderRadius: 8,
        overflow: 'hidden',
        transition: '0.4s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': { transform: 'translateY(-10px)' },

        // ✅ Keyframe exclusivo para não conflitar
        '@keyframes pulseEconomia': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.07)' },
          '100%': { transform: 'scale(1)' },
        },

        // ✅ Mantém regra de borda/seleção
        border: selecionado
          ? '3px solid #22c55e'
          : plano.destaque
          ? '2px solid #00d4ff'
          : '1px solid #2a2a2a',

        boxShadow: selecionado ? '0 0 20px rgba(34, 197, 94, 0.4)' : 'none',
      }}
      onClick={() => onSelect(plano.id)}
    >
      {/* ✅ Badges superiores */}
      {(plano.destaque || temEconomia) && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            gap: 1,
            zIndex: 2,
          }}
        >
          {/* Badge destaque */}
          {plano.destaque && (
            <Box
              sx={{
                px: 1.5,
                py: 0.6,
                borderRadius: 999,
                fontWeight: 900,
                fontSize: 12,
                bgcolor: '#00d4ff',
                color: 'black',
                letterSpacing: 0.2,
                display: 'flex',
                alignItems: 'center',
                gap: 0.7,
              }}
            >
              <StarIcon sx={{ fontSize: 14 }} />
              {plano.id === 'PREMIUM' ? 'RECOMENDADO' : 'MAIS POPULAR'}
            </Box>
          )}

          {/* Badge economia (com % bem destacada) */}
          {temEconomia && (
            <Box
              sx={{
                px: 2.2,
                py: 0.95,
                borderRadius: 999,
                bgcolor: '#22c55e',
                color: 'black',

                // Destaque visual
                boxShadow: '0 0 18px rgba(34,197,94,0.95)',
                border: '1px solid rgba(255,255,255,0.25)',

                // Pulse suave
                animation: 'pulseEconomia 1.6s infinite',

                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 900,
                    letterSpacing: 0.45,
                    opacity: 0.95,
                    whiteSpace: 'nowrap',
                  }}
                >
                  🔥 ECONOMIZE
                </Typography>

                {/* ✅ % vira uma “bolha” com contraste (destaque real) */}
                <Typography
                  sx={{
                    fontSize: 22,
                    fontWeight: 1000,
                    lineHeight: 1,
                    px: 1.1,
                    py: 0.25,
                    borderRadius: 999,
                    bgcolor: 'rgba(255,255,255,0.92)',
                    color: '#0b0b0b',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                    border: '1px solid rgba(0,0,0,0.12)',
                    textShadow: '0 1px 0 rgba(255,255,255,0.35)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {Math.round(economiaPct)}%
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      <CardContent sx={{ p: 5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h4" fontWeight="900" textAlign="center">
          {plano.titulo}
        </Typography>

        {/* Preço */}
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography
            variant="h3"
            fontWeight="900"
            color={selecionado ? '#22c55e' : plano.destaque ? '#00d4ff' : 'inherit'}
            sx={{ lineHeight: 1.05 }}
          >
            {brl(valorExibicao)}
            <Typography component="span" variant="body2" sx={{ color: '#666', ml: 0.8 }}>
              /mês
            </Typography>
          </Typography>

          {/* Label anual */}
          {frequencia === 'anual' && (
            <Typography variant="caption" sx={{ color: '#888' }}>
              no plano anual
            </Typography>
          )}

          {/* Referência mensal riscada */}
          {frequencia === 'anual' && mensal > 0 && (
            <Typography sx={{ mt: 1, fontSize: 13, color: '#9a9a9a' }}>
              De{' '}
              <span style={{ textDecoration: 'line-through' }}>{brl(mensal)}/mês</span> pagando
              mensal
            </Typography>
          )}

          {/* Valor anual + economia */}
          {frequencia === 'anual' && anual > 0 && (
            <Typography sx={{ mt: 1, fontSize: 13, color: '#bdbdbd' }}>
              <span style={{ color: 'white', fontWeight: 900 }}>{brl(anual)}/ano</span>
              {temEconomia && (
                <>
                  {' '}
                  • economize{' '}
                  <span style={{ color: '#22c55e', fontWeight: 900 }}>
                    {brl(economiaReais)}
                  </span>{' '}
                  ({Math.round(economiaPct)}%)
                </>
              )}
            </Typography>
          )}

          {/* Dica no mensal */}
          {frequencia === 'mensal' && anual > 0 && mensal > 0 && economiaReais > 0 && (
            <Typography sx={{ mt: 1, fontSize: 12.5, color: '#9a9a9a' }}>
              No anual você economiza {brl(economiaReais)} ({Math.round(economiaPct)}%)
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 4, bgcolor: '#2a2a2a' }} />

        {/* Recursos */}
        <Box sx={{ flexGrow: 1 }}>
          {TODOS_RECURSOS.map((item) => {
            const possui = plano.vantagens.includes(item.key);
            return (
              <Typography
                key={item.key}
                variant="body2"
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  color: possui ? BRANCO_GELO : '#888888',
                }}
              >
                {possui ? (
                  <CheckCircleOutlineIcon sx={{ fontSize: 18, mr: 1.5, color: '#22c55e' }} />
                ) : (
                  <CancelOutlinedIcon sx={{ fontSize: 18, mr: 1.5, color: '#ef4444' }} />
                )}
                {item.texto}
              </Typography>
            );
          })}
        </Box>

        {/* Botão */}
        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 4,
            py: 2,
            borderRadius: 4,
            fontWeight: '900',
            bgcolor: selecionado ? '#22c55e' : plano.destaque ? '#00d4ff' : BRANCO_GELO,
            color: 'black',
            '&:hover': { bgcolor: selecionado ? '#16a34a' : '#fff' },
          }}
        >
          {selecionado ? 'SELECIONADO' : 'SELECIONAR PLANO'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CardPlano_Plano;
