const express = require('express');
const router = express.Router();
const client = require('../config/sanityClient');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =======================================================
// 🔧 FUNÇÕES AUXILIARES
// =======================================================
function slugify(text) {
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

// 👈 NOVA FUNÇÃO: Recupera JSON de resposta incompleta
function recoverJSONFromIncomplete(rawText) {
  if (!rawText) return null;
  
  try {
    // Tenta encontrar JSON completo ou parcial
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0];
      
      // Tenta fechar arrays abertos
      jsonStr = jsonStr.replace(/(\[[\s\S]*?)(?=\])/g, '$1]');
      
      // Tenta fechar objetos abertos  
      jsonStr = jsonStr.replace(/(\{[\s\S]*?)(?=\})/g, '$1}');
      
      // Remove vírgulas soltas no final
      jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
      
      return JSON.parse(jsonStr);
    }
  } catch (error) {
    console.log('❌ Não foi possível recuperar JSON incompleto');
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
      exercises: (lesson.exercises || []).map((ex) => ({
        ...ex,
        options: (ex.options || []).map((opt) =>
          typeof opt === 'string' ? opt : Object.values(opt).join('')
        ),
      })),
    })),
  }));

  return courseData;
}

function estimateDurationFromText(text) {
  if (!text) return 30;
  const chars = text.length;
  const minutes = Math.max(10, Math.round(chars / 900));
  return Math.min(minutes, 600);
}

// ⚙️ Tags opcionais e deduplicadas
function validateTags(tags) {
  if (!Array.isArray(tags)) return [];
  const unique = [...new Set(tags.filter(Boolean))];
  if (unique.length > 3) return unique.slice(0, 3);
  return unique;
}

const LEVEL_CONFIG = {
  beginner: {
    modules: 3,
    lessonsPerModule: 3,
    tips: 2,
    exercises: 1,
    tone: 'explicativo e acessível, com linguagem simples e exemplos práticos',
  },
  intermediate: {
    modules: 4, // 👈 REDUZIDO: de 5 para 4
    lessonsPerModule: 3, // 👈 REDUZIDO: de 4 para 3
    tips: 2, // 👈 REDUZIDO: de 3 para 2
    exercises: 1, // 👈 REDUZIDO: de 2 para 1
    tone: 'detalhado e aplicado, com exemplos reais e desafios práticos',
  },
  advanced: {
    modules: 5, // 👈 REDUZIDO: de 8 para 5
    lessonsPerModule: 4, // 👈 REDUZIDO: de 5 para 4
    tips: 3, // 👈 REDUZIDO: de 4 para 3
    exercises: 2, // 👈 REDUZIDO: de 3 para 2
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

// 👈 NOVA FUNÇÃO: Geração com fallback
async function generateCourseWithFallback(prompt, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentativa ${attempt} de geração do curso...`);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75,
        response_format: { type: 'json_object' },
        max_tokens: 3500, // 👈 REDUZIDO: de 4000 para 3500
      });

      let rawResponse = completion.choices[0]?.message?.content?.trim();
      if (!rawResponse) {
        throw new Error('Resposta vazia da OpenAI.');
      }

      console.log(`📝 Resposta bruta (tentativa ${attempt}):`, rawResponse.substring(0, 200) + '...');

      rawResponse = sanitizeJSON(rawResponse);

      let courseData;
      try {
        courseData = JSON.parse(rawResponse);
      } catch (parseError) {
        console.log(`❌ JSON inválido na tentativa ${attempt}, tentando recuperar...`);
        
        // Tenta recuperar JSON incompleto
        courseData = recoverJSONFromIncomplete(rawResponse);
        
        if (!courseData) {
          throw new Error(`Falha ao interpretar o JSON (tentativa ${attempt})`);
        }
        
        console.log('✅ JSON recuperado com sucesso!');
      }

      // Validação básica
      if (courseData && courseData.title && Array.isArray(courseData.modules)) {
        return courseData;
      } else {
        throw new Error('Estrutura do curso incompleta após recuperação');
      }
      
    } catch (error) {
      lastError = error;
      console.log(`❌ Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt < maxRetries) {
        // Espera um pouco antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw lastError;
}

// =======================================================
// 🧠 ROTA PRINCIPAL - GERAR CURSO (CORRIGIDA)
// =======================================================
router.post('/course', async (req, res) => {
  try {
    const { level = 'beginner', categoryId, subcategoryId, tags = [] } = req.body;
    console.log('🧾 Payload recebido:', req.body);

    if (!categoryId)
      return res.status(400).json({ error: 'categoryId é obrigatório.' });

    // ✅ Tags opcionais
    const validTags = validateTags(tags || []);

    const [category, subcategory] = await Promise.all([
      client.fetch(`*[_id == "${categoryId}"][0]{title}`),
      subcategoryId
        ? client.fetch(`*[_id == "${subcategoryId}"][0]{title}`)
        : null,
    ]);

    const categoryName = category?.title || 'Categoria Desconhecida';
    const subcategoryName = subcategory?.title || '';

    const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.beginner;

    // 👈 PROMPT OTIMIZADO - mais específico e com menos tokens
    const prompt = `
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
              "answer": "A"
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANTE: 
- Conteúdo em português do Brasil
- Tono: ${cfg.tone}
- Foco em aplicação prática
- Exercícios com 3 opções (A, B, C)
- Respostas sempre "A", "B" ou "C"
`.trim();

    // 🧠 Geração COM FALLBACK
    const courseData = await generateCourseWithFallback(prompt, 2);
    
    if (!courseData) {
      throw new Error('Não foi possível gerar o curso após todas as tentativas');
    }

    const sanitizedData = sanitizeCourseData(courseData);
    const validation = validateCourseData(sanitizedData);
    if (!validation.valid)
      return res.status(400).json({ error: validation.message });

    const title = sanitizedData.title.trim();
    const slug = slugify(title);
    const description = sanitizedData.description.trim();

    // 🕐 Calcula duração estimada
    const totalText = sanitizedData.modules
      .map((m) => m.lessons.map((l) => l.content).join(' '))
      .join(' ');
    const duration = estimateDurationFromText(totalText);

    // ⚠️ Antes de criar, verifica duplicados
    const existing = await client.fetch(
      `*[_type == "course" && slug.current == $slug][0]{_id}`,
      { slug }
    );

    if (existing?._id) {
      console.log('⚠️ Curso já existente:', existing._id);
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
          sanityUrl: `https://${process.env.SANITY_PROJECT_ID}.sanity.studio/desk/course;${existing._id}`,
          url: `http://localhost:3000/curso/${slug}`,
        },
      });
    }

    // 🆕 Cria novo curso
    const newCourse = {
      _type: 'course',
      title,
      slug: { _type: 'slug', current: slug },
      description,
      level,
      duration,
      provider: 'openai',
      category: { _type: 'reference', _ref: categoryId },
      subcategory: subcategoryId
        ? { _type: 'reference', _ref: subcategoryId }
        : undefined,
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
    console.log('✅ Curso criado com sucesso:', created._id);

    res.json({
      success: true,
      message: 'Curso gerado com sucesso!',
      course: {
        id: created._id,
        title: created.title,
        slug: created.slug?.current,
        description: created.description,
        level: created.level,
        duration: created.duration,
        sanityUrl: `https://${process.env.SANITY_PROJECT_ID}.sanity.studio/desk/course;${created._id}`,
        url: `http://localhost:3000/curso/${created.slug?.current}`,
      },
    });
  } catch (err) {
    console.error('🚨 Erro ao gerar curso:', err);
    res.status(500).json({
      error: 'Falha ao gerar o curso.',
      details: err.message,
    });
  }
});

module.exports = router;