// =======================
// 🌐 API base URLs
// =======================

// A URL base vem do .env, e cai no localhost:5000 como fallback
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'

// Agrupa rotas de API
const BASE_FETCH = `${BASE_URL}/api/fetch`
const BASE_GEN = `${BASE_URL}/api/generate`

// ============================================================
// 🔹 Busca tudo (categorias, subcategorias, cursos e tags)
// ============================================================
export const fetchAll = async () => {
  const url = `${BASE_FETCH}/all`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Erro ao buscar /all (${res.status})`)
  return res.json()
}

// ============================================================
// 🔹 Cursos
// ============================================================
export const getCourses = async () => {
  const res = await fetch(`${BASE_FETCH}/courses`)
  if (!res.ok) throw new Error('Erro ao buscar cursos')
  return res.json()
}

export const getCourseById = async (id) => {
  const res = await fetch(`${BASE_FETCH}/course/${id}`)
  if (!res.ok) throw new Error('Erro ao buscar curso por ID')
  return res.json()
}

export const getCourseBySlug = async (slug) => {
  const res = await fetch(`${BASE_FETCH}/course/slug/${slug}`)
  if (!res.ok) throw new Error('Erro ao buscar curso por slug')
  return res.json()
}

// ============================================================
// 🔹 Categorias / Subcategorias / Tags
// ============================================================
export const getCategories = async () => {
  const res = await fetch(`${BASE_FETCH}/categories`)
  if (!res.ok) throw new Error('Erro ao buscar categorias')
  return res.json()
}

export const getSubcategories = async (categoryId) => {
  const url = categoryId
    ? `${BASE_FETCH}/subcategories?categoryId=${encodeURIComponent(categoryId)}`
    : `${BASE_FETCH}/subcategories`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar subcategorias')
  return res.json()
}

export const getTags = async () => {
  const res = await fetch(`${BASE_FETCH}/tags`)
  if (!res.ok) throw new Error('Erro ao buscar tags')
  return res.json()
}

export const getTagsBySubcategory = async (subcategoryId) => {
  const url = `${BASE_FETCH}/tags?subcategoryId=${encodeURIComponent(subcategoryId)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar tags por subcategoria')
  return res.json()
}

// ============================================================
// 🔹 Geração de curso (OpenAI + Sanity) - COM DEBUGS CRÍTICOS
// ============================================================
export const generateCourse = async (payload) => {
  try {
    console.log('🎯 DEBUG CRÍTICO - generateCourse() iniciado')
    console.log('📤 Payload original recebido:', payload)
    
    const cleanPayload = {
      categoryId: payload.categoryId || payload.category?._id,
      subcategoryId: payload.subcategoryId || payload.subcategory?._id,
      level: payload.level || 'beginner',
      tags: payload.tags ? payload.tags.map((t) => t._id || t._ref || t) : [],
      provider: payload.provider || 'openai',
    }

    console.log('📤 Payload limpo sendo enviado:', cleanPayload)
    
    if (!cleanPayload.categoryId) throw new Error('categoryId é obrigatório.')
    if (!cleanPayload.subcategoryId) throw new Error('subcategoryId é obrigatório.')

    // 👇 DEBUG CRÍTICO - URL e fetch
    const apiUrl = `${BASE_GEN}/course`
    console.log('🔍 DEBUG - URL da API:', apiUrl)
    console.log('🔍 DEBUG - Fazendo fetch para a API...')

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
    })

    // 👇 DEBUG CRÍTICO - Status da resposta
    console.log('🔍 DEBUG - Resposta da API recebida')
    console.log('🔍 DEBUG - Status:', res.status)
    console.log('🔍 DEBUG - OK?', res.ok)
    console.log('🔍 DEBUG - Status Text:', res.statusText)

    let data
    try {
      data = await res.json()
      console.log('🔍 DEBUG - JSON parseado com sucesso:', data)
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON da resposta:', parseError)
      
      // 👇 Tenta ler a resposta como texto para debug
      const textResponse = await res.text()
      console.error('❌ Resposta em texto:', textResponse.substring(0, 500))
      
      throw new Error(`Resposta inválida do servidor: ${textResponse.substring(0, 200)}`)
    }

    if (!res.ok) {
      console.error('❌ Erro HTTP ao gerar curso:', data)
      throw new Error(data?.error || `Falha ao criar curso (${res.status})`)
    }

    console.log('✅ Resposta da API bem-sucedida:', data)

    const course = data?.course || {}
    const slug = course.slug?.current || course.slug || course.id || course._id

    const normalized = {
      ...data,
      course: {
        ...course,
        id: course._id || course.id,
        slug,
        url: `/curso/${slug}`,
        provider: course.provider || cleanPayload.provider,
      },
    }

    console.log('✅ Curso normalizado com sucesso:', normalized)
    return normalized

  } catch (err) {
    console.error('⚠️ Erro em generateCourse():', err)
    console.error('⚠️ Stack trace:', err.stack)
    throw err
  }
}

export const getStats = async (period = '30days') => {
  try {
    const url = `${BASE_FETCH}/stats?period=${period}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    return data
  } catch (error) {
    console.error('❌ Erro getStats:', error)
    throw new Error('Serviço de estatísticas indisponível')
  }
}