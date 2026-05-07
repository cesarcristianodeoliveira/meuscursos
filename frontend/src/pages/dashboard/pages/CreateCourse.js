import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Card, CardContent, CircularProgress, FormControl, 
  FormLabel, InputAdornment, MenuItem, Stack, TextField, 
  Typography, Grid, Alert 
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Ícones
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TopicIcon from '@mui/icons-material/Topic';
import BarChartIcon from '@mui/icons-material/BarChart';
import LockIcon from '@mui/icons-material/Lock';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

// Contextos
import { useCourse } from '../../../contexts/CourseContext';
import { useAuth } from '../../../contexts/AuthContext';

const pulse = keyframes`
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
`;

const MainContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: theme.spacing(2),
}));

const courseLevels = [
  { value: 'iniciante', label: 'Iniciante (Grátis)', isPro: false },
  { value: 'intermediario', label: 'Intermediário', isPro: true },
  { value: 'avancado', label: 'Avançado', isPro: true },
];

export default function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const { generateCourse, isGenerating, statusMessage } = useCourse();

  const [topic, setTopic] = React.useState('');
  const [level, setLevel] = React.useState('iniciante');
  const [error, setError] = React.useState('');

  // Lógica de permissões baseada no Plano
  const isPro = user?.role === 'admin' || user?.plan === 'pro';
  const hasCredits = (user?.credits > 0) || user?.role === 'admin';

  const handleGenerate = async (event) => {
    event.preventDefault();
    setError('');

    if (!topic || topic.trim().length < 5) {
      setError('O tema deve ser mais descritivo (mínimo 5 caracteres).');
      return;
    }

    if (!hasCredits) {
      setError('Você atingiu o limite de geração. Aguarde o reset de 1 hora.');
      return;
    }

    const selectedLevel = isPro ? level : 'iniciante';
    const result = await generateCourse(topic, selectedLevel);

    if (result.success) {
      // Pequeno delay para o usuário ler a mensagem de sucesso
      setTimeout(() => {
        navigate(`/dashboard/curso/${result.slug}`);
      }, 2000);
    } else {
      setError(result.error || 'Ocorreu um erro ao gerar o curso.');
    }
  };

  return (
    <MainContainer>
      <Stack spacing={1} sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' } }}>
        <Typography component="h1" variant="h4" fontWeight="800" sx={{ color: 'text.primary' }}>
          Gerar Novo Curso com IA <AutoAwesomeIcon sx={{ color: 'secondary.main', verticalAlign: 'middle', ml: 1 }} />
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Defina um tema e deixe nossa inteligência artificial criar módulos, aulas e quizzes exclusivos para você.
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 4 }}>
              <Box component="form" onSubmit={handleGenerate} noValidate>
                <Stack spacing={4}>

                  {/* TEMA DO CURSO */}
                  <FormControl fullWidth>
                    <FormLabel sx={{ mb: 1.5, fontWeight: '700', color: 'text.primary', fontSize: '0.9rem' }}>
                      O QUE VOCÊ QUER APRENDER HOJE?
                    </FormLabel>
                    <TextField
                      placeholder="Ex: Python para Data Science, História da Arte, Culinária Vegana..."
                      fullWidth
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={isGenerating}
                      error={!!error}
                      helperText={error}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TopicIcon fontSize="small" color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormControl>

                  {/* NÍVEL DO CURSO */}
                  <FormControl fullWidth>
                    <FormLabel sx={{ mb: 1.5, fontWeight: '700', color: 'text.primary', fontSize: '0.9rem' }}>
                      NÍVEL DE PROFUNDIDADE
                    </FormLabel>
                    <TextField
                      select
                      fullWidth
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      disabled={isGenerating}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BarChartIcon fontSize="small" color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {courseLevels.map((option) => (
                        <MenuItem 
                          key={option.value} 
                          value={option.value}
                          disabled={option.isPro && !isPro}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            {option.label}
                            {option.isPro && !isPro && <LockIcon sx={{ fontSize: 14, ml: 1, opacity: 0.6 }} />}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                    {!isPro && (
                      <Typography variant="caption" color="primary" sx={{ mt: 1.5, fontWeight: '500', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <RocketLaunchIcon sx={{ fontSize: 14 }} /> Faça upgrade para liberar níveis Intermediário e Avançado.
                      </Typography>
                    )}
                  </FormControl>

                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={isGenerating || !hasCredits}
                      sx={{ 
                        py: 2, 
                        fontWeight: '800', 
                        borderRadius: 3,
                        fontSize: '1rem',
                        boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                        '&:hover': { boxShadow: '0 6px 20px rgba(0,118,255,0.23)' }
                      }}
                    >
                      {isGenerating ? 'IA PROCESSANDO...' : hasCredits ? 'CRIAR MEU CURSO AGORA' : 'SEM CRÉDITOS DISPONÍVEIS'}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            {/* SALDO DE CRÉDITOS */}
            <Card variant="outlined" sx={{ 
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
              color: 'white', 
              borderRadius: 4,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <MonetizationOnIcon sx={{ color: '#fbbf24' }} />
                  <Typography variant="subtitle1" fontWeight="700">
                    Sua Cota de Geração
                  </Typography>
                </Stack>
                <Typography variant="h3" fontWeight="900" sx={{ mb: 1 }}>
                  {user?.role === 'admin' ? 'ILIMITADO' : `${user?.credits || 0} Crédito(s)`}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {hasCredits 
                    ? "Você pode gerar um novo curso agora mesmo!" 
                    : "Sua cota gratuita será renovada em breve automaticamente."}
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight="800" gutterBottom color="primary">
                  REGRAS DO SEU PLANO: {user?.plan?.toUpperCase() || 'FREE'}
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    • Geração imediata de currículo completo.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    • {user?.plan === 'pro' ? 'Créditos ampliados.' : '1 crédito renovável por período.'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    • Certificado de conclusão incluso.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {!hasCredits && user?.role !== 'admin' && (
              <Alert severity="warning" variant="filled" sx={{ borderRadius: 4, fontWeight: '600' }}>
                Aguarde o próximo ciclo de créditos para continuar criando!
              </Alert>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* OVERLAY DE CARREGAMENTO */}
      {isGenerating && (
        <Box sx={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          bgcolor: 'rgba(255, 255, 255, 0.9)', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(8px)'
        }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
            <CircularProgress size={80} thickness={3} sx={{ color: 'primary.main' }} />
            <Box sx={{
                top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: `${pulse} 2s infinite ease-in-out`
              }}>
              <AutoAwesomeIcon color="primary" />
            </Box>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: '800', color: 'primary.dark', textAlign: 'center', px: 2 }}>
            {statusMessage || "O Professor IA está redigindo seu material..."}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Organizando módulos, criando aulas e gerando testes.
          </Typography>
        </Box>
      )}
    </MainContainer>
  );
}