// src/routes/generate.js
const express = require('express');
const router = express.Router();
const client = require('../config/sanityClient');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');

// Import Gemini oficial
const { GoogleGenAI } = require('@google/genai');

// Inicializa OpenAI client (precisa de env OPENAI_API_KEY)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Inicializa Gemini client
const geminiAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// -----------------------------
// UTILITIES (slugify, sanitize, recover, etc.)
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
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0];
      jsonStr = jsonStr.replace(/(\[[\s\S]*?)(?=\])/g, '$1]');
      jsonStr = jsonStr.replace(/(\{[\s\S]*?)(?=\})/g, '$1}');
      jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(jsonStr);
    }
  } catch (err) {
    console.log('❌ recoverJSONFromIncomplete falhou:', err?.message || err);
  }
  return null;
}

function addKeysRecursively(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => addKeysRecursively(item));
  } else if (typeof obj === 'object' && obj !== null) {
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
          if (typeof opt === 'string') {
            return opt.replace(/^[A-Z]\.\s*/, '');
          }
          return Object.values(opt).join('');
        });

        let cleanAnswer = ex.answer;
        if (typeof cleanAnswer === 'string') {
          cleanAnswer = cleanAnswer.replace(/^[A-Z]\.\s*/, '');
        }

        return {
          ...ex,
          answer: cleanAnswer,
          options: cleanOptions,
        };
      }),
    })),
  }));

  return courseData;
}

function validateTags(tags) {
  if (!Array.isArray(tags)) return [];
  const unique = [...new Set(tags.filter(Boolean))];
  if (unique.length > 3) return unique.slice(0, 3);
  return unique;
}

// -----------------------------
// LEVEL CONFIG / VALIDATORS
// -----------------------------
const LEVEL_CONFIG = {
  beginner: {
    modules: 3,
    lessonsPerModule: 2,
    tips: 2,
    exercises: 1,
    tone: 'explicativo e acessível, com linguagem simples e exemplos práticos',
  },
  intermediate: {
    modules: 4,
    lessonsPerModule: 3,
    tips: 3,
    exercises: 2,
    tone: 'detalhado e aplicado, com exemplos reais e desafios práticos',
  },
  advanced: {
    modules: 5,
    lessonsPerModule: 4,
    tips: 4,
    exercises: 3,
    tone: 'abrangente, técnico e aprofundado, voltado para profissionais experientes',
  },
};

function validateCourseData(courseData) {
  if (!courseData?.title || courseData.title.trim().length < 3)
    return { valid: false, message: 'Título inválido.' };
  if (!courseData?.description || courseData.description.trim().length < 20)
    return { valid: false, message: 'Descrição muito curta.' };
  if (!Array.isArray(courseData.modules) || courseData.modules.length === 0)
    return { valid: false, message: 'O curso precisa ter pelo menos um módulo.' };
  return { valid: true };
}

// -----------------------------
// ESTIMATOR (melhorado)
// -----------------------------
function estimateCourseDuration(courseData, categoryName, subcategoryName, tags = []) {
  if (!courseData) return 30;
  let totalCharacters = 0;

  totalCharacters += (courseData.title || '').length;
  totalCharacters += (courseData.description || '').length;
  totalCharacters += (categoryName || '').length;
  totalCharacters += (subcategoryName || '').length;

  if (Array.isArray(tags)) {
    tags.forEach((tag) => {
      if (tag && typeof tag === 'string') totalCharacters += tag.length;
    });
  }

  if (Array.isArray(courseData.modules)) {
    courseData.modules.forEach((module) => {
      totalCharacters += (module.title || '').length;
      totalCharacters += (module.description || '').length;
      if (Array.isArray(module.lessons)) {
        module.lessons.forEach((lesson) => {
          totalCharacters += (lesson.title || '').length;
          totalCharacters += (lesson.content || '').length;
          if (Array.isArray(lesson.tips)) {
            lesson.tips.forEach((tip) => {
              totalCharacters += (tip || '').length;
            });
          }
          if (Array.isArray(lesson.exercises)) {
            lesson.exercises.forEach((exercise) => {
              totalCharacters += (exercise.question || '').length;
              if (Array.isArray(exercise.options)) {
                exercise.options.forEach((option) => {
                  totalCharacters += (option || '').length;
                });
              }
              totalCharacters += (exercise.answer || '').length;
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

  const totalExercicios =
    courseData.modules?.reduce((total, modulo) => {
      return (
        total +
        (modulo.lessons?.reduce((subtotal, aula) => {
          return subtotal + (aula.exercises?.length || 0);
        }, 0) || 0)
      );
    }, 0) || 0;

  minutosLeitura += totalExercicios * 2;
  minutosLeitura = Math.max(15, minutosLeitura);
  minutosLeitura = Math.min(180, minutosLeitura);

  return minutosLeitura;
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
// PROVIDER LAYER (OpenAI + Gemini oficial)
// -----------------------------
const PROVIDER_MAP = {
  openai: { id: 'openai', name: 'OpenAI' },
  gemini: { id: 'gemini', name: 'Google Gemini' },
};

// gera texto bruto do provider (string)
async function generateWithProvider(provider, prompt) {
  if (!provider) throw new Error('Provider não informado.');

  if (provider === 'openai') {
    if (!openai) throw new Error('Client OpenAI não configurado.');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      response_format: { type: 'json_object' },
      max_tokens: 3500,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Resposta vazia da OpenAI.');
    return String(raw);
  } else if (provider === 'gemini') {
    if (!geminiAI) throw new Error('Client Gemini não configurado.');
    const response = await geminiAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-flash-1-5',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = response?.text || response?.contents?.[0]?.text;
    if (!text) throw new Error('Resposta vazia do Gemini.');
    return String(text);
  } else {
    throw new Error(`Provider "${provider}" não suportado.`);
  }
}

// -----------------------------
// tenta gerar e recuperar JSON válido (retries e heurísticas)
// -----------------------------
async function generateCourseUsingProvider(provider, prompt, maxRetries = 2) {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [${provider}] tentativa ${attempt} → gerando...`);
      let raw = await generateWithProvider(provider, prompt);
      if (!raw) throw new Error('Resposta vazia do provider.');

      console.log(`🔍 [${provider}] resposta (preview): ${raw.slice(0, 300)}`);

      raw = sanitizeJSON(raw);

      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.title && Array.isArray(parsed.modules)) return parsed;
      } catch (err) {}

      const recovered = recoverJSONFromIncomplete(raw);
      if (recovered && recovered.title && Array.isArray(recovered.modules)) return recovered;

      const block = raw.match(/\{[\s\S]*\}/);
      if (block) {
        try {
          const parsed2 = JSON.parse(block[0]);
          if (parsed2 && parsed2.title && Array.isArray(parsed2.modules)) return parsed2;
        } catch (_) {}
      }

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

    if (!provider) return res.status(400).json({ error: 'provider é obrigatório (ex: "openai" ou "gemini").' });
    if (!PROVIDER_MAP[provider]) return res.status(400).json({ error: `Provider "${provider}" não reconhecido.` });

    if (!level) return res.status(400).json({ error: 'level é obrigatório (beginner | intermediate | advanced).' });
    if (!LEVEL_CONFIG[level]) {
      return res.status(400).json({ error: `level inválido: ${level}. Valores permitidos: ${Object.keys(LEVEL_CONFIG).join(', ')}` });
    }

    if (!categoryId) return res.status(400).json({ error: 'categoryId é obrigatório.' });

    const validTags = validateTags(tags || []);

    const [category, subcategory] = await Promise.all([
      client.fetch(`*[_id == $categoryId][0]{_id, title, icon, "slug": slug.current}`, { categoryId }),
      subcategoryId ? client.fetch(`*[_id == $subcategoryId][0]{_id, title, icon, "slug": slug.current}`, { subcategoryId }) : null,
    ]);

    const categoryName = category?.title || 'Categoria Desconhecida';
    const subcategoryName = subcategory?.title || '';

    const cfg = LEVEL_CONFIG[level];
    const prompt = buildPrompt(categoryName, subcategoryName, level, cfg);

    const courseData = await generateCourseUsingProvider(provider, prompt, 2);

    if (!courseData) throw new Error('Não foi possível gerar o curso após todas as tentativas.');

    const sanitizedData = sanitizeCourseData(courseData);
    const validation = validateCourseData(sanitizedData);
    if (!validation.valid) return res.status(400).json({ error: validation.message });

    const title = sanitizedData.title.trim();
    const slug = slugify(title);
    const description = sanitizedData.description ? sanitizedData.description.trim() : '';
    const duration = estimateCourseDuration(sanitizedData, categoryName, subcategoryName, validTags);

    const existing = await client.fetch(`*[_type == "course" && slug.current == $slug][0]{_id}`, { slug });

    const categorySlug = category?.slug || 'categoria';
    const subcategorySlug = subcategory?.slug || 'subcategoria';
    const courseUrl = `http://localhost:3000/${categorySlug}/${subcategorySlug}/${slug}`;

    if (existing?._id) {
      return res.json({
        success: true,
        message: 'Curso já existia. Retornado existente.',
        course: {
          id: existing._id,
          title,
          slug,
          description,
          level,
          duration,
          category,
          subcategory,
          sanityUrl: `https://${process.env.SANITY_PROJECT_ID}.sanity.studio/desk/course;${existing._id}`,
          url: courseUrl,
        },
      });
    }

    const newCourse = {
      _type: 'course',
      title,
      slug: { _type: 'slug', current: slug },
      description,
      level,
      duration,
      provider: provider,
      category: { _type: 'reference', _ref: categoryId },
      subcategory: subcategoryId ? { _type: 'reference', _ref: subcategoryId } : undefined,
      tags: (validTags || []).map((t) => ({
        _key: uuidv4(),
        _type: 'reference',
        _ref: t,
      })),
      modules: addKeysRecursively(sanitizedData.modules || []),
      certificate: '',
      status: 'published',
    };

    const created = await client.create(newCourse);

    return res.json({
      success: true,
      message: 'Curso gerado com sucesso!',
      course: {
        id: created._id,
        title: created.title,
        slug: created.slug?.current,
        description: created.description,
        level: created.level,
        duration: created.duration,
        category,
        subcategory,
        sanityUrl: `https://${process.env.SANITY_PROJECT_ID}.sanity.studio/desk/course;${created._id}`,
        url: courseUrl,
      },
    });
  } catch (err) {
    console.error('🚨 Erro na rota /generate/course:', err);
    return res.status(500).json({
      error: 'Falha ao gerar o curso.',
      details: err?.message || String(err),
    });
  }
});

module.exports = router;
