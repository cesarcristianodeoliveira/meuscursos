// src/App.js
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import { CourseProvider } from './context/CourseContext'
import { ThemeContext } from './context/ThemeContext'
// import TopProgress from './components/TopProgress'
import Sidebar from './components/Sidebar'
import Welcome from './pages/Welcome'
import CoursesPage from './pages/CoursesPage'
import CoursePage from './pages/CoursePage'
import NewCourseWizard from './pages/NewCourseWizard'
import GeneratingCourse from './pages/GeneratingCourse'

const App = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <CourseProvider>
        <ThemeContext>
          <BrowserRouter>
            {/* <TopProgress /> */}
            <Sidebar />
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/cursos" element={<CoursesPage />} />
                <Route path="/curso/:slug" element={<CoursePage />} />
                <Route path="/criar" element={<NewCourseWizard />} />
                <Route path="/curso/gerando" element={<GeneratingCourse />} />
              </Routes>
            </Box>
          </BrowserRouter>
        </ThemeContext>
      </CourseProvider>
    </Box>
  )
}

export default App
