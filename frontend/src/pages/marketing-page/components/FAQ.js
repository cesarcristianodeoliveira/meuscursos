import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function FAQ() {
  const [expanded, setExpanded] = React.useState([]);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(
      isExpanded ? [...expanded, panel] : expanded.filter((item) => item !== panel),
    );
  };

  return (
    <Container
      id="faq"
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
      <Typography
        component="h2"
        variant="h4"
        sx={{
          color: 'text.primary',
          width: { sm: '100%', md: '60%' },
          textAlign: { sm: 'left', md: 'center' },
        }}
      >
        Perguntas Frequentes
      </Typography>
      <Box sx={{ width: '100%' }}>
        <Accordion
          expanded={expanded.includes('panel1')}
          onChange={handleChange('panel1')}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1d-content"
            id="panel1d-header"
          >
            <Typography component="span" variant="subtitle2">
              Como funcionam os créditos para gerar cursos?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: '100%', md: '70%' } }}
            >
              Cada curso gerado consome créditos do seu saldo. No plano Grátis, você recebe 1 crédito por hora. Já no plano Pro, você conta com 3 créditos por hora para explorar mais conteúdos e níveis de profundidade.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expanded.includes('panel2')}
          onChange={handleChange('panel2')}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2d-content"
            id="panel2d-header"
          >
            <Typography component="span" variant="subtitle2">
              Os cursos gerados pela IA têm certificado?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: '100%', md: '70%' } }}
            >
              A emissão de certificados está disponível exclusivamente para usuários do plano Pro. Após concluir as aulas e passar no exame final de um curso, você poderá gerar seu certificado digital diretamente na plataforma.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expanded.includes('panel3')}
          onChange={handleChange('panel3')}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3d-content"
            id="panel3d-header"
          >
            <Typography component="span" variant="subtitle2">
              Qual a diferença entre os motores de IA (Groq, ChatGPT, Gemini)?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: '100%', md: '70%' } }}
            >
              Utilizamos diferentes modelos para garantir a melhor didática. No plano Pro, você tem acesso ao Gemini e modelos avançados do ChatGPT, que permitem a criação de conteúdos multimídia (áudio/vídeo) e níveis de dificuldade Intermediário e Avançado.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expanded.includes('panel4')}
          onChange={handleChange('panel4')}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel4d-content"
            id="panel4d-header"
          >
            <Typography component="span" variant="subtitle2">
              Como posso entrar em contato se tiver algum problema técnico?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: '100%', md: '70%' } }}
            >
              Você pode falar com nosso suporte enviando um e-mail para&nbsp;
              <Link href="mailto:suporte@meuscursos.com.br">suporte@meuscursos.com.br</Link>.
              Estamos prontos para te ajudar com qualquer dúvida sobre a geração dos seus cursos.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Container>
  );
}