// src/routes/generate.js
const express = require('express');
const router = express.Router();
const client = require('../config/sanityClient');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenAI } = require('@google/genai'); // ✅ Gemini SDK

// Inicializa OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Inicializa Gemini client
const geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// -----------------------------
// UTILITIES
// -----------------------------
function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sanitizeJSON(raw) {
  if (!raw) return '';
  return raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\r/g, '')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/“|”/g, '"')
    .replace(/‘|’/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function recoverJSONFromIncomplete(rawText) {
  if (!rawText) return null;
  try {
    const lastBracket = rawText.lastIndexOf('}');
    if (lastBracket !== -1) rawText = rawText.slice(0, lastBracket + 1);
    return JSON.parse(rawText);
  } catch (err) {
    console.log('❌ recoverJSONFromIncomplete falhou:', err?.message || err);
  }
  return null;
}

function addKeysRecursively(obj) {
  if (Array.isArray(obj)) return obj.map((item) => addKeysRecursively(item));
  if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = addKeysRecursively(value);
    }
    newObj._key = uuidv4();
    return newObj;
  }
  return obj;
}

function sanitizeCourseData(courseData) {
  if (!courseData || !Array.isArray(courseData.modules)) return courseData;

  courseData.modules = courseData.modules.map((module) => ({
    ...module,
    lessons: (module.lessons || []).map((lesson) => ({
      ...lesson,
      tips: (lesson.tips || []).map((tip) =>
        typeof tip === 'string' ? tip : Object.values(tip).join('')
      ),
      exercises: (lesson.exercises || []).map((ex) => {
        const cleanOptions = (ex.options || []).map((opt) => {
          if (typeof opt === 'string') return opt.replace(/^[A-Z]\.\s*/, '');
          return Object.values(opt).join('');
        });
        let cleanAnswer = ex.answer;
        if (typeof cleanAnswer === 'string') cleanAnswer = cleanAnswer.replace(/^[A-Z]\.\s*/, '');
        return { ...ex, answer: cleanAnswer, options: cleanOptions };
      }),
    })),
  }));

  return courseData;
}

function validateTags(tags) {
  if (!Array.isArray(tags)) return [];
  const unique = [...new Set(tags.filter(Boolean))];
  return unique;
}

// -----------------------------
// LEVEL CONFIG
// -----------------------------
const LEVEL_CONFIG = {
  beginner: { modules: 3, lessonsPerModule: 2, tips: 2, exercises: 1, tone: 'explicativo e acessível, com linguagem simples e exemplos práticos' },
  intermediate: { modules: 4, lessonsPerModule: 3, tips: 3, exercises: 2, tone: 'detalhado e aplicado, com exemplos reais e desafios práticos' },
  advanced: { modules: 5, lessonsPerModule: 4, tips: 4, exercises: 3, tone: 'abrangente, técnico e aprofundado, voltado para profissionais experientes' },
};

function validateCourseData(courseData) {
  if (!courseData?.title || courseData.title.trim().length < 3) return { valid: false, message: 'Título inválido.' };
  if (!courseData?.description || courseData.description.trim().length < 20) return { valid: false, message: 'Descrição muito curta.' };
  if (!Array.isArray(courseData.modules) || courseData.modules.length === 0) return { valid: false, message: 'O curso precisa ter pelo menos um módulo.' };
  return { valid: true };
}

// -----------------------------
// ESTIMATOR
// -----------------------------
function estimateCourseDuration(courseData, categoryName, subcategoryName, tags = []) {
  if (!courseData) return 30;
  let totalCharacters = 0;
  totalCharacters += (courseData.title || '').length + (courseData.description || '').length;
  totalCharacters += (categoryName || '').length + (subcategoryName || '').length;
  if (Array.isArray(tags)) tags.forEach((tag) => { if (tag) totalCharacters += tag.title || tag.length || 0; });

  if (Array.isArray(courseData.modules)) {
    courseData.modules.forEach((module) => {
      totalCharacters += (module.title || '').length + (module.description || '').length;
      if (Array.isArray(module.lessons)) {
        module.lessons.forEach((lesson) => {
          totalCharacters += (lesson.title || '').length + (lesson.content || '').length;
          if (Array.isArray(lesson.tips)) lesson.tips.forEach((tip) => { totalCharacters += (tip || '').length; });
          if (Array.isArray(lesson.exercises)) {
            lesson.exercises.forEach((exercise) => {
              totalCharacters += (exercise.question || '').length + (exercise.answer || '').length;
              if (Array.isArray(exercise.options)) exercise.options.forEach((opt) => { totalCharacters += (opt || '').length; });
            });
          }
        });
      }
    });
  }

  const palavrasPorMinuto = 200;
  const caracteresPorPalavra = 5.5;
  const palavrasTotais = totalCharacters / caracteresPorPalavra;
  let minutosLeitura = Math.round(palavrasTotais / palavrasPorMinuto);

  const totalExercicios = courseData.modules?.reduce((t, m) => t + (m.lessons?.reduce((s, l) => s + (l.exercises?.length || 0), 0) || 0), 0) || 0;
  minutosLeitura += totalExercicios * 2;
  return Math.max(15, Math.min(180, minutosLeitura));
}

// -----------------------------
// PROMPT BUILDER
// -----------------------------
function buildPrompt(categoryName, subcategoryName, level, cfg) {
  return `
Crie um curso em JSON válido com estas especificações EXATAS:

CATEGORIA: ${categoryName}
SUBCATEGORIA: ${subcategoryName || 'Geral'}
NÍVEL: ${level.toUpperCase()}
MÓDULOS: ${cfg.modules}
AULAS POR MÓDULO: ${cfg.lessonsPerModule}
DICAS POR AULA: ${cfg.tips}
EXERCÍCIOS POR AULA: ${cfg.exercises}

ESTRUTURA EXATA DO JSON:
{
  "title": "Título criativo e SEO",
  "description": "Descrição em 2-3 parágrafos",
  "modules": [
    {
      "title": "Título do módulo 1",
      "description": "Breve descrição",
      "lessons": [
        {
          "title": "Título da aula",
          "content": "Conteúdo educativo (400-600 caracteres)",
          "tips": ["Dica 1", "Dica 2"],
          "exercises": [
            {
              "question": "Pergunta múltipla escolha",
              "options": ["Opção A", "Opção B", "Opção C"],
              "answer": "Texto completo da opção correta"
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANTE:
- Conteúdo em português do Brasil
- Tom: ${cfg.tone}
- Linguagem natural, fluida
- Exercícios com 3 opções SEM prefixos "A." "B." "C."
- A resposta deve ser exatamente o texto de uma das opções
`.trim();
}

// -----------------------------
// PROVIDER LAYER
// -----------------------------
const PROVIDER_MAP = { openai: { id: 'openai', name: 'OpenAI' }, gemini: { id: 'gemini', name: 'Google Gemini' } };
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function generateWithProvider(provider, prompt, level) {
  if (!provider) throw new Error('Provider não informado.');

  const maxTokens = level === 'advanced' ? 4000 : 2500;

  if (provider === 'openai') {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      max_tokens: maxTokens,
    });
    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Resposta vazia da OpenAI.');
    return String(raw);
  } else if (provider === 'gemini') {
    const response = await geminiAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      temperature: 0.7,
      maxOutputTokens: maxTokens,
    });
    if (!response || !response.text) throw new Error('Resposta vazia da Gemini.');
    return String(response.text);
  } else {
    throw new Error(`Provider "${provider}" não suportado.`);
  }
}

// -----------------------------
// GERAÇÃO COM HEURÍSTICAS
// -----------------------------
async function generateCourseUsingProvider(provider, prompt, level, maxRetries = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [${provider}] tentativa ${attempt} → gerando...`);
      let raw = await generateWithProvider(provider, prompt, level);
      if (!raw) throw new Error('Resposta vazia do provider.');
      console.log(`🔍 [${provider}] resposta (preview): ${raw.slice(0, 300)}`);

      raw = sanitizeJSON(raw).trim();

      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.title && Array.isArray(parsed.modules)) return parsed;
      } catch (_) {}

      const recovered = recoverJSONFromIncomplete(raw);
      if (recovered && recovered.title && Array.isArray(recovered.modules)) return recovered;

      throw new Error('Não foi possível extrair JSON válido do provider.');
    } catch (err) {
      lastErr = err;
      console.log(`❌ [${provider}] tentativa ${attempt} falhou:`, err.message);
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw lastErr;
}

// -----------------------------
// ROTA: POST /api/generate/course
// -----------------------------
router.post('/course', async (req, res) => {
  try {
    const { level, provider, categoryId, subcategoryId, tags = [] } = req.body;
    console.log('🧾 Payload recebido (generate):', { level, provider, categoryId, subcategoryId, tags });

    if (!provider || !PROVIDER_MAP[provider]) return res.status(400).json({ error: 'Provider inválido.' });
    if (!level || !LEVEL_CONFIG[level]) return res.status(400).json({ error: 'Level inválido.' });
    if (!categoryId) return res.status(400).json({ error: 'categoryId é obrigatório.' });

    const validTags = validateTags(tags);

    const [category, subcategory] = await Promise.all([
      client.fetch(`*[_id == $categoryId][0]{_id, title, icon, "slug": slug.current}`, { categoryId }),
      subcategoryId ? client.fetch(`*[_id == $subcategoryId][0]{_id, title, icon, "slug": slug.current}`, { subcategoryId }) : null,
    ]);

    const categoryName = category?.title || 'Categoria Desconhecida';
    const subcategoryName = subcategory?.title || '';
    const cfg = LEVEL_CONFIG[level];
    const prompt = buildPrompt(categoryName, subcategoryName, level, cfg);

    const courseData = await generateCourseUsingProvider(provider, prompt, level, 3);
    if (!courseData) throw new Error('Não foi possível gerar o curso.');

    const sanitizedData = sanitizeCourseData(courseData);
    const validation = validateCourseData(sanitizedData);
    if (!validation.valid) return res.status(400).json({ error: validation.message });

    const title = sanitizedData.title.trim();
    const slug = slugify(title);
    const description = sanitizedData.description?.trim() || '';
    const duration = estimateCourseDuration(sanitizedData, categoryName, subcategoryName, validTags);

    const existing = await client.fetch(`*[_type == "course" && slug.current == $slug][0]{_id}`, { slug });
    const categorySlug = category?.slug || 'categoria';
    const subcategorySlug = subcategory?.slug || 'subcategoria';
    const courseUrl = `http://localhost:3000/${categorySlug}/${subcategorySlug}/${slug}`;

    if (existing?._id) {
      console.log('⚠️ Curso já existente:', existing._id);
      return res.json({
        success: true,
        message: 'Curso já existia. Retornado existente.',
        course: { id: existing._id, title, slug, description, level, duration, category, subcategory, tags: validTags.map((t) => ({ title: t })), url: courseUrl },
      });
    }

    const newCourse = {
      _type: 'course',
      title,
      slug: { _type: 'slug', current: slug },
      description,
      level,
      duration,
      provider,
      category: { _type: 'reference', _ref: categoryId },
      subcategory: subcategoryId ? { _type: 'reference', _ref: subcategoryId } : undefined,
      tags: (validTags || []).map((t) => ({ _key: uuidv4(), _type: 'reference', _ref: t })),
      modules: addKeysRecursively(sanitizedData.modules || []),
      certificate: '',
      status: 'published',
    };

    const created = await client.create(newCourse);
    console.log('✅ Curso criado com sucesso:', created._id);

    const totalLessons = (sanitizedData.modules || []).reduce((sumM, m) => sumM + (m.lessons?.length || 0), 0);
    const totalExercises = (sanitizedData.modules || []).reduce((sumM, m) => sumM + (m.lessons?.reduce((sumL, l) => sumL + (l.exercises?.length || 0), 0) || 0), 0);

    return res.json({
      success: true,
      message: 'Curso gerado com sucesso!',
      course: { id: created._id, title, slug: created.slug.current, description, level, duration, totalLessons, totalExercises, category, subcategory, tags: validTags.map((t) => ({ title: t })), url: courseUrl },
    });
  } catch (err) {
    console.error('🚨 Erro na rota /generate/course:', err);
    return res.status(500).json({ error: 'Falha ao gerar o curso.', details: err?.message || String(err) });
  }
});

module.exports = router;
