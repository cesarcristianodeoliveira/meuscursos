import React from 'react';
import { Typography, Box, Button, Stack, Paper } from '@mui/material';
import { EmojiEvents, Download } from '@mui/icons-material';

const CertificateDialog = ({ courseTitle }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 3, md: 6 }, 
          border: '10px double', 
          borderColor: 'primary.main', 
          mb: 4, 
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          mx: 'auto',
          maxWidth: '640px'
        }}
      >
        {/* Marca d'água discreta de troféu ao fundo */}
        <EmojiEvents sx={{ 
          position: 'absolute', 
          right: -20, 
          bottom: -20, 
          fontSize: 200, 
          opacity: 0.05, 
          transform: 'rotate(-15deg)' 
        }} />

        <Typography variant="h5" sx={{ fontStyle: 'italic', mb: 2, fontWeight: 700 }}>
          Certificado de Conclusão
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          Certificamos que o aluno concluiu com sucesso todas as etapas, exercícios e avaliações do curso livre de 
          <strong> {courseTitle}</strong>.
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 4 }}>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="caption" display="block" lineHeight={1}>
              Data de Emissão: {new Date().toLocaleDateString()}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontFamily: 'serif', fontWeight: 'bold' }}>
              Meus Cursos
            </Typography>
            <Typography variant="caption" display="block">
              meuscursos.netlify.app
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Button 
        variant="contained" 
        size="large"
        startIcon={<Download />} 
        onClick={() => window.print()}
        sx={{ borderRadius: 8, px: 4 }}
      >
        Imprimir ou Salvar como PDF
      </Button>
    </Box>
  );
};

export default CertificateDialog;