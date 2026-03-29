import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, TextField, Typography, Paper, 
  CircularProgress, Zoom, Fade, 
  MenuItem, Select, FormControl,
  Container,
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { Send, ContentCopy, Clear, WarningAmber, Lock } from '@mui/icons-material';
import { useCourse } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { blue, grey, red, green, orange } from '@mui/material/colors';
import prompts from '../utils/prompts';

// Componente de Progresso Circular com Label Central
function CircularProgressWithLabel({ value }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress 
        variant="determinate" 
        value={value} 
        thickness={4.5} 
        size={90}
        sx={{ 
          color: 'primary.main',
          filter: 'drop-shadow(0 0 8px rgba(25, 118, 210, 0.3))'
        }}
      />
      <Box
        sx={{
          top: 0, left: 0, bottom: 0, right: 0,
          position: 'absolute',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Typography variant="h6" component="div" color="text.primary" fontWeight="bold">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

const Hero = ({ topic, setTopic, onGenerate }) => {
  const [randomPlaceholder, setRandomPlaceholder] = useState('');
  const { user, loading: authLoading } = useAuth(); 

  const { 
    isGenerating, 
    progress, 
    statusMessage, 
    selectedProvider, 
    setSelectedProvider, 
    providers 
  } = useCourse();
  
  const { resolvedMode } = useAppTheme();

  // --- LÓGICA DE CRÉDITOS E TRAVAS ---
  // Bloqueia se o usuário estiver logado, não for admin e tiver 0 créditos
  const hasNoCredits = user && user.role !== 'admin' && (user.credits <= 0 || !user.credits);
  
  const currentProvider = providers.find(p => p.id === selectedProvider) || providers[0];
  const isChecking = currentProvider?.quotaLabel?.toLowerCase().includes('verificando');
  const isProviderDisabled = !currentProvider?.enabled && !isChecking;

  // Atualização dinâmica do placeholder (sugestões)
  const updatePlaceholder = useCallback(() => {
    if (prompts && prompts.length > 0) {
      const randomIndex = Math.floor(Math.random() * prompts.length);
      setRandomPlaceholder(prompts[randomIndex]);
    }
  }, []);

  useEffect(() => {
    if (!isGenerating && !topic) {
      updatePlaceholder();
      const interval = setInterval(() => {
        if (!topic) updatePlaceholder();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isGenerating, topic, updatePlaceholder]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authLoading || isGenerating) return;

    if (topic.trim() && !isProviderDisabled && !isChecking && !hasNoCredits) {
      onGenerate(); 
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center', 
        width: '100%',
        minHeight: '75vh',
        py: { xs: 6, md: 10 }
      }}
    >
      <Container maxWidth="md">
        {/* Cabeçalho */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800, 
              fontSize: { xs: '2.5rem', md: '4rem' }, 
              letterSpacing: '-0.03em',
              mb: 1
            }}
          >
            O que vamos {' '}
            <Box 
              component="span" 
              sx={{ 
                background: `linear-gradient(135deg, ${blue[400]} 0%, ${blue[800]} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              aprender?
            </Box>
          </Typography>
          <Typography 
            variant='h6' 
            color='text.secondary'
            sx={{ fontWeight: 400, opacity: 0.8, maxWidth: 600, mx: 'auto' }}
          >
            Transforme qualquer tópico em um curso estruturado com lições e exercícios em segundos.
          </Typography>
        </Box>

        <Container maxWidth='sm' sx={{ p: 0 }}>
          {!isGenerating ? (
            <Zoom in={!isGenerating}>
              <Paper 
                elevation={0}
                component="form" 
                onSubmit={handleSubmit}
                sx={{ 
                  border: '1px solid', 
                  borderColor: hasNoCredits ? orange[300] : (isProviderDisabled ? red[200] : 'divider'),
                  bgcolor: 'background.paper',
                  boxShadow: resolvedMode === 'light' 
                    ? '0 30px 60px rgba(0,0,0, 0.08)' 
                    : '0 30px 60px rgba(0,0,0, 0.4)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, border-color 0.3s ease',
                  '&:focus-within': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {/* Input Principal */}
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder={hasNoCredits ? "Limite de créditos atingido..." : randomPlaceholder}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  autoComplete="off"
                  disabled={hasNoCredits || authLoading}
                  InputProps={{
                    disableUnderline: true,
                    sx: { p: 3, fontSize: { xs: '1.1rem', md: '1.25rem' }, fontWeight: 500 },
                    endAdornment: (
                      <InputAdornment position="end">
                        {topic ? (
                          <IconButton onClick={() => setTopic('')} size="small">
                            <Clear />
                          </IconButton>
                        ) : (
                          <Tooltip title={hasNoCredits ? "Sem créditos" : "Usar exemplo"}>
                            <span>
                              <IconButton 
                                onClick={() => setTopic(randomPlaceholder)} 
                                color="primary" 
                                disabled={hasNoCredits || authLoading}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </InputAdornment>
                    )
                  }}
                />

                {/* Barra de Ações Inferior */}
                <Box sx={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderTop: '1px solid', borderColor: 'divider',
                  p: 2, bgcolor: resolvedMode === 'light' ? grey[50] : 'rgba(255,255,255,0.03)'
                }}>
                  
                  {/* Seletor de Modelo */}
                  <FormControl size="small">
                    <Select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      disabled={hasNoCredits || authLoading}
                      variant="outlined"
                      sx={{ 
                        minWidth: 150, borderRadius: 2, bgcolor: 'background.paper',
                        '& .MuiSelect-select': { py: 1, display: 'flex', alignItems: 'center' }
                      }}
                    >
                      {providers.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                              {p.name}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: p.enabled ? green[600] : (p.quotaLabel?.includes('Verificando') ? blue[500] : red[400]),
                                fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase'
                              }}
                            >
                              {p.quotaLabel}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Botão Gerar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {(isProviderDisabled || hasNoCredits) && (
                      <Tooltip title={hasNoCredits ? "Você atingiu o limite de 3 cursos/dia" : "Este provedor está fora do ar"}>
                        <WarningAmber sx={{ color: hasNoCredits ? orange[500] : red[500] }} />
                      </Tooltip>
                    )}
                    
                    <IconButton 
                      color='secondary'
                      type="submit" 
                      disabled={!topic.trim() || isProviderDisabled || isChecking || hasNoCredits || authLoading}
                      sx={{ 
                        width: 52, height: 52,
                        bgcolor: (topic.trim() && !isProviderDisabled && !hasNoCredits) ? 'secondary.main' : 'action.disabledBackground',
                        color: 'white',
                        '&:hover': { bgcolor: 'secondary.dark' },
                        transition: 'all 0.2s'
                      }}
                    >
                      {authLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : hasNoCredits ? (
                        <Lock sx={{ fontSize: 20 }} />
                      ) : (
                        <Send />
                      )}
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            </Zoom>
          ) : (
            /* Estado de Carregamento (Streaming) */
            <Fade in={isGenerating}>
              <Box sx={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', 
                p: { xs: 4, md: 8 }, borderRadius: 6, 
                bgcolor: 'background.paper',
                border: '1px solid', borderColor: 'divider', textAlign: 'center',
                boxShadow: '0 40px 100px rgba(0,0,0,0.12)'
              }}>
                <CircularProgressWithLabel value={progress} />
                <Typography variant="h5" sx={{ mt: 4, fontWeight: 800 }}>
                  {statusMessage}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 400 }}>
                  {progress < 40 && "Estruturando módulos e lições..."}
                  {progress >= 40 && progress < 80 && "Gerando conteúdo e exercícios práticos..."}
                  {progress >= 80 && "Finalizando e salvando seu curso..."}
                </Typography>
              </Box>
            </Fade>
          )}
        </Container>
      </Container>
    </Box>
  );
};

export default Hero;