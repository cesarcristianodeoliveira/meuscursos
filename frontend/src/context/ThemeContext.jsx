import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const Context = createContext();

export const ThemeContext = ({ children }) => { 
  const drawerWidth = 240;
  
  // Verifica o sistema do usuário e o localStorage
  const getInitialDarkMode = () => {
    const savedMode = localStorage.getItem('darkMode');
    
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    
    // Se não há preferência salva, usa a preferência do sistema
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  // Salva no localStorage sempre que darkMode mudar
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Escuta mudanças no sistema (opcional)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      // Só muda se o usuário não tiver uma preferência salva
      const hasUserPreference = localStorage.getItem('darkMode') !== null;
      if (!hasUserPreference) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  const theme = createTheme({
    colorSchemes: true,
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Context.Provider
      value={{
        drawerWidth,
        theme, 
        darkMode, 
        toggleDarkMode,
      }}
    >
      <ThemeProvider disableTransitionOnChange theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Context.Provider>
  );
};

export const useThemeContext = () => useContext(Context);