// D:\meuscursos\frontend\src\theme.js

import { createTheme } from '@mui/material/styles';
import { grey, common } from '@mui/material/colors'; // Importe 'common' para cores como branco e preto

// Função para criar o tema com base no modo (light ou dark)
const getAppTheme = (mode) => {
  return createTheme({
    palette: {
      mode: mode, // Define o modo dinamicamente
      ...(mode === 'light'
        ? {
            // Paleta para o modo claro
            primary: {
              main: grey[900], // Texto principal escuro em modo claro
              contrastText: common.white, // Para botões e elementos primários
            },
            secondary: {
              main: grey[700],
            },
            background: {
              default: grey[100], // Fundo claro para o corpo
              paper: common.white, // Fundo branco para cards, etc.
            },
            text: {
              primary: grey[900], // Cor principal do texto
              secondary: grey[700], // Cor secundária do texto
            },
            divider: grey[300], // Linhas divisórias claras
          }
        : {
            // Paleta para o modo escuro
            primary: {
              main: grey[50], // Texto principal claro em modo escuro
              contrastText: grey[900],
            },
            secondary: {
              main: grey[300],
            },
            background: {
              default: grey[900], // Fundo escuro para o corpo
              paper: grey[800], // Fundo mais escuro para cards, etc.
            },
            text: {
              primary: common.white, // Cor principal do texto
              secondary: grey[300], // Cor secundária do texto
            },
            divider: grey[700], // Linhas divisórias escuras
          }),
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 700 },
      h2: { fontSize: '2rem', fontWeight: 600 },
      h3: { fontSize: '1.75rem', fontWeight: 600 },
      h4: { fontSize: '1.5rem', fontWeight: 500 },
      h5: { fontSize: '1.25rem', fontWeight: 500 },
      h6: { fontSize: '1rem', fontWeight: 500 },
      body1: { fontSize: '1rem' },
      body2: { fontSize: '0.875rem' },
      button: { textTransform: 'none' }, // Evita que botões fiquem em CAPS por padrão
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8, // Exemplo: bordas mais arredondadas para botões
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            borderRadius: 8, // Exemplo: bordas mais arredondadas para campos de texto
          },
        },
      },
      MuiPaper: { // Para os Boxes que você usa como containers em páginas
        styleOverrides: {
          root: {
            borderRadius: 8, // Exemplo: bordas mais arredondadas para caixas
          },
        },
      },
    }
  });
};

export default getAppTheme; // Exporte a função, não o objeto