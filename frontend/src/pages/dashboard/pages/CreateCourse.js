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

// Contextos
import { useCourse } from '../../../contexts/CourseContext';
import { useAuth } from '../../../contexts/AuthContext';

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
`;

const MainContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
}));

const courseLevels = [
  { value: 'iniciante', label: 'Iniciante (Disponível Grátis)', isPro: false },
  { value: 'intermediario', label: 'Intermediário', isPro: true },
  { value: 'avancado', label: 'Avançado', isPro: true },
];

export default function CreateCourse() {
  const navigate = useNavigate();
  const { user, refreshUser, authLoading } = useAuth(); 
  const { generateCourse, isGenerating, statusMessage } = useCourse();

  const [topic, setTopic] = React.useState('');
  const [level, setLevel] = React.useState('iniciante');
  const [error, setError] = React.useState('');

  // Sincroniza créditos ao montar o componente
  React.useEffect(() => {
    if (!authLoading && user) {
      refreshUser();
    }
  }, [authLoading, user, refreshUser]);

  // Lógica de permissões
  const isPro = user?.role === 'admin' || user?.plan === 'pro';
  const hasCredits = (user?.credits > 0) || user?.role === 'admin';

  const handleGenerate = async (event) => {
    event.preventDefault();
    setError('');

    if (!topic || topic.trim().length < 5) {
      setError('O tema deve ter pelo menos 5 caracteres.');
      return;
    }

    if (!hasCredits) {
      setError('Você não possui créditos suficientes. Aguarde 1 hora ou faça upgrade.');
      return;
    }

    const selectedLevel = isPro ? level : 'iniciante';
    const result = await generateCourse(topic, selectedLevel);

    if (result.success) {
      setTimeout(() => {
        navigate(`/curso/${result.slug}`);
      }, 1500);
    } else {
      setError(result.error);
    }
  };

  return (
    <MainContainer>
      <Stack spacing={1} sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' } }}>
        <Typography component="h1" variant="h4" fontWeight="bold">
          Gerar Novo Curso com IA
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Transforme qualquer tema em um curso estruturado com módulos e avaliações.
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box component="form" onSubmit={handleGenerate} noValidate>
                <Stack spacing={4}>

                  {/* TEMA DO CURSO */}
                  <FormControl fullWidth>
                    <FormLabel sx={{ mb: 1, fontWeight: '600', color: 'text.primary' }}>
                      Tema do curso
                    </FormLabel>
                    <TextField
                      placeholder="Ex: Fundamentos de Node.js, Marketing Digital..."
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
                    <FormLabel sx={{ mb: 1, fontWeight: '600', color: 'text.primary' }}>
                      Nível de profundidade
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
                            {option.isPro && !isPro && <LockIcon sx={{ fontSize: 16, ml: 1, opacity: 0.5 }} />}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                    {!isPro && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        * Níveis avançados requerem conta PRO.
                      </Typography>
                    )}
                  </FormControl>

                  {/* BOTÃO E STATUS */}
                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={isGenerating || !hasCredits}
                      startIcon={!isGenerating && <AutoAwesomeIcon />}
                      sx={{ py: 1.8, fontWeight: 'bold', borderRadius: 2 }}
                    >
                      {isGenerating ? 'A IA está escrevendo...' : hasCredits ? 'Gerar Curso' : 'Sem Créditos'}
                    </Button>

                    {statusMessage && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 2, 
                          textAlign: 'center', 
                          color: 'primary.main',
                          fontWeight: '600',
                          animation: `${pulse} 1.5s infinite ease-in-out`
                        }}
                      >
                        {statusMessage}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            {/* CARD DE CRÉDITOS - Corrigido para user.credits */}
            <Card variant="outlined" sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <MonetizationOnIcon />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Seu Saldo
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight="800">
                  {user?.role === 'admin' ? '∞' : user?.credits || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                  {user?.credits > 0 
                    ? "Você tem crédito disponível para gerar agora!" 
                    : "Aguarde o reset de 1h para ganhar novo crédito."}
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Plano: {user?.plan?.toUpperCase() || 'GRÁTIS'}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="p">
                  • 1 crédito por hora no plano grátis.<br />
                  • Cursos salvos permanentemente na sua biblioteca.<br />
                  • IA treinada para o modelo pedagógico v1.3.
                </Typography>
              </CardContent>
            </Card>

            {!hasCredits && user?.role !== 'admin' && (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>
                Seu próximo crédito será liberado automaticamente em breve (baseado na regra de 1h).
              </Alert>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* OVERLAY DE CARREGAMENTO */}
      {isGenerating && (
        <Box sx={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          bgcolor: 'rgba(255, 255, 255, 0.85)', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(6px)'
        }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, fontWeight: '700', color: 'primary.dark' }}>
            {statusMessage || "Estruturando seu conhecimento..."}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Isso pode levar até 20 segundos.
          </Typography>
        </Box>
      )}
    </MainContainer>
  );
}