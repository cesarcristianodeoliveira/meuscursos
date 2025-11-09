import React, { useState, useMemo } from 'react';
// Importações adicionais necessárias do React Router
import { useLocation, Link, matchPath } from 'react-router-dom';

// Importações do Contexto (assumindo que estão corretas)
// O aviso de ESLint foi silenciado aqui: 'useThemeContext' is defined but never used
// eslint-disable-next-line no-unused-vars
import { useThemeContext } from '../context/ThemeContext';
// O aviso de ESLint foi silenciado aqui: 'useCourse' is defined but never used
// eslint-disable-next-line no-unused-vars
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

    const match = matchPath(matchOptions, location.pathname);

    if (exact) {
        return !!match;
    } else {
        if (!match) return false;
        const nextChar = location.pathname.charAt(path.length);
        return match.path === path && (nextChar === '' || nextChar === '/');
    }
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
                    '&.MuiListItemButton-root': { px: [1] },
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
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                        <Icon fontSize='small' />
                    </ListItemIcon>
                )}
                <ListItemText
                    primary={label}
                    primaryTypographyProps={{ noWrap: true }}
                    sx={{
                        '&.MuiListItemText-root': {
                            mb: 0,
                            mt: 0,
                            pb: '3px',
                            pt: '5px'
                        }
                    }}
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
                    '&.MuiListItemButton-root': { px: [1] },
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
                        // NOVO: Adicionado fontSize para manter a consistência de tamanho (0.875rem)
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
        if (mobileOpen) {
            handleDrawerClose();
        }
    };
    
    const handleCoursesClick = () => {
        setOpenCourses(!openCourses);
    };
    
    // Lógica para Identificar o Slug Ativo
    const courseMatch = matchPath('/curso/:slug', location.pathname);
    const activeSlug = courseMatch ? courseMatch.params.slug : null;


    // Lógica de Ordenação dos Cursos (useMemo) - CORRIGIDA
    const sortedCourses = useMemo(() => {
        if (!courses || courses.length === 0) return [];

        return [...courses].sort((a, b) => {
            // Prioriza updatedAt, depois createdAt, e por último _id (se as datas não existirem)
            const dateStringA = a.updatedAt || a.createdAt || a._id;
            const dateStringB = b.updatedAt || b.createdAt || b._id;

            // Converte para objeto Date para garantir comparação correta
            const dateA = new Date(dateStringA);
            const dateB = new Date(dateStringB);
            
            // Ordenação do mais novo para o mais antigo (Decrescente)
            // Usa getTime() para garantir que a comparação seja feita com timestamps numéricos
            if (dateA.getTime() > dateB.getTime()) return -1;
            if (dateA.getTime() < dateB.getTime()) return 1;
            
            return 0;
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
            <Toolbar sx={{ px: [0], minHeight: '56px!important', display: { xs: 'none', sm: 'flex' } }} /> 
            
            {/* 2. CONTÊINER ROLÁVEL COMPLETO: flexGrow: 1, overflowY: 'auto' */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            
                {/* 2.1. Rotas Principais */}
                <nav>
                    <List dense sx={{ p: [0] }}>
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
                            px: [1], 
                            // CORREÇÃO: minHeight para 36px
                            minHeight: 36, 
                            
                            bgcolor: 'background.paper', 
                            color: 'text.primary',
                            
                            display: 'flex',
                            alignItems: 'center',
                            
                            paddingTop: 0,
                            paddingBottom: 0,
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
                            <List dense sx={{ p: [0] }}>
                                {sortedCourses.length ? (
                                    sortedCourses.map(c => {
                                        const slug = typeof c.slug === 'object' ? c.slug.current : c.slug;
                                        const key = c._id || c.id || slug;
                                        const courseIsActive = slug === activeSlug;
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
                                                // NOVO: Adicionado fontSize para consistência
                                                fontSize: '0.875rem',
                                                px: [1]
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
                <Box sx={{ p: [1] }}>
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
                <Toolbar sx={{ px: [1], minHeight: '56px!important' }}>
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
                    <Typography 
                        variant="h6" color='primary' noWrap component={Link} to={'/'} 
                        sx={{ alignItems: 'center', display: 'flex', textDecoration: 'none', lineHeight: 1, outline: 'none' }}
                    >
                        <RocketLaunchIcon color='primary' />
                    </Typography>
                    <SearchField />
                    <Box flexGrow={1} />
                    <MenuResponsive />
                    <Box flexGrow={1} />
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
                        '& .MuiDrawer-paper': { backgroundImage: 'inherit', boxSizing: 'border-box', width: drawerWidth, height: '100%' }, 
                        zIndex: (theme) => theme.zIndex.drawer + 2
                    }}
                >
                    <AppBar color='inherit' elevation={0} position="sticky" 
                        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                        <Toolbar sx={{px: [1], minHeight: '56px!important' }}>
                            <IconButton color='inherit' onClick={handleDrawerToggle} sx={{ mr: 1 }}>
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" color='primary' noWrap sx={{ alignItems: 'center', display: 'flex', lineHeight: 1 }}>
                                <RocketLaunchIcon color='primary' />
                            </Typography>
                            <Box flexGrow={1} />
                        </Toolbar>
                    </AppBar>
                    {drawer}
                </Drawer>

                {/* 2. Drawer Desktop (permanente) */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, height: '100%' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
        </>
    );
};

export default Sidebar;