// D:\meuscursos\frontend\src\theme\themePrimitives\shadows.js
import { createTheme } from '@mui/material/styles';
const defaultTheme = createTheme();
export const shadows = [
  'none',
  // 'var(--template-palette-baseShadow)',
  'hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px',
  ...defaultTheme.shadows.slice(2),
];