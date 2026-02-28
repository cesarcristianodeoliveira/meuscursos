import React, { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

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
  const theme = useMemo(() => createTheme({
    palette: {
      mode: resolvedMode,
    },
  }), [resolvedMode]);

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