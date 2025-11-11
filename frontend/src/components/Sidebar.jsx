import React, { useState, useMemo } from 'react'
import { useLocation, Link, matchPath } from 'react-router-dom'
import {
  AppBar, Toolbar, IconButton, Typography, Box, Drawer, List,
  ListSubheader, ListItem, ListItemButton, ListItemText, Divider,
  CircularProgress, Button, Collapse, ListItemIcon
} from '@mui/material'

// Contextos
import { useThemeContext } from '../context/ThemeContext'
import { useCourse } from '../context/CourseContext'

// Ícones
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import MenuIcon from '@mui/icons-material/Menu'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SchoolIcon from '@mui/icons-material/School'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

// Componentes auxiliares
import SearchField from './SearchField'
import MenuResponsive from './MenuResponsive'
import IconResolver from './IconResolver'

// --- Rotas principais ---
const mainRoutes = [
  { label: 'Painel', path: '/', icon: DashboardIcon, exact: true },
  { label: 'Cursos', path: '/cursos', icon: SchoolIcon, exact: false },
]

// --- Hook customizado para detectar rota ativa ---
const useIsActive = (path, exact) => {
  const location = useLocation()
  const matchOptions = { path, end: exact }
  const match = matchPath(matchOptions, location.pathname)

  if (exact) return !!match
  if (!match) return false
  
  // Para rotas não exatas, verifica se é a rota base ou uma sub-rota
  if (path === '/cursos') {
    return location.pathname === '/cursos' || location.pathname.startsWith('/cursos/')
  }
  
  const nextChar = location.pathname.charAt(path.length)
  return match.path === path && (nextChar === '' || nextChar === '/')
}

// --- Link padrão ---
const SidebarLink = ({ to, label, icon: Icon, onClick, exact = false }) => {
  const isActive = useIsActive(to, exact)
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
            '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
            '& .MuiListItemText-primary': {
              color: (theme) => theme.palette.primary.main,
              fontWeight: 600,
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
              mb: 0, mt: 0, pb: '3px', pt: '5px'
            }
          }}
        />
      </ListItemButton>
    </ListItem>
  )
}

// --- Link de curso ---
const CourseSidebarLink = ({ to, title, secondaryText, onClick, isActive, iconName }) => (
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
          '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
          '& .MuiListItemText-primary': {
            color: (theme) => theme.palette.primary.main,
            fontWeight: 600,
          },
          '& .MuiListItemText-secondary': {
            color: (theme) => theme.palette.primary.main,
            opacity: 0.8,
          },
          '& .MuiListItemIcon-root': {
            color: (theme) => theme.palette.primary.main,
          }
        },
      }}
    >
      {iconName && (
        <ListItemIcon sx={{ 
          minWidth: 32, 
          mr: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
        }}>
          <IconResolver 
            iconName={iconName} 
            fontSize='small'
          />
        </ListItemIcon>
      )}
      <ListItemText
        primary={title}
        primaryTypographyProps={{
          noWrap: true,
          fontSize: '0.875rem'
        }}
        secondary={secondaryText}
        secondaryTypographyProps={{ noWrap: true }}
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '48px',
          marginLeft: iconName ? 0 : 1
        }}
      />
    </ListItemButton>
  </ListItem>
)

// --- Componente principal ---
const Sidebar = () => {
  const { courses, loading } = useCourse()
  const { drawerWidth, darkMode, toggleDarkMode } = useThemeContext()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [openCourses, setOpenCourses] = useState(true)

  const handleDrawerClose = () => {
    setIsClosing(true)
    setMobileOpen(false)
  }

  const handleDrawerTransitionEnd = () => setIsClosing(false)
  const handleDrawerToggle = () => !isClosing && setMobileOpen(!mobileOpen)
  const handleLinkClick = () => mobileOpen && handleDrawerClose()
  const handleCoursesClick = () => setOpenCourses(!openCourses)

  // --- Slug ativo ---
  const courseMatch = matchPath('/curso/:slug', location.pathname)
  const activeSlug = courseMatch ? courseMatch.params.slug : null

  // --- Ordenação garantida (desc) ---
  const sortedCourses = useMemo(() => {
    if (!courses || courses.length === 0) return []
    return [...courses].sort((a, b) => {
      const dateA = new Date(a._createdAt || 0)
      const dateB = new Date(b._createdAt || 0)
      return dateB - dateA // mais novos primeiro
    })
  }, [courses])

  // --- Drawer ---
  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Toolbar sx={{ px: [0], minHeight: '56px!important', display: { xs: 'none', sm: 'flex' } }} />

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Conteúdo rolável */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Rotas principais */}
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

          {/* Cursos Recentes */}
          <nav>
            <ListSubheader
              component={ListItemButton}
              onClick={handleCoursesClick}
              sx={{
                transition: 'none',
                px: [1],
                minHeight: 36,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                py: 0,
                '&.MuiListSubheader-root:hover': {
                  bgcolor: 'background.paper',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                <AutoAwesomeIcon fontSize='small' />
              </ListItemIcon>
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

            <Collapse in={openCourses} timeout="auto" unmountOnExit>
              {loading ? (
                <Box sx={{ alignItems: 'center', display: 'flex', p: 1 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                <List dense sx={{ p: [0] }}>
                  {sortedCourses.length ? (
                    sortedCourses.map(c => {
                      const slug = typeof c.slug === 'object' ? c.slug.current : c.slug
                      const key = c._id || c.id || slug
                      const courseIsActive = slug === activeSlug
                      const category = c.category?.title || 'Categoria Desconhecida'
                      const subCategory = c.subcategory?.title ? ` - ${c.subcategory.title}` : ''
                      const secondaryText = `${category}${subCategory}`
                      
                      // Obtém o nome do ícone da categoria (pode ser null)
                      const iconName = c.category?.icon || null

                      return (
                        <CourseSidebarLink
                          key={key}
                          to={`/curso/${slug}`}
                          title={c.title}
                          secondaryText={secondaryText}
                          onClick={handleLinkClick}
                          isActive={courseIsActive}
                          iconName={iconName}
                        />
                      )
                    })
                  ) : (
                    <ListItem disablePadding>
                      <ListItemText
                        primary="Nenhum curso no momento"
                        primaryTypographyProps={{
                          color: 'textSecondary',
                          noWrap: true,
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

        {/* Botão Criar Curso - FIXO NO BOTTOM */}
        <Box sx={{ mt: 'auto', flexShrink: 0 }}>
          <Divider />
          <Box sx={{ p: [1] }}>
            <Button
              variant='contained'
              fullWidth
              disableElevation
              LinkComponent={Link}
              to='/criar'
              onClick={handleLinkClick}
              sx={{ transition: 'none' }}
              color='success'
            >
              Criar Curso
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  // --- Renderização principal ---
  return (
    <>
      <AppBar
        elevation={0}
        color='inherit'
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ px: [1], minHeight: '56px!important' }}>
          <Typography
            variant="h6"
            color='primary'
            noWrap
            component={Link}
            to='/'
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', lineHeight: 1 }}
          >
            <RocketLaunchIcon color='primary' />
          </Typography>

          <SearchField />
          <Box flexGrow={1} />
          <MenuResponsive />
          <Box flexGrow={1} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color='inherit' LinkComponent={Link} to='/criar' onClick={handleLinkClick}>
              <AddIcon />
            </IconButton>
            <IconButton color='inherit' onClick={toggleDarkMode}>
              {darkMode ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
            <IconButton
              color='inherit'
              onClick={handleDrawerToggle}
              sx={{ display: { xs: 'flex', sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer Mobile - CORRIGIDO: 100% width e animação da direita pra esquerda */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 }, minHeight: '100dvh' }}>
        <Drawer
          variant="temporary"
          anchor="right"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              backgroundImage: 'inherit',
              boxSizing: 'border-box',
              width: '100%',
              height: '100%',
            },
            zIndex: (theme) => theme.zIndex.drawer + 2,
          }}
        >
          <AppBar color='inherit' elevation={0} position="sticky" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Toolbar sx={{ px: [1], minHeight: '56px!important' }}>
              <Typography variant="h6" color='primary' noWrap sx={{ display: 'flex', alignItems: 'center', lineHeight: 1, flexGrow: 1 }}>
                <RocketLaunchIcon color='primary' />
              </Typography>
              <IconButton color='inherit' onClick={handleDrawerToggle}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          {drawer}
        </Drawer>

        {/* Drawer Desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth, 
              height: '100%',
              overflow: 'hidden'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  )
}

export default Sidebar