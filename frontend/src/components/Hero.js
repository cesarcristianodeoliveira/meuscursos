import React from 'react';
import { 
  Box, TextField, Button, Typography, Paper, 
  CircularProgress, Zoom, Fade, 
  Toolbar, MenuItem, Select, FormControl,
  Container,
} from '@mui/material';
import { AutoAwesome, Bolt, Psychology, Google } from '@mui/icons-material';
import { useCourse } from '../contexts/CourseContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { blue } from '@mui/material/colors';

function CircularProgressWithLabel({ value }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress 
        variant="determinate" 
        value={value} 
        thickness={4.5} 
        size={80}
        sx={{ color: 'primary.main' }}
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
  // Puxamos os novos estados do contexto atualizado
  const { 
    isGenerating, 
    progress, 
    statusMessage, 
    selectedProvider, 
    setSelectedProvider, 
    providers 
  } = useCourse();
  
  const { resolvedMode } = useAppTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim() && !isGenerating) {
      onGenerate();
    }
  };

  // Helper para ícones dos provedores
  const getProviderIcon = (id) => {
    if (id === 'groq') return <Bolt fontSize="small" sx={{ color: '#f59e0b' }} />;
    if (id === 'openai') return <Psychology fontSize="small" color="primary" />;
    if (id === 'google') return <Google fontSize="small" sx={{ color: '#4285F4' }} />;
    return <AutoAwesome fontSize="small" />;
  };

  return (
    <>
      <Toolbar />
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: 2,
          py: { xs: 2, md: 4 },
          width: '100%',
        }}
      >
        {/* TEXTO DE CHAMADA */}
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: { xs: .75, md: 2 },
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'center',
            width: '100%',
            mb: 1.5
          }}
        >
          <Typography 
            variant="h3" 
            sx={{ 
              lineHeight: 1,
              fontWeight: 600
            }}
          >
            O que você quer
          </Typography>
          <Typography 
            variant="h3"
            sx={{ 
              lineHeight: 1,
              fontWeight: 600,
              background: `linear-gradient(90deg, ${blue[300]} 0%, ${blue[700]} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              display: 'inline-block'
            }}
          >
            aprender?
          </Typography>
        </Box>
        <Box
          sx={{
            mb: 4
          }}
        >
          <Typography 
            align='center' 
            variant='h4' 
            fontWeight={500} 
            color='text.secondary'
            sx={{
              fontSize: { xs: '1.25rem', md: '2.0243rem' }
            }}
          >
            Cursos com Inteligência Artificial
          </Typography>
        </Box>

        {/* ÁREA DO FORMULÁRIO */}
        <Container maxWidth='sm' sx={{ px: [0] }}>
          {!isGenerating ? (
            <Zoom in={!isGenerating}>
              <Paper 
                elevation={0}
                component="form" 
                onSubmit={handleSubmit}
                sx={{ 
                  p: 1, borderRadius: 2,
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: resolvedMode === 'light' ? '0 10px 40px rgba(0,0,0,0.04)' : '0 10px 40px rgba(0,0,0,0.4)',
                  overflow: 'hidden'
                }}
              >
                {/* INPUT PRINCIPAL EM CIMA */}
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="Ex: Arquitetura de Microserviços com Node.js e Docker..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  autoComplete="off"
                  InputProps={{
                    disableUnderline: true,
                    // startAdornment: (
                    //   <InputAdornment position="start" sx={{ pl: 2 }}>
                    //     <School color="primary" />
                    //   </InputAdornment>
                    // ),
                    // sx: { py: 2, px: 1, fontSize: '1.2rem', fontWeight: 500 }
                  }}
                />

                {/* BARRA DE AÇÕES EMBAIXO */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mt: 1, p: 1, 
                  borderTop: '1px solid', borderColor: 'divider',
                  flexWrap: 'wrap', gap: 2
                }}>
                  
                  {/* SELETOR DE INTELIGÊNCIA */}
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <Select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      variant="outlined"
                      sx={{ 
                        borderRadius: 3, 
                        height: 45, 
                        bgcolor: resolvedMode === 'light' ? '#f3f4f6' : '#2d2d2d',
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                      }}
                    >
                      {providers.map((p) => (
                        <MenuItem key={p.id} value={p.id} disabled={!p.enabled}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {getProviderIcon(p.id)}
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1 }}>
                                {p.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {p.quotaLabel}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* BOTÃO GERAR COM CRÉDITOS */}
                  <Button 
                    variant="contained" 
                    type="submit" 
                    disabled={!topic.trim()}
                    startIcon={<AutoAwesome />}
                    endIcon={<Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', opacity: 0.8, bgcolor: 'rgba(0,0,0,0.2)', px: 1, borderRadius: 1, ml: 1 }}>
                      3 <Bolt sx={{ fontSize: 14, ml: 0.5 }} />
                    </Typography>}
                    sx={{ 
                      borderRadius: 3, 
                      px: 3, 
                      height: 48, 
                      fontWeight: 700, 
                      textTransform: 'none',
                      boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)',
                    }}
                  >
                    Gerar Conteúdo
                  </Button>
                </Box>
              </Paper>
            </Zoom>
          ) : (
            <Fade in={isGenerating}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                p: { xs: 4, md: 6 }, 
                borderRadius: 4, 
                bgcolor: resolvedMode === 'light' ? 'rgba(25, 118, 210, 0.02)' : 'rgba(25, 118, 210, 0.05)',
                border: '1px dashed',
                borderColor: 'primary.light'
              }}>
                <CircularProgressWithLabel value={progress} />
                <Typography variant="h5" sx={{ mt: 3, fontWeight: 700, color: 'text.primary', textAlign: 'center' }}>
                  {statusMessage}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, textAlign: 'center', maxWidth: 500 }}>
                  {progress < 100 
                    ? "Nossa IA está estruturando módulos, criando exercícios e gerando material técnico de alta qualidade." 
                    : "Finalizando a indexação e salvando seu novo curso..."}
                </Typography>
              </Box>
            </Fade>
          )}
        </Container>
      </Box>
    </>
  );
};

export default Hero;