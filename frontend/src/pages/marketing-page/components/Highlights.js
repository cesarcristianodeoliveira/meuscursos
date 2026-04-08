import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import ThumbUpAltRoundedIcon from '@mui/icons-material/ThumbUpAltRounded';

const items = [
  {
    icon: <AutoFixHighRoundedIcon />,
    title: 'IA de Ponta',
    description:
      'Gere cursos completos sobre qualquer tema instantaneamente usando os motores Groq, ChatGPT e Gemini.',
  },
  {
    icon: <SettingsSuggestRoundedIcon />,
    title: 'Personalização Total',
    description:
      'Escolha o nível de dificuldade, do iniciante ao avançado, e adapte o conteúdo ao seu ritmo de aprendizado.',
  },
  {
    icon: <ThumbUpAltRoundedIcon />,
    title: 'Experiência Intuitiva',
    description:
      'Uma interface limpa e moderna, focada no que importa: o seu aprendizado livre de distrações.',
  },
  {
    icon: <QueryStatsRoundedIcon />,
    title: 'Gamificação Real',
    description:
      'Ganhe XP, suba de nível e conquiste badges enquanto domina novos conhecimentos na plataforma.',
  },
  {
    icon: <ConstructionRoundedIcon />,
    title: 'Conteúdo Multimídia',
    description:
      'Acesse aulas enriquecidas com imagens, áudio e vídeo para uma imersão completa em cada módulo.',
  },
  {
    icon: <SupportAgentRoundedIcon />,
    title: 'Aprendizado para Todos',
    description:
      'Uma plataforma democrática feita para quem quer ensinar ou aprender sem barreiras técnicas.',
  },
];

export default function Highlights() {
  return (
    <Box
      id="highlights"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        color: 'white',
        bgcolor: 'grey.900',
      }}
    >
      <Container
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: { xs: 3, sm: 6 },
        }}
      >
        <Box
          sx={{
            width: { sm: '100%', md: '60%' },
            textAlign: { sm: 'left', md: 'center' },
          }}
        >
          <Typography component="h2" variant="h4" gutterBottom>
            Destaques
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400' }}>
            Descubra por que nossa plataforma é a escolha ideal: inteligência artificial avançada, 
            liberdade temática, design focado no usuário e um sistema de progressão que 
            valoriza cada conquista sua.
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {items.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Stack
                direction="column"
                component={Card}
                spacing={1}
                useFlexGap
                sx={{
                  color: 'inherit',
                  p: 3,
                  height: '100%',
                  borderColor: 'hsla(220, 25%, 25%, 0.3)',
                  backgroundColor: 'grey.800',
                }}
              >
                <Box sx={{ opacity: '50%' }}>{item.icon}</Box>
                <div>
                  <Typography gutterBottom sx={{ fontWeight: 'medium' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    {item.description}
                  </Typography>
                </div>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}