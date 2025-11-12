import React from 'react';
// Importa *todos* os componentes de ícone estaticamente.
import * as MuiIcons from '@mui/icons-material';
import { Box } from '@mui/material';

// Função auxiliar para normalizar o nome da string (ex: "headphones" -> "Headphones")
const normalizeIconName = (name) => {
  if (!name) return 'HelpOutline'; 
  
  // 1. Converte para minúsculas.
  // 2. Divide por underscores (_), hífens (-) ou espaços.
  // 3. Capitaliza a primeira letra de cada parte (PascalCase).
  const parts = name.toLowerCase().split(/[_ -]/);
  const capitalized = parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');

  // O nome do componente no MUI Icons é "NomeDoIcone" (ex: "Headphones").
  // Retornamos a string no formato PascalCase.
  return capitalized;
};

/**
 * Componente que resolve dinamicamente um ícone do Material-UI a partir do nome (string) do Sanity.
 */
const IconResolver = ({ iconName, sx, ...props }) => {
  const normalizedName = normalizeIconName(iconName);
  
  // Busca o componente no mapa de ícones importados (MuiIcons[normalizedName]).
  // Ex: MuiIcons["Headphones"] -> retorna o componente <Headphones />
  const ComponentName = MuiIcons[normalizedName];

  // Ícone de fallback (se o nome estiver incorreto ou faltar).
  const FallbackIcon = MuiIcons.HelpOutline; 

  if (ComponentName) {
    // Retorna o componente de ícone encontrado.
    return <ComponentName sx={sx} {...props} />;
  }

  // Se o ícone não for encontrado, exibe o fallback e um aviso.
  // console.warn(`⚠️ Ícone "${iconName}" (normalizado para "${normalizedName}") não encontrado no Material-UI. Usando HelpOutline.`);
  
  return (
    <Box 
      component="span" 
      title={`Ícone não encontrado: ${iconName}`}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', ...sx }}
      {...props}
    >
        <FallbackIcon />
    </Box>
  );
};

export default IconResolver;