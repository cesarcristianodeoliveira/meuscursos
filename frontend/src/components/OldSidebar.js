import React from 'react'
import { Box, Typography, List, ListItemButton, ListItemText, Button, CircularProgress } from '@mui/material'
import { Link } from 'react-router-dom'
import { useCourse } from '../context/CourseContext'

const Sidebar = () => {
  const { courses, loading, reloadCourses } = useCourse()

  return React.createElement(
    Box,
    {
      sx: {
        width: 300,
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }
    },
    [
      // 🔹 Top section
      React.createElement(Box, { key: 'top', sx: { display: 'flex', flexDirection: 'column' } },
        [
          React.createElement(Typography, {
            key: 'brand',
            variant: 'h6',
            color: 'primary',
            style: { paddingLeft: '16px', paddingRight: '16px', marginTop: '16px', marginBottom: '16px', marginRight: 'auto', textDecoration: 'none', fontWeight: 'bold', lineHeight: 1 },
            component: Link,
            to: `/`
          }, 'Meus Cursos'),

          React.createElement(Typography, {
            key: 'subtitle',
            variant: 'caption',
            sx: { px: 2 }
          }, 'Cursos'),

          // 🔹 Loading indicator
          loading
            ? React.createElement(Box, { key: 'loadingBox', sx: { p: 2 } },
                React.createElement(CircularProgress, { size: 16 }))
            : React.createElement(List, { key: 'list' },
                courses.length
                  ? courses.map(c => {
                      // ✅ Agora slug é sempre string
                      const slug = typeof c.slug === 'object' ? c.slug.current : c.slug
                      const key = c._id || c.id || slug

                      return React.createElement(ListItemButton, {
                        key,
                        component: Link,
                        to: `/curso/${slug}`,
                        sx: { mb: 0.5 },
                        title: c.title
                      },
                        React.createElement(ListItemText, {
                          primary: c.title,
                          primaryTypographyProps: { noWrap: true },
                        })
                      )
                    })
                  : React.createElement(Typography, {
                      key: 'none',
                      variant: 'body2',
                      color: 'textSecondary',
                      sx: { py: 1, px: 2 },
                    }, 'Nenhum curso no momento')
              )
        ]
      ),

      // 🔹 Bottom section (botão criar curso)
      React.createElement(Box, { key: 'bottom' },
        React.createElement(Button, {
          key: 'button',
          sx: { borderRadius: 0, boxShadow: 'none' },
          fullWidth: true,
          variant: 'contained',
          size: 'large',
          component: Link,
          to: '/novo',
          onClick: reloadCourses,
        }, 'Criar Curso')
      )
    ]
  )
}

export default Sidebar
