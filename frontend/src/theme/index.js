// D:\meuscursos\frontend\src\theme\index.js

import * as React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Importa as customizações de componentes
import { inputsCustomizations } from './customizations/inputs';
import { dataDisplayCustomizations } from './customizations/dataDisplay';
import { feedbackCustomizations } from './customizations/feedback';
import { navigationCustomizations } from './customizations/navigation';
import { surfacesCustomizations } from './customizations/surfaces';

// Importa as primitivas do tema dos seus respectivos arquivos
import { colorSchemes } from './themePrimitives/colorSchemes';
import { typography } from './themePrimitives/typography';
import { shadows } from './themePrimitives/shadows';
import { shape } from './themePrimitives/shape';

function AppTheme(props) {
  const { children, disableCustomTheme, themeComponents } = props;
  
  const theme = React.useMemo(() => {
    return disableCustomTheme
      ? {} // Retorna um objeto vazio se o tema customizado estiver desabilitado
      : createTheme({
          // Configuração de variáveis CSS para o tema
          // Mais detalhes: https://mui.com/material-ui/customization/css-theme-variables/configuration/
          cssVariables: {
            colorSchemeSelector: 'data-mui-color-scheme', // Seletor para alternar entre light/dark mode
            cssVarPrefix: 'template', // Prefixo para suas variáveis CSS (ex: --template-palette-primary-main)
          },
          // Esquemas de cores (light/dark mode)
          // Mais detalhes: https://mui.com/material-ui/customization/palette/#color-schemes
          colorSchemes, 
          
          // Definições de tipografia
          typography,
          
          // Definições de sombras
          shadows,
          
          // Definições de forma (bordas arredondadas, etc.)
          shape,
          
          // Sobrescritas (overrides) para componentes do Material UI
          components: {
            ...inputsCustomizations,
            ...dataDisplayCustomizations,
            ...feedbackCustomizations,
            ...navigationCustomizations,
            ...surfacesCustomizations,
            ...themeComponents, // Permite passar customizações adicionais via props do App.js
          },
        });
  }, [disableCustomTheme, themeComponents]); // O tema é recriado apenas se essas dependências mudarem

  // Se o tema customizado estiver desabilitado, renderiza os filhos sem ThemeProvider
  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  // Renderiza o ThemeProvider com o tema criado e o CssBaseline
  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      <CssBaseline enableColorScheme /> {/* Aplica estilos base e permite a troca de esquema de cores */}
      {children}
    </ThemeProvider>
  );
}

// Definição de PropTypes para validação de props (boa prática)
AppTheme.propTypes = {
  children: PropTypes.node,
  /**
   * Esta prop é geralmente usada para sites de documentação. Você pode ignorá-la ou removê-la.
   */
  disableCustomTheme: PropTypes.bool,
  themeComponents: PropTypes.object,
};

export default AppTheme;