// D:\meuscursos\frontend\src\theme.js

import { createTheme } from '@mui/material/styles';

const getAppTheme = (mode) => {
  return createTheme({
    palette: {
      mode: mode, 
      ...(mode),
    },
  });
};

export default getAppTheme;