import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { styled, keyframes } from '@mui/material/styles';

// Ícones
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TopicIcon from '@mui/icons-material/Topic';
import BarChartIcon from '@mui/icons-material/BarChart';
import LockIcon from '@mui/icons-material/Lock';

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
  const { user } = useAuth(); 
  const { generateCourse, isGenerating, statusMessage } = useCourse();

  // Verifica se o usuário é PRO ou ADMIN para desbloquear níveis
  const isPro = user?.role === 'admin' || user?.plan === 'pro';

  const [topic, setTopic] = React.useState('');
  const [level, setLevel] = React.useState('iniciante');
  const [error, setError] = React.useState('');

  const handleGenerate = async (event) => {
    event.preventDefault();
    setError('');

    if (!topic || topic.trim().length < 5) {
      setError('O tema deve ter pelo menos 5 caracteres.');
      return;
    }

    // Se não for PRO, forçamos o nível iniciante no envio, mesmo que o estado mude
    const selectedLevel = isPro ? level : 'iniciante';

    // Chamada ao contexto para gerar o curso
    const result = await generateCourse(topic, selectedLevel);

    if (result.success) {
      // Redireciona para a visualização do curso usando o slug retornado pelo Sanity
      setTimeout(() => {
        navigate(`/dashboard/curso/${result.slug}`);
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
          Transforme qualquer tema em um curso estruturado v1.3 com módulos e avaliações.
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box component="form" onSubmit={handleGenerate} noValidate>
                <Stack spacing={4}>
                  
                  {/* TEMA DO CURSO */}
                  <FormControl fullWidth>
                    <FormLabel sx={{ mb: 1, fontWeight: '600', color: 'text.primary' }}>
                      Tema do curso
                    </FormLabel>
                    <TextField
                      placeholder="Ex: Fundamentos de Node.js, Marketing Digital para Iniciantes..."
                      fullWidth
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={isGenerating}
                      error={!!error}
                      helperText={error}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TopicIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormControl>

                  {/* NÍVEL DO CURSO (COM TRAVA PARA GRÁTIS) */}
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
                      helperText={!isPro ? "Faça upgrade para desbloquear níveis Intermediário e Avançado." : "Escolha a complexidade do conteúdo."}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BarChartIcon fontSize="small" />
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
                  </FormControl>

                  {/* BOTÃO E STATUS */}
                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={isGenerating}
                      startIcon={!isGenerating && <AutoAwesomeIcon />}
                      sx={{ py: 1.8, fontWeight: 'bold' }}
                    >
                      {isGenerating ? 'Processando conteúdo...' : 'Gerar Curso'}
                    </Button>

                    {statusMessage && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 2, 
                          textAlign: 'center', 
                          color: 'primary.main',
                          fontWeight: '500',
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
            <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Informações do seu Plano
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Plano Atual: <strong>{user?.plan?.toUpperCase() || 'GRÁTIS'}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  • {isPro ? 'Gerações ilimitadas e níveis avançados.' : 'Cursos iniciais focados em fundamentos.'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Créditos Disponíveis: <strong>{user?.stats?.credits || 0}</strong>
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Como funciona?
                </Typography>
                <Typography variant="caption" color="text.secondary" component="p">
                  Nossa IA irá estruturar módulos, lições e exercícios baseados no tema escolhido. O processo leva entre 10 a 20 segundos dependendo da complexidade.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* OVERLAY DE LOADING */}
      {isGenerating && (
        <Box sx={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          bgcolor: 'rgba(255, 255, 255, 0.7)', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, fontWeight: '600', color: 'primary.dark' }}>
            Aguarde, estamos ensinando a IA...
          </Typography>
        </Box>
      )}
    </MainContainer>
  );
}