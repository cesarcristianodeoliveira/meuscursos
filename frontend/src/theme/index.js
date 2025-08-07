// D:\meuscursos\frontend\src\theme\index.js

import * as React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Importa TODAS as customizações de componentes
import { inputsCustomizations } from './customizations/inputs';
import { dataDisplayCustomizations } from './customizations/dataDisplay';
import { feedbackCustomizations } from './customizations/feedback';
import { navigationCustomizations } from './customizations/navigation';
import { surfacesCustomizations } from './customizations/surfaces';
import { chartsCustomizations } from './customizations/charts'; 
import { dataGridCustomizations } from './customizations/dataGrid';
import { datePickersCustomizations } from './customizations/datePickers';
import { treeViewCustomizations } from './customizations/treeView';

// Importa as primitivas do tema dos seus respectivos arquivos
import { colorSchemes } from './themePrimitives/colorSchemes';
import { typography } from './themePrimitives/typography';
import { shadows } from './themePrimitives/shadows'; // Importa o shadows corrigido
import { shape } from './themePrimitives/shape';

function AppTheme(props) {
  const { children, disableCustomTheme, themeComponents } = props;

  const theme = React.useMemo(() => {
    return disableCustomTheme
      ? {}
      : createTheme({
          cssVariables: {
            colorSchemeSelector: 'data-mui-color-scheme',
            cssVarPrefix: 'template',
          },
          colorSchemes, 
          typography,
          shadows, // Usará o array de shadows com o valor direto
          shape,
          components: {
            ...inputsCustomizations,
            ...dataDisplayCustomizations,
            ...feedbackCustomizations,
            ...navigationCustomizations,
            ...surfacesCustomizations,
            ...chartsCustomizations,
            ...dataGridCustomizations,
            ...datePickersCustomizations,
            ...treeViewCustomizations,
            ...themeComponents,
          },
        });
  }, [disableCustomTheme, themeComponents]);

  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}

AppTheme.propTypes = {
  children: PropTypes.node,
  disableCustomTheme: PropTypes.bool,
  themeComponents: PropTypes.object,
};

export default AppTheme;