import React from 'react'
import { 
  Box, 
  Typography,
  Grid,
  Toolbar
} from '@mui/material'
import StatCard from '../components/data/StatCard'
import CreateCourseCard from '../components/data/CreateCourseCard'
import { useCourse } from '../context/CourseContext'
import ChartProvider from '../components/data/ChartProvider'

const Welcome = () => {
  const { stats } = useCourse()

  const publishedCourses = stats?.publishedCourses || 0;
  const totalLessons = stats?.totalLessons || 0;
  const totalExercises = stats?.totalExercises || 0;
  const courseChartData = stats?.chartData || [];
  const lessonChartData = stats?.lessonChartData || [];
  const exerciseChartData = stats?.exerciseChartData || [];
  const chartLabels = stats?.chartLabels || [];
  
  const courseCardData = {
    title: 'Cursos',
    value: publishedCourses.toString(),
    interval: 'Últimos 30 dias',
    trend: publishedCourses > 0 ? 'up' : null,
    data: courseChartData,
    chartLabels: chartLabels,
  }

  const lessonCardData = {
    title: 'Aulas',
    value: totalLessons.toString(),
    interval: 'Últimos 30 dias',
    data: lessonChartData,
    chartLabels: chartLabels,
  }

  const exerciseCardData = {
    title: 'Exercícios',
    value: totalExercises.toString(),
    interval: 'Últimos 30 dias',
    data: exerciseChartData,
    chartLabels: chartLabels,
  }

  return (
    <Box 
      sx={{ 
        width: '100%',
        px: [1]
      }}
    >
      <Toolbar sx={{ px: [0], minHeight: '56px!important' }} />
      <Typography component="h2" variant="h6" sx={{ my: 1.5, lineHeight: 1 }}>
        Painel
      </Typography>
      <Grid
        container
        spacing={1}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(1) }}
      >
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard {...courseCardData} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard {...lessonCardData} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard {...exerciseCardData} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <CreateCourseCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <ChartProvider />
        </Grid>
      </Grid>
    </Box>
  )
}

export default Welcome