import React, { useState, useEffect } from 'react';
import { useLocation, Link, matchPath } from 'react-router-dom'; 
import PropTypes from 'prop-types';
import { Tabs, Tab } from '@mui/material';

// Definindo as rotas, o 'path' agora será o 'value' do Tab
const routes = [
  { label: 'Painel', path: '/' },
  { label: 'Cursos', path: '/cursos' },
  { label: 'Blog', path: '/blog' },
];

// O LinkTab permanece o mesmo
function LinkTab(props) {
  return (
    <Tab
      component={Link}
      to={props.href} // 'href' é passado como 'to'
      // O Material-UI aplica o 'selected' com base no 'value' do Tabs, não precisamos do prop 'selected' aqui.
      {...props}
    />
  );
}

LinkTab.propTypes = {
  href: PropTypes.string.isRequired,
};

const MenuResponsive = () => {
  const location = useLocation();
  // Alteramos o estado 'value' para armazenar a string da rota ativa (ou null se não houver correspondência)
  const [value, setValue] = useState(false); // False para inicializar sem seleção

  // --- NOVA Lógica para Sincronizar a Seleção do Tab com a Rota Atual ---
  useEffect(() => {
    const currentPathname = location.pathname;
    let newActivePath = false; // Usamos false como valor inicial/não encontrado

    // Percorre as rotas para encontrar a correspondência mais específica
    // (A ordem definida no array já prioriza a raiz por último)
    for (const route of routes) {
      
      const routePath = route.path;
      
      // 1. Defina as opções de correspondência (Match Options)
      let matchOptions = { 
          path: routePath, 
          // Para todas as rotas de nível superior ('/cursos', '/blog'), 
          // NÃO queremos correspondência exata, permitindo sub-rotas.
          end: routePath === '/' // APENAS a rota raiz '/' deve ter correspondência exata (end: true)
      };

      // 2. Tenta fazer a correspondência
      const match = matchPath(matchOptions, currentPathname);

      if (match) {
        // Encontramos uma correspondência. Usamos o path do menu como valor
        newActivePath = routePath;
        break; // A primeira correspondência mais específica encontrada é suficiente
      }
    }
    
    // Atualiza o estado de 'value' com o path ativo
    // Se não encontrar nenhuma correspondência, newActivePath permanece 'false'
    // Como o MUI Tabs não aceita 'false', garantimos um valor válido.
    // O valor 'false' ou 'undefined' no 'value' do Tabs causa o erro que você mencionou.
    // Vamos usar o path 'newActivePath' como valor. Se for 'false', o Tabs não terá nenhum item selecionado.
    setValue(newActivePath);
    
  }, [location.pathname]); // Executa sempre que o pathname mudar

  // A função handleChange agora recebe o path (string) como newValue
  const handleChange = (event, newValue) => {
    // newValue é o path da rota (ex: '/cursos')
    setValue(newValue);
  };


  return (
    <>
    <Tabs
      value={value}
      onChange={handleChange}
      aria-label="menu de navegação principal"
      role="navigation"
      // indicatorColor="transparent"
      sx={{
        display: { xs: 'none', md: 'flex' },
        minHeight: 40,
        // '& .MuiTabs-indicator': {
        //   display: 'none'
        // }
      }}
    >
      {routes.map((route) => (
        <LinkTab
          key={route.path}
          label={route.label}
          href={route.path}
          value={route.path}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 40,
            color: 'text.secondary',
            transition: 'none',
            '&.Mui-selected': {
              color: 'primary.main',
              backgroundColor: (theme) =>
                theme.palette.action.selected,
            },
            '&:hover': {
              backgroundColor: (theme) => theme.palette.action.hover,
            },
          }}
        />
      ))}
    </Tabs>

    </>
  )
}

export default MenuResponsive