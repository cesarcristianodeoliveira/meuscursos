// D:\meuscursos\frontend\src\theme\themePrimitives\shadows.js

import { createTheme } from '@mui/material/styles'; // Importe createTheme para defaultTheme

const defaultTheme = createTheme();

// customShadows não é mais necessário aqui, pois a lógica de alternar sombras
// com base no modo escuro/claro será lidada pelo getDesignTokens
// e as sombras são referenciadas como variáveis CSS no createTheme.

export const shadows = [
  'none', // defaultTheme.shadows[0]
  'var(--template-palette-baseShadow)', // O primeiro sombra será uma variável CSS
  ...defaultTheme.shadows.slice(2), // O restante das sombras padrão do MUI
];