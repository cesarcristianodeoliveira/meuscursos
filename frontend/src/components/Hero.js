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

function CircularProgressWithLabel({ value }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress 
        variant="determinate" 
        value={value} 
        thickness={4.5} 
        size={80}
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

  // --- LÓGICA DE CRÉDITOS REVISADA ---
  // 1. Se estiver carregando o usuário, bloqueamos por segurança.
  // 2. Se NÃO houver usuário (visitante), permitimos testar (ou você pode decidir bloquear).
  // 3. Se houver usuário, apenas o admin ignora a trava.
  const hasNoCredits = user 
    ? (user.role !== 'admin' && (user.credits <= 0 || !user.credits)) 
    : false; // Se for null (visitante), libera para teste inicial
  
  const currentProvider = providers.find(p => p.id === selectedProvider) || providers[0];
  const isChecking = currentProvider?.quotaLabel?.includes('Verificando') || currentProvider?.quotaLabel?.includes('Consultando');
  const isProviderDisabled = !currentProvider?.enabled && !isChecking;

  const updatePlaceholder = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setRandomPlaceholder(prompts[randomIndex]);
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
    // Impedir submit se estiver carregando auth
    if (authLoading) return;

    if (topic.trim() && !isGenerating && !isProviderDisabled && !isChecking && !hasNoCredits) {
      onGenerate(); 
    }
  };

  return (
    <Box 
      sx={{ 
        alignItems: 'center', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        width: '100%',
        minHeight: '80vh' 
      }}
    >
      <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', width: '100%', px: 2, py: 4 }}>
        
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, display: 'inline-flex', mr: 1.5, fontSize: { xs: '2.2rem', md: '3.5rem' }, letterSpacing: '-0.02em' }}>
            O que vamos
          </Typography>
          <Typography 
            variant="h3"
            sx={{ 
              fontWeight: 800,
              background: `linear-gradient(135deg, ${blue[300]} 0%, ${blue[700]} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              display: 'inline-flex',
              fontSize: { xs: '2.2rem', md: '3.5rem' },
              letterSpacing: '-0.02em'
            }}
          >
            aprender?
          </Typography>
        </Box>

        <Typography 
          align='center' 
          variant='h5' 
          color='text.secondary'
          sx={{ mb: 4, fontSize: { xs: '1.1rem', md: '1.5rem' }, fontWeight: 400, opacity: 0.8 }}
        >
          Gere cursos completos com Inteligência Artificial.
        </Typography>

        <Container maxWidth='sm' sx={{ px: { xs: 0, sm: 2 } }}>
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
                  boxShadow: resolvedMode === 'light' ? '0 20px 60px rgba(0,0,0, 0.05)' : '0 20px 60px rgba(0,0,0, 0.3)',
                  overflow: 'hidden',
                  borderRadius: 3,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder={hasNoCredits ? "Renovação de créditos em 24h..." : randomPlaceholder}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  autoComplete="off"
                  disabled={isGenerating || hasNoCredits || authLoading}
                  InputProps={{
                    disableUnderline: true,
                    sx: { p: 2.5, fontSize: { xs: '1rem', md: '1.2rem' }, pr: 9 },
                    endAdornment: (
                      <InputAdornment position="end" sx={{ position: 'absolute', right: 16 }}>
                        {topic ? (
                          <IconButton onClick={() => setTopic('')} size="small" disabled={isGenerating}>
                            <Clear />
                          </IconButton>
                        ) : (
                          <Tooltip placement='top' title={hasNoCredits ? "Sem créditos" : "Usar sugestão"}>
                            <span>
                              <IconButton 
                                onClick={() => setTopic(randomPlaceholder)} 
                                color="primary" 
                                disabled={hasNoCredits || isGenerating || authLoading}
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

                <Box sx={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderTop: '1px solid', borderColor: 'divider',
                  p: 2, bgcolor: resolvedMode === 'light' ? grey[50] : 'rgba(255,255,255,0.02)'
                }}>
                  
                  <FormControl size="small">
                    <Select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      variant="outlined"
                      disabled={hasNoCredits || isGenerating || authLoading}
                      sx={{ 
                        minWidth: 140, borderRadius: 2, bgcolor: 'background.paper',
                        '& .MuiSelect-select': { py: 1, display: 'flex', alignItems: 'center' }
                      }}
                    >
                      {providers.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1 }}>
                              {p.name}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: p.enabled ? green[600] : (p.quotaLabel?.includes('Verificando') ? blue[500] : red[400]),
                                fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', mt: 0.5
                              }}
                            >
                              {p.quotaLabel}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {(isProviderDisabled || hasNoCredits) && (
                      <Tooltip placement='top' title={hasNoCredits ? "Limite diário atingido (3 cursos)." : "Provedor indisponível"}>
                        <WarningAmber sx={{ color: hasNoCredits ? orange[500] : red[500] }} />
                      </Tooltip>
                    )}
                    
                    <IconButton 
                      color='secondary'
                      type="submit" 
                      disabled={!topic.trim() || isGenerating || isProviderDisabled || isChecking || hasNoCredits || authLoading}
                      sx={{ 
                        width: 48, height: 48,
                        bgcolor: (topic.trim() && !isProviderDisabled && !hasNoCredits) ? 'secondary.main' : 'action.disabledBackground',
                        color: (topic.trim() && !isProviderDisabled && !hasNoCredits) ? 'white' : 'action.disabled',
                        '&:hover': { bgcolor: 'secondary.dark' },
                        boxShadow: (topic.trim() && !hasNoCredits) ? '0 4px 14px rgba(156, 39, 176, 0.39)' : 'none'
                      }}
                    >
                      {isChecking || authLoading ? (
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
            <Fade in={isGenerating}>
              <Box sx={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', 
                p: { xs: 4, md: 6 }, borderRadius: 6, 
                bgcolor: 'background.paper',
                border: '1px solid', borderColor: 'divider', textAlign: 'center',
                boxShadow: '0 30px 90px rgba(0,0,0,0.1)'
              }}>
                <CircularProgressWithLabel value={progress} />
                <Typography variant="h5" sx={{ mt: 4, fontWeight: 800 }}>
                  {statusMessage}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 420 }}>
                  {progress < 90 
                    ? "Nossa IA está estruturando o conteúdo técnico e gerando exercícios para você." 
                    : "Quase lá! Estamos salvando as informações e preparando seu curso."}
                </Typography>
              </Box>
            </Fade>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Hero;