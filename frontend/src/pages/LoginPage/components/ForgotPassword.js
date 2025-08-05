// D:\meuscursos\frontend\src\pages\LoginPage\components\ForgotPassword.js

import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

export default function ForgotPassword({ open, handleClose }) {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState(null);
  const [error, setError] = React.useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    // Simulação de chamada de API para redefinição de senha
    try {
      // Aqui você integraria sua lógica real para enviar o email de redefinição
      // Por exemplo: await auth.sendPasswordResetEmail(email);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simula delay da API

      if (email.includes('@')) { // Simples validação para demonstração
        setMessage('Um link de redefinição de senha foi enviado para seu e-mail.');
        setEmail(''); // Limpa o campo após o envio
      } else {
        setError('Por favor, insira um e-mail válido.');
      }
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      setError('Ocorreu um erro ao enviar o link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
      <DialogTitle>Esqueceu sua senha?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Para redefinir sua senha, por favor, insira seu endereço de e-mail aqui. Enviaremos um link para você.
        </DialogContentText>
        <TextField
          autoFocus
          required
          margin="dense"
          id="email-reset"
          name="email"
          label="Endereço de E-mail"
          type="email"
          fullWidth
          variant="standard"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!error}
          helperText={error}
        />
        {message && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Enviar Link'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
