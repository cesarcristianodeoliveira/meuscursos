import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline, responsiveFontSizes } from '@mui/material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/600.css';
import '@fontsource/roboto/700.css';
import { blue, grey } from '@mui/material/colors';

const ThemeContext = createContext();

export const ThemeProviderWrapper = ({ children }) => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system';
  });

  const resolvedMode = useMemo(() => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }, [mode]);

  const toggleTheme = () => {
    const newMode = resolvedMode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const theme = useMemo(() => {
    let baseTheme = createTheme({
      palette: {
        primary: {
          main: resolvedMode === 'light' ? grey[900] : grey[300]
        },
        secondary: {
          main: resolvedMode === 'light' ? blue[500] : blue[300]
        },
        mode: resolvedMode,
      },
      typography: {
        fontFamily: [
          'Roboto',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Arial',
          'sans-serif',
        ].join(','),
      },
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

    return responsiveFontSizes(baseTheme);
  }, [resolvedMode]);

  // 🔥 Adiciona CSS global para garantir font-display
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Garante que todas as fontes usem swap */
      @font-face {
        font-family: 'Roboto';
        font-display: swap;
      }
      
      /* Aplica a fonte com fallback imediatamente */
      body, h1, h2, h3, h4, h5, h6, button, input, textarea {
        font-family: ${theme.typography.fontFamily};
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, resolvedMode }}>
      <ThemeProvider theme={theme} disableTransitionOnChange>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);