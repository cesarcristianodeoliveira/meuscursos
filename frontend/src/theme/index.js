import { createTheme } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: grey[900],
        },
        background: {
            default: grey[200]
        }
    },
    typography: {
        fontFamily: 'Roboto, sans-serif'
    }
});

export default theme;