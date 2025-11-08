const express = require('express')
const router = express.Router()
const client = require('../config/sanityClient.js')

// --- 🔹 /all (categorias, subcategorias, tags e cursos resumidos) ---
router.get('/all', async (req, res) => {
  try {
    const [categories, subcategories, tags, courses] = await Promise.all([
      client.fetch(`*[_type == "category"]{_id, title} | order(title asc)`),
      client.fetch(`*[_type == "subcategory"]{_id, title, category->{_id, title}} | order(title asc)`),
      client.fetch(`*[_type == "tag"]{_id, title, subcategory->{_id, title}} | order(title asc)`),
      client.fetch(`*[_type == "course"]{
        _id,
        title,
        "slug": slug.current,
        description,
        level,
        duration,
        category->{_id, title},
        subcategory->{_id, title},
        tags[]->{_id, title},
        status,
        provider
      } | order(_createdAt desc)`),
    ])

    res.json({ categories, subcategories, tags, courses })
  } catch (err) {
    console.error('❌ Erro /all', err)
    res.status(500).json({ error: 'Erro ao buscar todos os dados' })
  }
})

// --- 🔹 Categorias ---
router.get('/categories', async (_, res) => {
  try {
    const data = await client.fetch(`*[_type == "category"]{_id, title} | order(title asc)`)
    res.json(data)
  } catch (err) {
    console.error('❌ Erro /categories', err)
    res.status(500).json({ error: 'Erro ao buscar categorias' })
  }
})

// --- 🔹 Subcategorias ---
router.get('/subcategories', async (req, res) => {
  try {
    const { categoryId } = req.query
    const query = categoryId
      ? `*[_type == "subcategory" && references($categoryId)]{_id, title, category->{_id, title}} | order(title asc)`
      : `*[_type == "subcategory"]{_id, title, category->{_id, title}} | order(title asc)`
    const data = await client.fetch(query, { categoryId })
    res.json(data)
  } catch (err) {
    console.error('❌ Erro /subcategories', err)
    res.status(500).json({ error: 'Erro ao buscar subcategorias' })
  }
})

// --- 🔹 Tags ---
router.get('/tags', async (req, res) => {
  try {
    const { subcategoryId } = req.query
    const query = subcategoryId
      ? `*[_type == "tag" && references($subcategoryId)]{_id, title, subcategory->{_id, title}} | order(title asc)`
      : `*[_type == "tag"]{_id, title, subcategory->{_id, title}} | order(title asc)`
    const data = await client.fetch(query, { subcategoryId })
    res.json(data)
  } catch (err) {
    console.error('❌ Erro /tags', err)
    res.status(500).json({ error: 'Erro ao buscar tags' })
  }
})

// --- 🔹 Cursos (resumo) ---
router.get('/courses', async (_, res) => {
  try {
    const data = await client.fetch(`*[_type == "course"]{
      _id,
      title,
      "slug": slug.current,
      description,
      level,
      duration,
      category->{_id, title},
      subcategory->{_id, title},
      tags[]->{_id, title},
      status,
      provider
    } | order(_createdAt desc)`)
    res.json(data)
  } catch (err) {
    console.error('❌ Erro /courses', err)
    res.status(500).json({ error: 'Erro ao buscar cursos' })
  }
})

// --- 🔹 Curso por ID ---
router.get('/course/:id', async (req, res) => {
  try {
    const { id } = req.params
    const query = `*[_type == "course" && _id == $id][0]{
      _id,
      title,
      "slug": slug.current,
      description,
      level,
      duration,
      category->{_id, title},
      subcategory->{_id, title},
      tags[]->{_id, title},
      thumbnail->{_id, title, url},
      video->{_id, title, url},
      certificate,
      audioMasculino{asset->{url}},
      audioFeminino{asset->{url}},
      provider,
      status,
      modules[]{
        _key,
        title,
        description,
        lessons[]{
          _key,
          title,
          content,
          tips,
          exercises[]{
            _key,
            question,
            answer,
            options
          }
        }
      }
    }`

    const course = await client.fetch(query, { id })
    if (!course) return res.status(404).json({ error: 'Curso não encontrado' })

    res.json(course)
  } catch (err) {
    console.error('❌ Erro /course/:id', err)
    res.status(500).json({ error: 'Erro ao buscar curso por ID' })
  }
})

// --- 🔹 Curso por SLUG ---
router.get('/course/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const query = `*[_type == "course" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      description,
      level,
      duration,
      category->{_id, title},
      subcategory->{_id, title},
      tags[]->{_id, title},
      thumbnail->{_id, title, url},
      video->{_id, title, url},
      certificate,
      audioMasculino{asset->{url}},
      audioFeminino{asset->{url}},
      provider,
      status,
      modules[]{
        _key,
        title,
        description,
        lessons[]{
          _key,
          title,
          content,
          tips,
          exercises[]{
            _key,
            question,
            answer,
            options
          }
        }
      }
    }`

    const course = await client.fetch(query, { slug })
    if (!course) return res.status(404).json({ error: 'Curso não encontrado' })

    res.json(course)
  } catch (err) {
    console.error('❌ Erro /course/slug/:slug', err)
    res.status(500).json({ error: 'Erro ao buscar curso por slug' })
  }
})

// --- 🔹 Estatísticas dos Cursos, Lessons e Exercises ---
router.get('/stats', async (req, res) => {
  try {
    const totalCourses = await client.fetch(`count(*[_type == "course"])`);
    
    const publishedCourses = await client.fetch(`count(*[_type == "course" && status == "published"])`);
    
    // 👇 BUSCA TODOS os cursos com modules, lessons e exercises
    const allCoursesWithContent = await client.fetch(`
      *[_type == "course"]{
        _createdAt,
        title,
        status,
        "totalLessons": count(modules[].lessons[]),
        "totalExercises": count(modules[].lessons[].exercises[])
      }
    `);

    // 👇 Calcula totais
    const totalLessons = allCoursesWithContent.reduce((sum, course) => sum + (course.totalLessons || 0), 0);
    const totalExercises = allCoursesWithContent.reduce((sum, course) => sum + (course.totalExercises || 0), 0);
    
    // 👇 BUSCA cursos publicados para gráficos
    const allPublishedCourses = await client.fetch(`
      *[_type == "course" && status == "published"]{
        _createdAt,
        title,
        status
      } | order(_createdAt desc)
    `);

    const allCoursesForCharts = await client.fetch(`
      *[_type == "course" && status == "published"]{
        _createdAt,
        title,
        status,
        "lessonsCount": count(modules[].lessons[]),
        "exercisesCount": count(modules[].lessons[].exercises[])
      } | order(_createdAt asc)
    `);

    // 👇 Inicializa dados para gráficos
    const dailyCourseData = {};
    const dailyLessonData = {};
    const dailyExerciseData = {};
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      const dayLabel = `${monthName} ${date.getDate()}`;
      dailyCourseData[dayLabel] = 0;
      dailyLessonData[dayLabel] = 0;
      dailyExerciseData[dayLabel] = 0;
    }
    
    // 👇 Preenche com CURSOS
    allPublishedCourses.forEach((course) => {
      try {
        const courseDate = new Date(course._createdAt);
        const monthName = courseDate.toLocaleDateString('pt-BR', { month: 'short' });
        const dayLabel = `${monthName} ${courseDate.getDate()}`;
        
        if (dailyCourseData[dayLabel] !== undefined) {
          dailyCourseData[dayLabel] += 1;
        }
      } catch (err) {
        console.warn('⚠️ Erro ao processar data do curso:', course._id);
      }
    });

    // 👇 Preenche com LESSONS e EXERCISES
    allCoursesForCharts.forEach((course) => {
      try {
        const courseDate = new Date(course._createdAt);
        const monthName = courseDate.toLocaleDateString('pt-BR', { month: 'short' });
        const dayLabel = `${monthName} ${courseDate.getDate()}`;
        
        if (dailyLessonData[dayLabel] !== undefined && course.lessonsCount > 0) {
          dailyLessonData[dayLabel] += course.lessonsCount;
        }
        
        if (dailyExerciseData[dayLabel] !== undefined && course.exercisesCount > 0) {
          dailyExerciseData[dayLabel] += course.exercisesCount;
        }
      } catch (err) {
        console.warn('⚠️ Erro ao processar data do curso para conteúdo:', course._id);
      }
    });

    const chartLabels = Object.keys(dailyCourseData);
    const courseChartData = Object.values(dailyCourseData);
    const lessonChartData = Object.values(dailyLessonData);
    const exerciseChartData = Object.values(dailyExerciseData);

    res.json({
      totalCourses: totalCourses,
      publishedCourses: publishedCourses, 
      totalLessons: totalLessons,
      totalExercises: totalExercises,
      chartData: courseChartData,
      lessonChartData: lessonChartData,
      exerciseChartData: exerciseChartData,
      chartLabels,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('❌ Erro /stats', err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router
