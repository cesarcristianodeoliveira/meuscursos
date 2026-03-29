import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline, responsiveFontSizes } from '@mui/material';
// Fontes Roboto
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const ThemeContext = createContext();

export const ThemeProviderWrapper = ({ children }) => {
  // Inicializa o modo vindo do localStorage ou padrão 'system'
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system';
  });

  // Estado para capturar a preferência do sistema operacional em tempo real
  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Listener para mudanças no tema do Sistema Operacional
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemDark(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Define se o tema final será dark ou light
  const resolvedMode = useMemo(() => {
    if (mode === 'system') return systemDark ? 'dark' : 'light';
    return mode;
  }, [mode, systemDark]);

  const toggleTheme = () => {
    const newMode = resolvedMode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const theme = useMemo(() => {
    let baseTheme = createTheme({
      palette: {
        mode: resolvedMode,
        primary: {
          // Azul Profundo no Dark, Slate no Light
          main: resolvedMode === 'dark' ? '#38bdf8' : '#0f172a', 
        },
        secondary: {
          main: '#6366f1', // Indigo para botões de destaque (IA)
        },
        background: {
          default: resolvedMode === 'dark' ? '#020617' : '#f8fafc',
          paper: resolvedMode === 'dark' ? '#0f172a' : '#ffffff',
        },
        text: {
          primary: resolvedMode === 'dark' ? '#f1f5f9' : '#1e293b',
          secondary: '#64748b',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        button: { textTransform: 'none', fontWeight: 600 },
      },
      shape: {
        borderRadius: 12, // Bordas mais arredondadas e modernas
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: `
            * {
              transition: background-color 0.3s ease, color 0.2s ease;
            }
            body {
              scrollbar-width: thin;
              scrollbar-color: ${resolvedMode === 'dark' ? '#334155 #020617' : '#cbd5e1 #f8fafc'};
            }
            /* Garante legibilidade em conteúdos Markdown */
            .markdown-body {
              word-break: break-word;
              line-height: 1.6;
            }
          `,
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              padding: '8px 16px',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none', // Remove o overlay cinza do MUI no Dark Mode
            },
          },
        },
      },
    });

    return responsiveFontSizes(baseTheme);
  }, [resolvedMode]);

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