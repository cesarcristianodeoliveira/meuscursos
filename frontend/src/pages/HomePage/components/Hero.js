import * as React from 'react';
import { alpha } from '@mui/material/styles'; // Importe alpha para cores transparentes
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
// InputLabel, Link, TextField, Typography, visuallyHidden, styled foram importados do seu código original,
// mas alguns podem não ser mais necessários após as mudanças. Vamos manter o que for usado.
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles'; // Mantido para StyledBox

// Removi o InputLabel, TextField e visuallyHidden por não serem mais usados no Hero
// Removi também a StyledBox padrão para criar uma mais específica para a imagem de fundo

export default function Hero() {
  return (
    <Box
      id="hero"
      sx={(theme) => ({
        width: '100%',
        // Removi o backgroundPattern original e adicionei um gradiente mais suave
        backgroundImage:
          theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, #CEE5FD, #FFF)' // Azul claro para branco
            : 'linear-gradient(#02294F, #090E10)', // Azul escuro para preto quase
        backgroundSize: '100% 20%', // Define a área que o gradiente ocupa
        backgroundRepeat: 'no-repeat',
      })}
    >
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: { xs: 14, sm: 20 },
          pb: { xs: 8, sm: 12 },
        }}
      >
        <Stack
          spacing={2}
          useFlexGap
          sx={{ width: { xs: '100%', sm: '70%' }, alignItems: 'center' }} // Adicionei alignItems para centralizar o Stack
        >
          <Typography
            component="h1" // Semântica de cabeçalho principal
            variant="h1"
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' }, // Quebra em coluna em telas pequenas
              alignSelf: 'center', // Centraliza o próprio Typography
              textAlign: 'center', // Centraliza o texto dentro do Typography
              fontSize: 'clamp(3rem, 10vw, 3.5rem)', // Mantido do seu código, ajusta o tamanho da fonte
            }}
          >
            Desbloqueie seu potencial com&nbsp;
            <Typography
              component="span"
              variant="h1"
              sx={(theme) => ({
                fontSize: 'inherit', // Herda o tamanho da fonte do pai
                color: 'primary.main', // Cor principal do tema
                ...theme.applyStyles('dark', {
                  color: 'primary.light', // Cor mais clara no modo escuro
                }),
              })}
            >
              Meus Cursos
            </Typography>
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary">
            A plataforma completa para aprender e criar cursos online.
            Utilize **inteligência artificial** para gerar conteúdo de forma rápida e eficiente.
            Seu conhecimento, suas regras, seu futuro!
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignSelf="center"
            spacing={1}
            useFlexGap
            sx={{ pt: 2, width: { xs: '100%', sm: 'auto' } }} // Ajuste de largura para os botões
          >
            {/* Botão para explorar cursos */}
            <Button variant="contained" color="primary" size="large" // Aumentei o tamanho
            // Você pode adicionar um Link aqui para a página de explorar cursos
            // component={Link} href="/explore-courses"
            >
              Explorar Cursos
            </Button>
            {/* Botão para criar um curso */}
            <Button variant="outlined" color="primary" size="large" // Aumentei o tamanho
            // Você pode adicionar um Link aqui para a página de criação de cursos
            // component={Link} href="/create-course"
            >
              Criar Meu Curso
            </Button>
          </Stack>
          {/* Removido o campo de email e o texto de "Terms & Conditions" para simplificar o Hero */}
        </Stack>
        {/* Nova Box para a imagem de destaque, mais simples e direta */}
        <Box
          id="image"
          sx={(theme) => ({
            mt: { xs: 8, sm: 10 },
            alignSelf: 'center',
            height: { xs: 200, sm: 700 }, // Altura da imagem
            width: '100%',
            backgroundImage:
              'url("https://images.unsplash.com/photo-1546410531-bb443309e3e3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")', // Imagem de fundo de cursos ou aprendizado
            backgroundSize: 'cover',
            backgroundPosition: 'center', // Centraliza a imagem
            borderRadius: '10px', // Borda arredondada
            outline: '1px solid', // Contorno sutil
            outlineColor:
              theme.palette.mode === 'light'
                ? alpha('#BFCCD9', 0.5) // Cor do contorno claro
                : alpha('#9CCCFC', 0.1), // Cor do contorno escuro
            boxShadow:
              theme.palette.mode === 'light'
                ? `0 0 12px 8px ${alpha('#9CCCFC', 0.2)}` // Sombra clara
                : `0 0 24px 12px ${alpha('#033363', 0.2)}`, // Sombra escura
          })}
        />
      </Container>
    </Box>
  );
}
