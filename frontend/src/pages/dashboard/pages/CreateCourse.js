import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Card, CardContent, CircularProgress, FormControl, 
  FormLabel, InputAdornment, MenuItem, Stack, TextField, 
  Typography, Grid
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Ícones
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TopicIcon from '@mui/icons-material/Topic';
import BarChartIcon from '@mui/icons-material/BarChart';
import LockIcon from '@mui/icons-material/Lock';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

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
  const [success, setSuccess] = React.useState(false);

  // Lógica de permissões baseada no Plano
  const isPro = user?.role === 'admin' || user?.plan === 'pro';
  
  // Verifica se tem créditos ou se é elegível para geração (Admin ou primeira vez)
  const canGenerate = (user?.credits > 0) || user?.role === 'admin' || !user?.lastGenerationAt;

  const handleGenerate = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(false);

    if (!canGenerate) {
      setError('Você não possui créditos suficientes para gerar um novo curso.');
      return;
    }

    if (!topic || topic.trim().length < 5) {
      setError('Descreva um pouco mais o tema (mínimo 5 caracteres).');
      return;
    }

    const selectedLevel = isPro ? level : 'iniciante';
    const result = await generateCourse(topic, selectedLevel);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate(`/dashboard/curso/${result.slug}`);
      }, 2500);
    } else {
      setError(result.error || 'Ocorreu um erro ao gerar o curso. Tente um tema diferente.');
    }
  };

  return (
    <MainContainer>
      <Stack spacing={1} sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' } }}>
        <Typography component="h1" variant="h4" fontWeight="800" sx={{ color: 'text.primary' }}>
          Gerar Novo Curso com IA <AutoAwesomeIcon sx={{ color: 'secondary.main', verticalAlign: 'middle', ml: 1 }} />
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Nossa IA estruturará módulos, lições e avaliações personalizadas para o seu objetivo.
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
                      O QUE VOCÊ DESEJA ESTUDAR?
                    </FormLabel>
                    <TextField
                      placeholder="Ex: Fundamentos de React, Gestão de Tempo, Fotografia com iPhone..."
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
                      NÍVEL DO CONTEÚDO
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
                            <Typography variant="body2" fontWeight={option.value === level ? '700' : '400'}>
                              {option.label}
                            </Typography>
                            {option.isPro && !isPro && <LockIcon sx={{ fontSize: 14, ml: 1, opacity: 0.6 }} />}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                    {!isPro && (
                      <Typography variant="caption" color="primary" sx={{ mt: 1.5, fontWeight: '600', display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
                        <RocketLaunchIcon sx={{ fontSize: 14 }} /> Liberar níveis avançados com Plano PRO.
                      </Typography>
                    )}
                  </FormControl>

                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={isGenerating || !canGenerate}
                      sx={{ 
                        py: 2, 
                        fontWeight: '800', 
                        borderRadius: 3,
                        fontSize: '1rem',
                        boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                      }}
                    >
                      {isGenerating 
                        ? 'PROCESSANDO...' 
                        : !canGenerate 
                          ? 'SEM CRÉDITOS' 
                          : 'CRIAR CURSO AGORA'}
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
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
              color: 'white', 
              borderRadius: 4,
            }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <MonetizationOnIcon sx={{ color: '#fbbf24' }} />
                  <Typography variant="subtitle1" fontWeight="700">
                    Seu Saldo
                  </Typography>
                </Stack>
                <Typography variant="h3" fontWeight="900" sx={{ mb: 1 }}>
                  {user?.role === 'admin' ? 'ILIMITADO' : `${user?.credits || 0}`}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {user?.credits > 0 
                    ? "Créditos prontos para uso." 
                    : "Você usará sua cota gratuita de 1 hora."}
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight="800" gutterBottom color="text.primary">
                  REGRAS DE GERAÇÃO
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    • Conteúdo original gerado em tempo real.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Imagens buscadas automaticamente no Pixabay.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Quizzes e Exame Final com certificado.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* OVERLAY DE CARREGAMENTO */}
      {(isGenerating || success) && (
        <Box sx={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          bgcolor: 'rgba(255, 255, 255, 0.95)', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(10px)'
        }}>
          {success ? (
             <Stack alignItems="center" spacing={2}>
                <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main' }} />
                <Typography variant="h5" fontWeight="800" color="success.main">CURSO GERADO COM SUCESSO!</Typography>
                <Typography variant="body1">Redirecionando para sua sala de aula...</Typography>
             </Stack>
          ) : (
            <>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                <CircularProgress size={80} thickness={4} sx={{ color: 'primary.main' }} />
                <Box sx={{
                    top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: `${pulse} 1.5s infinite ease-in-out`
                  }}>
                  <AutoAwesomeIcon color="primary" />
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: '800', color: 'primary.dark', textAlign: 'center', mb: 1 }}>
                {statusMessage || "O Professor IA está redigindo seu material..."}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
                Isso pode levar até 30 segundos devido à complexidade do tema.
              </Typography>
            </>
          )}
        </Box>
      )}
    </MainContainer>
  );
}