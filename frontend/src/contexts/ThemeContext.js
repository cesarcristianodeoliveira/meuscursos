import React, { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider, CssBaseline, responsiveFontSizes } from '@mui/material';

const ThemeContext = createContext();

export const ThemeProviderWrapper = ({ children }) => {
  // 1. Inicia com o valor do localStorage ou 'system'
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system';
  });

  // 2. Resolve qual é o tema real (considerando o sistema)
  const resolvedMode = useMemo(() => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }, [mode]);

  // 3. Função para alternar entre light e dark
  const toggleTheme = () => {
    const newMode = resolvedMode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // 4. Configuração do Objeto de Tema
  const theme = useMemo(() => {
    let baseTheme = createTheme({
      palette: {
        mode: resolvedMode,
      },
      // Adicionamos aqui ajustes globais de tipografia
      typography: {
        h3: {
          fontWeight: 900,
        },
        h5: {
          fontWeight: 800,
        },
      },
      // Garantimos que o texto não "vaze" do container no mobile
      components: {
        MuiTypography: {
          styleOverrides: {
            root: {
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            },
          },
        },
      },
    });

    // A mágica acontece aqui: 
    // Esta função envolve o tema e torna todas as fontes responsivas
    return responsiveFontSizes(baseTheme);
  }, [resolvedMode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, resolvedMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);