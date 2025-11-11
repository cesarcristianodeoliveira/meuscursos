const express = require('express')
const router = express.Router()
const client = require('../config/sanityClient.js')

// --- 🔹 /all (categorias, subcategororias, tags e cursos resumidos) ---
router.get('/all', async (req, res) => {
  try {
    const [categories, subcategories, tags, courses] = await Promise.all([
      // Categoria
      client.fetch(`*[_type == "category"] | order(title asc) {
        _id, title, icon, "slug": slug.current
      }`),

      // Subcategoria
      client.fetch(`*[_type == "subcategory"] | order(title asc) {
        _id, title, icon, "slug": slug.current,
        category->{_id, title}
      }`),

      // Tag
      client.fetch(`*[_type == "tag"] | order(title asc) {
        _id, title, "slug": slug.current,
        subcategory->{_id, title}
      }`),

      // Curso — ordenação decrescente por data de atualização e criação
      client.fetch(`*[_type == "course"] | order(_updatedAt desc, _createdAt desc) {
        _id,
        _createdAt,
        _updatedAt,
        title,
        "slug": slug.current,
        description,
        level,
        duration,
        category->{_id, title, icon, "slug": slug.current},
        subcategory->{_id, title, icon, "slug": slug.current},
        tags[]->{_id, title, "slug": slug.current},
        thumbnail->{_id, title, url},
        video->{_id, title, url},
        certificate,
        audioMasculino{asset->{url}},
        audioFeminino{asset->{url}},
        provider,
        status,
        modules[] {
          _key,
          title,
          description,
          lessons[] {
            _key,
            title,
            content,
            tips,
            exercises[] {
              _key,
              question,
              answer,
              options
            }
          }
        }
      }`)
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
    const data = await client.fetch(
      `*[_type == "category"] | order(title asc) {
        _id, title, "slug": slug.current, icon
      }`
    )
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
      ? `*[_type == "subcategory" && references($categoryId)] | order(title asc) {
          _id, title, "slug": slug.current, icon,
          category->{_id, title}
        }`
      : `*[_type == "subcategory"] | order(title asc) {
          _id, title, "slug": slug.current, icon,
          category->{_id, title}
        }`
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
      ? `*[_type == "tag" && references($subcategoryId)] | order(title asc) {
          _id, title, "slug": slug.current,
          subcategory->{_id, title}
        }`
      : `*[_type == "tag"] | order(title asc) {
          _id, title, "slug": slug.current,
          subcategory->{_id, title}
        }`
    const data = await client.fetch(query, { subcategoryId })
    res.json(data)
  } catch (err) {
    console.error('❌ Erro /tags', err)
    res.status(500).json({ error: 'Erro ao buscar tags' })
  }
})

// --- 🔹 Cursos (completo) ---
router.get('/courses', async (_, res) => {
  try {
    const data = await client.fetch(`*[_type == "course"] | order(_updatedAt desc, _createdAt desc) {
      _id,
      _createdAt,
      _updatedAt,
      title,
      "slug": slug.current,
      description,
      level,
      duration,
      category->{_id, title, icon, "slug": slug.current},
      subcategory->{_id, title, icon, "slug": slug.current},
      tags[]->{_id, title, "slug": slug.current},
      thumbnail->{_id, title, url},
      video->{_id, title, url},
      certificate,
      audioMasculino{asset->{url}},
      audioFeminino{asset->{url}},
      provider,
      status,
      modules[] {
        _key,
        title,
        description,
        lessons[] {
          _key,
          title,
          content,
          tips,
          exercises[] {
            _key,
            question,
            answer,
            options
          }
        }
      }
    }`)
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
      _createdAt,
      _updatedAt,
      title,
      "slug": slug.current,
      description,
      level,
      duration,
      category->{_id, title, icon, "slug": slug.current},
      subcategory->{_id, title, icon, "slug": slug.current},
      tags[]->{_id, title, "slug": slug.current},
      thumbnail->{_id, title, url},
      video->{_id, title, url},
      certificate,
      audioMasculino{asset->{url}},
      audioFeminino{asset->{url}},
      provider,
      status,
      modules[] {
        _key,
        title,
        description,
        lessons[] {
          _key,
          title,
          content,
          tips,
          exercises[] {
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
      _createdAt,
      _updatedAt,
      title,
      "slug": slug.current,
      description,
      level,
      duration,
      category->{_id, title, icon, "slug": slug.current},
      subcategory->{_id, title, icon, "slug": slug.current},
      tags[]->{_id, title, "slug": slug.current},
      thumbnail->{_id, title, url},
      video->{_id, title, url},
      certificate,
      audioMasculino{asset->{url}},
      audioFeminino{asset->{url}},
      provider,
      status,
      modules[] {
        _key,
        title,
        description,
        lessons[] {
          _key,
          title,
          content,
          tips,
          exercises[] {
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

// --- 🔹 Estatísticas ---
router.get('/stats', async (req, res) => {
  try {
    const totalCourses = await client.fetch(`count(*[_type == "course"])`)
    const publishedCourses = await client.fetch(`count(*[_type == "course" && status == "published"])`)

    // 🔄 CORREÇÃO: Busca todos os cursos completos (igual outras rotas)
    const allCoursesWithContent = await client.fetch(`
      *[_type == "course"] | order(_updatedAt desc, _createdAt desc) {
        _id,
        _createdAt,
        _updatedAt,
        title,
        "slug": slug.current,
        description,
        level,
        duration,
        category->{_id, title, icon, "slug": slug.current},
        subcategory->{_id, title, icon, "slug": slug.current},
        tags[]->{_id, title, "slug": slug.current},
        thumbnail->{_id, title, url},
        video->{_id, title, url},
        certificate,
        audioMasculino{asset->{url}},
        audioFeminino{asset->{url}},
        provider,
        status,
        modules[] {
          _key,
          title,
          description,
          lessons[] {
            _key,
            title,
            content,
            tips,
            exercises[] {
              _key,
              question,
              answer,
              options
            }
          }
        },
        "totalLessons": count(modules[].lessons[]),
        "totalExercises": count(modules[].lessons[].exercises[])
      }
    `)

    const totalLessons = allCoursesWithContent.reduce((sum, c) => sum + (c.totalLessons || 0), 0)
    const totalExercises = allCoursesWithContent.reduce((sum, c) => sum + (c.totalExercises || 0), 0)

    // 🔄 CORREÇÃO: Busca cursos publicados completos
    const allPublishedCourses = await client.fetch(`
      *[_type == "course" && status == "published"] | order(_updatedAt desc, _createdAt desc) {
        _id,
        _createdAt,
        _updatedAt,
        title,
        "slug": slug.current,
        description,
        level,
        duration,
        category->{_id, title, icon, "slug": slug.current},
        subcategory->{_id, title, icon, "slug": slug.current},
        tags[]->{_id, title, "slug": slug.current},
        thumbnail->{_id, title, url},
        video->{_id, title, url},
        certificate,
        audioMasculino{asset->{url}},
        audioFeminino{asset->{url}},
        provider,
        status,
        modules[] {
          _key,
          title,
          description,
          lessons[] {
            _key,
            title,
            content,
            tips,
            exercises[] {
              _key,
              question,
              answer,
              options
            }
          }
        }
      }
    `)

    // 🔄 CORREÇÃO: Busca cursos para gráficos completos
    const allCoursesForCharts = await client.fetch(`
      *[_type == "course" && status == "published"] | order(_updatedAt desc, _createdAt desc) {
        _id,
        _createdAt,
        _updatedAt,
        title,
        "slug": slug.current,
        description,
        level,
        duration,
        category->{_id, title, icon, "slug": slug.current},
        subcategory->{_id, title, icon, "slug": slug.current},
        tags[]->{_id, title, "slug": slug.current},
        thumbnail->{_id, title, url},
        video->{_id, title, url},
        certificate,
        audioMasculino{asset->{url}},
        audioFeminino{asset->{url}},
        provider,
        status,
        modules[] {
          _key,
          title,
          description,
          lessons[] {
            _key,
            title,
            content,
            tips,
            exercises[] {
              _key,
              question,
              answer,
              options
            }
          }
        },
        "lessonsCount": count(modules[].lessons[]),
        "exercisesCount": count(modules[].lessons[].exercises[])
      }
    `)

    const dailyCourseData = {}
    const dailyLessonData = {}
    const dailyExerciseData = {}
    const now = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(now.getDate() - i)
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
      const dayLabel = `${monthName} ${date.getDate()}`
      dailyCourseData[dayLabel] = 0
      dailyLessonData[dayLabel] = 0
      dailyExerciseData[dayLabel] = 0
    }

    allPublishedCourses.forEach((c) => {
      const d = new Date(c._createdAt)
      const label = `${d.toLocaleDateString('pt-BR', { month: 'short' })} ${d.getDate()}`
      if (dailyCourseData[label] !== undefined) dailyCourseData[label]++
    })

    allCoursesForCharts.forEach((c) => {
      const d = new Date(c._createdAt)
      const label = `${d.toLocaleDateString('pt-BR', { month: 'short' })} ${d.getDate()}`
      if (dailyLessonData[label] !== undefined) dailyLessonData[label] += c.lessonsCount || 0
      if (dailyExerciseData[label] !== undefined) dailyExerciseData[label] += c.exercisesCount || 0
    })

    res.json({
      totalCourses,
      publishedCourses,
      totalLessons,
      totalExercises,
      chartData: Object.values(dailyCourseData),
      lessonChartData: Object.values(dailyLessonData),
      exerciseChartData: Object.values(dailyExerciseData),
      chartLabels: Object.keys(dailyCourseData),
      lastUpdated: new Date().toISOString()
    })
  } catch (err) {
    console.error('❌ Erro /stats', err)
    res.status(500).json({ error: 'Erro ao buscar estatísticas' })
  }
})

module.exports = router