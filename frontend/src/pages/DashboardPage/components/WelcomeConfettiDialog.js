    // D:\meuscursos\frontend\src\pages\DashboardPage\components\WelcomeConfettiDialog.js

    import React, { useState, useEffect } from 'react';
    import ReactConfetti from 'react-confetti';
    import Dialog from '@mui/material/Dialog';
    import DialogTitle from '@mui/material/DialogTitle';
    import DialogContent from '@mui/material/DialogContent';
    import DialogContentText from '@mui/material/DialogContentText';
    import DialogActions from '@mui/material/DialogActions';
    import Button from '@mui/material/Button';
    import useWindowSize from '../../../hooks/useWindowSize'; // Ajustado o caminho para o hook

    /**
     * Componente WelcomeConfettiDialog
     * Exibe uma animação de confetes e um diálogo de boas-vindas.
     *
     * @param {object} props - As propriedades do componente.
     * @param {boolean} props.open - Controla a visibilidade do diálogo e da animação.
     * @param {function} props.onClose - Função chamada ao fechar o diálogo.
     * @param {string} [props.userName] - Nome do usuário para personalizar a mensagem de boas-vindas.
     */
    export default function WelcomeConfettiDialog({ open, onClose, userName }) {
      const { width, height } = useWindowSize();
      const [showConfetti, setShowConfetti] = useState(open);

      useEffect(() => {
        setShowConfetti(open);
        if (!open) {
          setShowConfetti(false);
        }
      }, [open]);

      const handleClose = () => {
        setShowConfetti(false);
        onClose();
      };

      return (
        <>
          {open && showConfetti && (
            <ReactConfetti
              width={width}
              height={height}
              recycle={false}
              numberOfPieces={200}
              gravity={0.15}
              confettiSource={{
                x: 0,
                y: 0,
                w: width,
                h: 0,
              }}
              initialVelocityX={{ min: -5, max: 5 }}
              initialVelocityY={{ min: 5, max: 15 }}
              onConfettiComplete={() => setShowConfetti(false)}
            />
          )}

          <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="welcome-dialog-title"
            aria-describedby="welcome-dialog-description"
          >
            <DialogTitle id="welcome-dialog-title">
              Olá, {userName ? userName.split(' ')[0] : ''}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="welcome-dialog-description">
                É um prazer ter você conosco! Explore a comunidade e comece a aprender ou criar.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} autoFocus>
                Começar
              </Button>
            </DialogActions>
          </Dialog>
        </>
      );
    }
    