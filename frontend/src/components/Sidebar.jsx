import React, { useState, useMemo } from 'react';
// Importações adicionais necessárias do React Router
import { useLocation, Link, matchPath } from 'react-router-dom';

// Importações do Contexto (assumindo que estão corretas)
import { useThemeContext } from '../context/ThemeContext';
import { useCourse } from '../context/CourseContext';

// Importações do Material-UI
import { 
    AppBar, Toolbar, IconButton, Typography, Box, Drawer, List, 
    ListSubheader, ListItem, ListItemButton, ListItemText, Divider, 
    CircularProgress, ListItemIcon, Button,
    Collapse,
} from '@mui/material';

// Importações de Ícones
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

// Componentes Auxiliares
import SearchField from '../components/SearchField';
import MenuResponsive from '../components/MenuResponsive';

// --- 1. Definição Centralizada das Rotas Principais ---
const mainRoutes = [
    { label: 'Painel', path: '/', icon: DashboardIcon, exact: true }, 
    { label: 'Cursos', path: '/cursos', icon: SchoolIcon, exact: false }, 
    { label: 'Blog', path: '/blog', icon: RssFeedIcon, exact: false }, 
];

// --- 2. Componente e Lógica de Rota Ativa ---

// Hook Customizado para checar se o Link está ativo (lidando com sub-rotas)
const useIsActive = (path, exact) => {
    const location = useLocation();
    
    const matchOptions = { 
        path: path, 
        end: exact
    };

    // Uso correto do matchPath. O end: exact cuida da maioria dos casos.
    const match = matchPath(matchOptions, location.pathname);

    // Ajuste para lidar com rotas não exatas que devem corresponder apenas ao prefixo.
    if (!exact && match) {
        // Ex: /cursos/curso1 deve bater com /cursos, mas não /cursos-extras.
        // matchPath já cuida de verificar se o path começa com o prefixo.
        // Se a rota não for exata e houver um match, é ativo.
        return true; 
    }
    
    return !!match;
};


/**
 * Componente que renderiza um link do Sidebar (para rotas principais).
 */
const SidebarLink = ({ to, label, icon: Icon, onClick, exact = false }) => {
    const isActive = useIsActive(to, exact);

    return (
        <ListItem disablePadding>
            <ListItemButton
                component={Link}
                to={to}
                onClick={onClick}
                selected={isActive} 
                dense
                sx={{
                    transition: 'none',
                    // CORREÇÃO: Usar paddingX ou paddingLeft/Right para evitar problemas com [1]
                    // que não é um uso padrão da propriedade px do sx para arrays.
                    paddingX: 1, // Equivalente a theme.spacing(1)
                    '&.Mui-selected': { 
                        bgcolor: (theme) => theme.palette.action.selected,
                        borderRight: (theme) => `1px solid ${theme.palette.primary.main}`,
                        '&:hover': {
                            bgcolor: (theme) => theme.palette.action.hover,
                        }
                    },
                    '&.Mui-selected .MuiListItemIcon-root': {
                        color: (theme) => theme.palette.primary.main,
                    }
                }}
            >
                {Icon && (
                    // Ajuste: O padding do ListItemButton deve ser suficiente
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                        <Icon fontSize='small' />
                    </ListItemIcon>
                )}
                <ListItemText
                    primary={label}
                    primaryTypographyProps={{ noWrap: true }}
                    // Ajuste: Removendo o sx no ListItemText. O `dense` no ListItemButton
                    // deve ajustar o padding vertical adequadamente.
                />
            </ListItemButton>
        </ListItem>
    );
};


/**
 * Componente para links da seção Cursos Recentes.
 */
const CourseSidebarLink = ({ to, title, secondaryText, onClick, isActive }) => {
    return (
        <ListItem disablePadding>
            <ListItemButton
                component={Link}
                to={to}
                title={title}
                onClick={onClick}
                selected={isActive} 
                dense
                sx={{
                    transition: 'none',
                    // CORREÇÃO: Usar paddingX para consistência
                    paddingX: 1, 
                    '&.Mui-selected': { 
                        bgcolor: (theme) => theme.palette.action.selected,
                        borderRight: (theme) => `1px solid ${theme.palette.primary.main}`,
                        '&:hover': {
                            bgcolor: (theme) => theme.palette.action.hover,
                        }
                    },
                }}
            >
                <ListItemText
                    primary={title}
                    primaryTypographyProps={{ 
                        noWrap: true,
                        // Mantido fontSize para consistência visual
                        fontSize: '0.875rem', 
                    }}
                    secondary={secondaryText}
                    secondaryTypographyProps={{ noWrap: true }}
                />
            </ListItemButton>
        </ListItem>
    );
}

// --- 3. Componente Principal Sidebar ---

const Sidebar = () => {
    const { courses, loading } = useCourse();
    // Assumindo que drawerWidth está em pixels (ex: 240)
    const { drawerWidth, darkMode, toggleDarkMode } = useThemeContext(); 
    const location = useLocation();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [openCourses, setOpenCourses] = useState(true);

    const handleDrawerClose = () => {
        setIsClosing(true);
        setMobileOpen(false);
    };

    const handleDrawerTransitionEnd = () => {
        setIsClosing(false);
    };

    const handleDrawerToggle = () => {
        if (!isClosing) {
            setMobileOpen(!mobileOpen);
        }
    };
    
    const handleLinkClick = () => {
        // Fechar o Drawer no mobile ao clicar em um link
        if (mobileOpen) {
            handleDrawerClose();
        }
    };
    
    const handleCoursesClick = () => {
        setOpenCourses(!openCourses);
    };


    // Lógica de Ordenação dos Cursos (useMemo)
    const sortedCourses = useMemo(() => {
        if (!courses || courses.length === 0) return [];

        return [...courses].sort((a, b) => {
            // CORREÇÃO APLICADA AQUI:
            // 1. Usar _createdAt (campo do Sanity) para a ordenação.
            // 2. Usar a comparação numérica (getTime) para garantir a ordem correta
            //    do mais recente para o mais antigo (B - A).
            const dateA = new Date(a._createdAt || a._updatedAt || a._id).getTime();
            const dateB = new Date(b._createdAt || b._updatedAt || b._id).getTime();
            
            // Ordem Decrescente (do mais novo para o mais antigo)
            return dateB - dateA;
        });
    }, [courses]);


    // --- Definição do Conteúdo do Drawer (const drawer) ---
    const drawer = (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
            }}
        >
            {/* 1. Espaço para compensar o AppBar fixo no Desktop */}
            <Toolbar 
                // CORREÇÃO: Removendo px:[0] para permitir o padding padrão da Toolbar.
                // Isso garante que o padding vertical e horizontal do tema seja aplicado.
                sx={{ 
                    minHeight: '56px!important', // Garantindo altura da AppBar
                    display: { xs: 'none', sm: 'flex' } 
                }} 
            /> 
            
            {/* 2. CONTÊINER ROLÁVEL COMPLETO: flexGrow: 1, overflowY: 'auto' */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            
                {/* 2.1. Rotas Principais */}
                <nav>
                    {/* CORREÇÃO: Usar p: 0 ou padding: 0 em List, mas o List padrão não tem padding vertical */}
                    <List dense sx={{ padding: 0 }}>
                        {mainRoutes.map(route => (
                            <SidebarLink 
                                key={route.path}
                                to={route.path}
                                label={route.label}
                                icon={route.icon}
                                exact={route.exact}
                                onClick={handleLinkClick} 
                            />
                        ))}
                    </List>
                </nav>
                <Divider />

                {/* 2.2. Cursos Recentes (Conteúdo Dinâmico) */}
                <nav>
                    {/* ListSubheader para o cabeçalho colapsável */}
                    <ListSubheader 
                        component={ListItemButton}
                        onClick={handleCoursesClick}
                        sx={{ 
                            transition: 'none',
                            // CORREÇÃO: Usar paddingX para consistência. px: [1] não é a sintaxe correta do array
                            paddingX: 1, 
                            minHeight: 36, // MinHeight para ListSubheader padrão
                            
                            bgcolor: 'background.paper', // Garante que a cor de fundo seja a do tema
                            color: 'text.primary',
                            
                            display: 'flex',
                            alignItems: 'center',
                            
                            paddingTop: 0, // Ajuste fino, se necessário
                            paddingBottom: 0,
                            // O ListItemButton já garante que o flex seja usado
                        }}
                    >
                        
                        <ListItemText
                            primary="Recentes"
                            primaryTypographyProps={{ 
                                noWrap: true,
                                fontSize: '0.875rem',
                            }}
                        />
                        
                        <Box sx={{ flexGrow: 1 }} />
                        {openCourses ? <ExpandLess /> : <ExpandMore />}
                        
                    </ListSubheader>

                    {/* Conteúdo Colapsável */}
                    <Collapse in={openCourses} timeout="auto" unmountOnExit>
                        {loading ? (
                            <Box sx={{ alignItems: 'center', display: 'flex', p: 1 }}>
                                <CircularProgress size={20} />
                            </Box>
                        ) : (
                            // CORREÇÃO: Usar padding: 0 para garantir que a lista não tenha margens indesejadas
                            <List dense sx={{ padding: 0 }}>
                                {sortedCourses.length ? (
                                    sortedCourses.map(c => {
                                        const slug = typeof c.slug === 'object' ? c.slug.current : c.slug;
                                        const key = c._id || c.id || slug;
                                        // A rota ativa é correta
                                        const courseMatch = matchPath({ path: '/curso/:slug', end: false }, location.pathname);
                                        const courseIsActive = courseMatch?.params.slug === slug;
                                        
                                        const category = c.category?.title || 'Categoria Desconhecida';
                                        const subCategory = c.subcategory?.title ? ` - ${c.subcategory.title}` : ''; 
                                        const secondaryText = `${category}${subCategory}`;

                                        return (
                                            <CourseSidebarLink 
                                                key={key}
                                                to={`/curso/${slug}`}
                                                title={c.title}
                                                secondaryText={secondaryText}
                                                onClick={handleLinkClick}
                                                isActive={courseIsActive} 
                                            />
                                        );
                                    })
                                ) : (
                                    <ListItem disablePadding>
                                        <ListItemText 
                                            primary="Nenhum curso no momento" 
                                            primaryTypographyProps={{ 
                                                color: 'textSecondary',
                                                noWrap: true,
                                                fontSize: '0.875rem',
                                                // CORREÇÃO: Usar paddingX para consistência.
                                                paddingX: 1
                                            }} 
                                        />
                                    </ListItem>
                                )}
                            </List>
                        )}
                    </Collapse>
                </nav>
            </Box>
            
            {/* 3. Botão Criar Curso (Fixo na parte inferior) */}
            <Box>
                <Divider />
                {/* CORREÇÃO: Usar p: 1 para o padding da Box */}
                <Box sx={{ p: 1 }}> 
                    <Button
                        variant='contained'
                        fullWidth
                        disableElevation
                        LinkComponent={Link}
                        to={'/criar'}
                        onClick={handleLinkClick} 
                        sx={{ transition: 'none' }}
                        color='success'
                    >
                        Criar Curso
                    </Button>
                </Box>
            </Box>
        </Box>
    );
    // --- Fim da Definição do Conteúdo do Drawer (const drawer) ---


    return (
        <>
            {/* AppBar (Topo) */}
            <AppBar elevation={0} color='inherit' position="fixed" 
                sx={{ 
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider', 
                }}
            >
                <Toolbar sx={{ paddingX: 1, minHeight: '56px!important' }}>
                    {/* Ícone Menu (Mobile) */}
                    <IconButton
                        color='inherit'
                        onClick={handleDrawerToggle}
                        sx={{
                            display: { xs: 'flex', sm: 'none' },
                            mr: 1
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                    {/* Logo/Título */}
                    <Typography 
                        variant="h6" color='primary' noWrap component={Link} to={'/'} 
                        sx={{ alignItems: 'center', display: 'flex', textDecoration: 'none', lineHeight: 1, outline: 'none' }}
                    >
                        <RocketLaunchIcon color='primary' />
                    </Typography>
                    {/* SearchField e MenuResponsive */}
                    <SearchField />
                    <Box flexGrow={1} />
                    <MenuResponsive />
                    <Box flexGrow={1} />
                    {/* Ações Diretas */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            color='inherit'
                            LinkComponent={Link}
                            to='/criar'
                            onClick={handleLinkClick} 
                        >
                            <AddIcon />
                        </IconButton>
                        <IconButton
                            color='inherit'
                            onClick={toggleDarkMode}
                        >
                            {darkMode ? <DarkModeIcon /> : <LightModeIcon />}
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                // O Drawer (permanente) deve ocupar o espaço (drawerWidth) no layout principal.
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 }, minHeight: '100dvh' }}
            >
                {/* 1. Drawer Mobile (temporário) */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onTransitionEnd={handleDrawerTransitionEnd}
                    onClose={handleDrawerClose}
                    ModalProps={{ keepMounted: true }} 
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        // Garantindo que o Drawer Paper (o conteúdo) tenha 100% da altura e largura correta.
                        '& .MuiDrawer-paper': { 
                            backgroundImage: 'inherit', 
                            boxSizing: 'border-box', 
                            width: drawerWidth, 
                            height: '100%' 
                        }, 
                        zIndex: (theme) => theme.zIndex.drawer + 2
                    }}
                >
                    {/* AppBar interna para o Mobile (cabeçalho) */}
                    <AppBar color='inherit' elevation={0} position="sticky" 
                        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                        {/* CORREÇÃO: Usar paddingX no Toolbar interno também */}
                        <Toolbar sx={{paddingX: 1, minHeight: '56px!important' }}>
                            <IconButton color='inherit' onClick={handleDrawerToggle} sx={{ mr: 1 }}>
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" color='primary' noWrap sx={{ alignItems: 'center', display: 'flex', lineHeight: 1 }}>
                                <RocketLaunchIcon color='primary' />
                            </Typography>
                            <Box flexGrow={1} />
                        </Toolbar>
                    </AppBar>
                    {/* Conteúdo principal do Drawer */}
                    {drawer}
                </Drawer>

                {/* 2. Drawer Desktop (permanente) */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { 
                            boxSizing: 'border-box', 
                            width: drawerWidth, 
                            height: '100%', 
                            // Propriedades adicionais para manter a aparência visual
                            backgroundImage: 'inherit',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                        },
                    }}
                    open
                >
                    {/* Conteúdo principal do Drawer */}
                    {drawer}
                </Drawer>
            </Box>
        </>
    );
};

export default Sidebar;