import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import timeAgo from '../../../utils/timeAgo'

const userTestimonials = [
  {
    avatar: <Avatar alt="Remy Sharp" src="/static/images/avatar/1.jpg" />,
    name: 'Remy Sharp',
    createdAt: '2026-04-01T10:00:00Z',
    testimonial:
      "Os cursos de React e Node.js são sensacionais! A didática aplicada me ajudou a construir projetos reais e subir de nível na minha carreira de desenvolvedor.",
  },
  {
    avatar: <Avatar alt="Travis Howard" src="/static/images/avatar/2.jpg" />,
    name: 'Travis Howard',
    createdAt: '2026-04-04T15:30:00Z',
    testimonial:
      "A facilidade de aprender Material-UI aqui foi o diferencial. O conteúdo é direto ao ponto e os exemplos de código são muito bem estruturados.",
  },
  {
    avatar: <Avatar alt="Cindy Baker" src="/static/images/avatar/3.jpg" />,
    name: 'Cindy Baker',
    createdAt: '2026-03-20T09:00:00Z',
    testimonial:
      'Estava procurando por um curso de Sanity e CMS headless há tempos. A abordagem usada aqui é moderna e focada no que o mercado realmente pede.',
  },
  {
    avatar: <Avatar alt="Julia Stewart" src="/static/images/avatar/4.jpg" />,
    name: 'Julia Stewart',
    createdAt: '2026-04-05T00:00:00Z',
    testimonial:
      "Excelente suporte e comunidade. Ter acesso a instrutores que realmente entendem do que estão falando faz toda a diferença no aprendizado.",
  },
  {
    avatar: <Avatar alt="John Smith" src="/static/images/avatar/5.jpg" />,
    name: 'John Smith',
    createdAt: '2026-02-15T12:00:00Z',
    testimonial:
      "As aulas sobre deploy na Netlify e configuração de ambientes me pouparam semanas de estudo individual. Recomendo para qualquer dev.",
  },
  {
    avatar: <Avatar alt="Daniel Wolf" src="/static/images/avatar/6.jpg" />,
    name: 'Daniel Wolf',
    createdAt: '2026-04-04T22:00:00Z',
    testimonial:
      "O custo-benefício dos cursos é imbatível. A qualidade visual e técnica do material é premium. Definitivamente vale o investimento!",
  },
];

export default function Testimonials() {
  return (
    <Container
      id="testimonials"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
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
        <Typography
          component="h2"
          variant="h4"
          gutterBottom
          sx={{ color: 'text.primary' }}
        >
          Depoimentos
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Aprenda do iniciante ao avançado sobre qualquer tema. Nossa plataforma de ensino para todos permite criar e dominar novos conhecimentos com total liberdade.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {userTestimonials.map((testimonial, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: 'flex' }}>
            <Card
              variant="outlined"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexGrow: 1,
              }}
            >
              <CardContent>
                <Typography
                  variant="body1"
                  gutterBottom
                  sx={{ color: 'text.secondary' }}
                >
                  {testimonial.testimonial}
                </Typography>
              </CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <CardHeader
                  avatar={testimonial.avatar}
                  title={testimonial.name}
                  subheader={timeAgo(testimonial.createdAt)}
                />
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}