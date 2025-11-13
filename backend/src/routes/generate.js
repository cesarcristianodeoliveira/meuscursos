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
  } catch (error) {
    console.log('❌ Não foi possível recuperar JSON incompleto');
  }
  
  return null;
}

// 👈 FUNÇÃO CORRIGIDA: Adiciona _key recursivamente
function addKeysRecursively(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => ({
      ...addKeysRecursively(item),
      _key: uuidv4()
    }));
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = addKeysRecursively(value);
    }
    return newObj;
  }
  return obj;
}

// 👈 FUNÇÃO CORRIGIDA: Sanitiza dados mantendo estrutura correta
function sanitizeCourseData(courseData) {
  if (!courseData || !Array.isArray(courseData.modules)) return courseData;

  const sanitizedModules = courseData.modules.map((module) => ({
    _key: uuidv4(),
    title: module.title || '',
    description: module.description || '',
    lessons: (module.lessons || []).map((lesson) => ({
      _key: uuidv4(),
      title: lesson.title || '',
      content: lesson.content || '',
      tips: (lesson.tips || []).map(tip => 
        typeof tip === 'string' ? tip.replace(/^[A-Z]\.\s*/, '') : Object.values(tip).join('')
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
          _key: uuidv4(),
          question: ex.question || '',
          answer: cleanAnswer || '',
          options: cleanOptions,
        };
      }),
    })),
  }));

  return {
    ...courseData,
    modules: sanitizedModules
  };
}

// 👈 FUNÇÃO MELHORADA: Calcula duração
function estimateCourseDuration(courseData, categoryName, subcategoryName, tags = []) {
  if (!courseData) return 30;
  
  let totalCharacters = 0;
  
  totalCharacters += (courseData.title || '').length;
  totalCharacters += (courseData.description || '').length;
  totalCharacters += (categoryName || '').length;
  totalCharacters += (subcategoryName || '').length;
  
  if (Array.isArray(tags)) {
    tags.forEach(tag => {
      if (tag && typeof tag === 'string') {
        totalCharacters += tag.length;
      }
    });
  }
  
  if (Array.isArray(courseData.modules)) {
    courseData.modules.forEach(module => {
      totalCharacters += (module.title || '').length;
      totalCharacters += (module.description || '').length;
      
      if (Array.isArray(module.lessons)) {
        module.lessons.forEach(lesson => {
          totalCharacters += (lesson.title || '').length;
          totalCharacters += (lesson.content || '').length;
          
          if (Array.isArray(lesson.tips)) {
            lesson.tips.forEach(tip => {
              totalCharacters += (tip || '').length;
            });
          }
          
          if (Array.isArray(lesson.exercises)) {
            lesson.exercises.forEach(exercise => {
              totalCharacters += (exercise.question || '').length;
              
              if (Array.isArray(exercise.options)) {
                exercise.options.forEach(option => {
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
  
  console.log(`📊 Total de caracteres do curso: ${totalCharacters}`);
  
  const palavrasPorMinuto = 200;
  const caracteresPorPalavra = 5.5;
  const palavrasTotais = totalCharacters / caracteresPorPalavra;
  
  let minutosLeitura = Math.round(palavrasTotais / palavrasPorMinuto);
  
  const totalExercicios = courseData.modules?.reduce((total, modulo) => {
    return total + (modulo.lessons?.reduce((subtotal, aula) => {
      return subtotal + (aula.exercises?.length || 0);
    }, 0) || 0);
  }, 0) || 0;
  
  minutosLeitura += totalExercicios * 2;
  minutosLeitura = Math.max(15, minutosLeitura);
  minutosLeitura = Math.min(180, minutosLeitura);
  
  console.log(`⏱️ Duração estimada: ${minutosLeitura} minutos`);
  
  return minutosLeitura;
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
    lessonsPerModule: 2,
    tips: 1,
    exercises: 1,
    tone: 'explicativo e acessível, com linguagem simples e exemplos práticos',
  },
  intermediate: {
    modules: 4,
    lessonsPerModule: 3,
    tips: 2,
    exercises: 2,
    tone: 'detalhado e aplicado, com exemplos reais e desafios práticos',
  },
  advanced: {
    modules: 5,
    lessonsPerModule: 4,
    tips: 3,
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

// 👈 FUNÇÃO MELHORADA: Geração com fallback
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
        max_tokens: 3500,
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
        courseData = recoverJSONFromIncomplete(rawResponse);
        
        if (!courseData) {
          throw new Error(`Falha ao interpretar o JSON (tentativa ${attempt})`);
        }
        
        console.log('✅ JSON recuperado com sucesso!');
      }

      if (courseData && courseData.title && Array.isArray(courseData.modules)) {
        return courseData;
      } else {
        throw new Error('Estrutura do curso incompleta após recuperação');
      }
      
    } catch (error) {
      lastError = error;
      console.log(`❌ Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw lastError;
}

// =======================================================
// 🧠 ROTA PRINCIPAL - GERAR CURSO (COMPLETAMENTE CORRIGIDA)
// =======================================================
router.post('/course', async (req, res) => {
  try {
    const { level = 'beginner', categoryId, subcategoryId, tags = [] } = req.body;
    console.log('🧾 Payload recebido:', req.body);

    if (!categoryId)
      return res.status(400).json({ error: 'categoryId é obrigatório.' });

    const validTags = validateTags(tags || []);

    const [category, subcategory] = await Promise.all([
      client.fetch(`*[_id == $categoryId][0]{_id, title, icon, "slug": slug.current}`, { categoryId }),
      subcategoryId
        ? client.fetch(`*[_id == $subcategoryId][0]{_id, title, icon, "slug": slug.current}`, { subcategoryId })
        : null,
    ]);

    const categoryName = category?.title || 'Categoria Desconhecida';
    const subcategoryName = subcategory?.title || '';

    const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.beginner;

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
- Tono: ${cfg.tone}
- Foco em aplicação prática
- Exercícios com 3 opções
- NÃO use "A.", "B.", "C." nas opções - use apenas o texto da opção
- A RESPOSTA deve ser o TEXTO COMPLETO da opção correta
- Garanta que a resposta corresponda exatamente a uma das opções fornecidas
`.trim();

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

    const duration = estimateCourseDuration(sanitizedData, categoryName, subcategoryName, validTags);

    const existing = await client.fetch(
      `*[_type == "course" && slug.current == $slug][0]{_id}`,
      { slug }
    );

    const categorySlug = category?.slug || 'categoria';
    const subcategorySlug = subcategory?.slug || 'subcategoria';
    const courseUrl = `http://localhost:3000/${categorySlug}/${subcategorySlug}/${slug}`;

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
          category,
          subcategory,
          tags: validTags.map(tagId => ({ _id: tagId })),
          provider: 'openai',
          sanityUrl: `https://${process.env.SANITY_PROJECT_ID}.sanity.studio/desk/course;${existing._id}`,
          url: courseUrl,
        },
      });
    }

    // 👈 CRIAÇÃO DO CURSO CORRIGIDA - Garante todos os campos
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
      tags: validTags.map((tagId) => ({
        _key: uuidv4(),
        _type: 'reference',
        _ref: tagId,
      })),
      modules: sanitizedData.modules,
      certificate: '',
      status: 'published',
    };

    console.log('📦 Criando curso com estrutura:', {
      title: newCourse.title,
      provider: newCourse.provider,
      tagsCount: newCourse.tags?.length,
      modulesCount: newCourse.modules?.length
    });

    const created = await client.create(newCourse);
    console.log('✅ Curso criado com sucesso:', created._id);

    // 👈 RESPOSTA COMPLETA com todos os campos necessários
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
        provider: 'openai',
        category,
        subcategory,
        tags: validTags.map(tagId => ({ _id: tagId })), // 👈 Inclui tags na resposta
        sanityUrl: `https://${process.env.SANITY_PROJECT_ID}.sanity.studio/desk/course;${created._id}`,
        url: courseUrl,
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