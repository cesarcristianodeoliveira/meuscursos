// D:\meuscursos\frontend\src\theme\customizations\feedback.js

import { alpha } from '@mui/material/styles';
// CORRIGIDO: Importe todas as cores necessárias da sua paleta
import { gray, green, orange, red } from '../themePrimitives/colors'; 

/* eslint-disable import/prefer-default-export */
export const feedbackCustomizations = {
  MuiAlert: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        // REMOVIDO: backgroundColor e color do root.
        // Isso permite que as variantes (standardSuccess, etc.) definam suas próprias cores de fundo e texto.
        // A cor do texto principal do tema será aplicada por padrão, a menos que uma variante a sobrescreva.
        // backgroundColor: orange[100], // Removido
        color: (theme.vars || theme).palette.text.primary, // Mantém a cor do texto padrão
        border: `1px solid ${alpha(gray[300], 0.5)}`, // Borda padrão para todos os alerts (usando gray)
        // REMOVIDO: Cor do ícone do root, pois cada severidade terá a sua
        // '& .MuiAlert-icon': {
        //   color: orange[500],
        // },
        ...theme.applyStyles('dark', {
          // REMOVIDO: backgroundColor e border do root no modo dark
          // backgroundColor: `${alpha(orange[900], 0.5)}`, // Removido
          border: `1px solid ${alpha(gray[700], 0.5)}`, // Borda padrão para modo dark (usando gray)
        }),
      }),
      // ADICIONADO/CORRIGIDO: Estilos específicos para cada severidade
      standardSuccess: ({ theme }) => ({
        backgroundColor: theme.palette.success.light, // Usa a cor 'light' do seu esquema de cores 'success'
        color: theme.palette.success.dark,           // Usa a cor 'dark' do seu esquema de cores 'success'
        '& .MuiAlert-icon': {
          color: theme.palette.success.dark,
        },
        // Estilos para o modo dark, se aplicável
        ...theme.applyStyles('dark', {
          backgroundColor: green[700], // Um verde mais escuro para o fundo no modo dark
          color: green[100],           // Um verde mais claro para o texto no modo dark
          '& .MuiAlert-icon': {
            color: green[100],
          },
        }),
      }),
      standardError: ({ theme }) => ({
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.dark,
        '& .MuiAlert-icon': {
          color: theme.palette.error.dark,
        },
        ...theme.applyStyles('dark', {
          backgroundColor: red[700],
          color: red[100],
          '& .MuiAlert-icon': {
            color: red[100],
          },
        }),
      }),
      standardWarning: ({ theme }) => ({
        backgroundColor: theme.palette.warning.light,
        color: theme.palette.warning.dark,
        '& .MuiAlert-icon': {
          color: theme.palette.warning.dark,
        },
        ...theme.applyStyles('dark', {
          backgroundColor: orange[700],
          color: orange[100],
          '& .MuiAlert-icon': {
            color: orange[100],
          },
        }),
      }),
    },
  },
  MuiDialog: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiDialog-paper': {
          borderRadius: '10px',
          border: '1px solid',
          borderColor: (theme.vars || theme).palette.divider,
        },
      }),
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: ({ theme }) => ({
        height: 8,
        borderRadius: 8,
        backgroundColor: gray[200],
        ...theme.applyStyles('dark', {
          backgroundColor: gray[800],
        }),
      }),
    },
  },
};
