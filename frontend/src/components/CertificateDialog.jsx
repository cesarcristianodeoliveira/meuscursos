import React from 'react';
import { Dialog, DialogContent, Typography, Box, Button, Stack } from '@mui/material';
import { EmojiEvents, Download } from '@mui/icons-material';

const CertificateDialog = ({ open, onClose, courseTitle }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm" 
      fullWidth 
      PaperProps={{ sx: { borderRadius: 4, textAlign: 'center', p: 4 } }}
    >
      <DialogContent>
        <EmojiEvents sx={{ fontSize: 80, color: '#FFD700', mb: 2 }} />
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Parabéns!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Você concluiu com excelência o curso: <br />
          <strong>{courseTitle}</strong>
        </Typography>
        
        <Box sx={{ 
          p: 3, 
          border: '6px double', 
          borderColor: 'primary.main', 
          mb: 3, 
          borderRadius: 2,
          bgcolor: 'action.hover'
        }}>
          <Typography variant="h6" sx={{ fontStyle: 'italic', mb: 1 }}>
            Certificado de Conclusão
          </Typography>
          <Typography variant="caption" display="block">
            Este certificado comprova a realização de todos os módulos e aprovação nas avaliações.
          </Typography>
          <Typography variant="caption" fontWeight="bold" sx={{ mt: 1, display: 'block' }}>
            Meus Cursos AI - {new Date().toLocaleDateString()}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" startIcon={<Download />} onClick={() => window.print()}>
            Imprimir / Salvar PDF
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Fechar
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateDialog;