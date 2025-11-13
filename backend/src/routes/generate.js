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

// 👈 FUNÇÃO NOVA: max_tokens dinâmico por nível
function getMaxTokensByLevel(level) {
  const tokensConfig = {
    beginner: 4000,    // ~3000 palavras - 3 módulos × 2 aulas
    intermediate: 5000, // ~3750 palavras - 4 módulos × 3 aulas  
    advanced: 7000      // ~5250 palavras - 5 módulos × 4 aulas
  };
  return tokensConfig[level] || 5000;
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
    maxTokens: 4000 // 👈 ADICIONADO maxTokens no config
  },
  intermediate: {
    modules: 4,
    lessonsPerModule: 3,
    tips: 2,
    exercises: 2,
    tone: 'detalhado e aplicado, com exemplos reais e desafios práticos',
    maxTokens: 5000 // 👈 ADICIONADO maxTokens no config
  },
  advanced: {
    modules: 5,
    lessonsPerModule: 4,
    tips: 3,
    exercises: 3,
    tone: 'abrangente, técnico e aprofundado, voltado para profissionais experientes',
    maxTokens: 7000 // 👈 ADICIONADO maxTokens no config
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

// 👈 FUNÇÃO COMPLETAMENTE ATUALIZADA: Geração com max_tokens dinâmico
async function generateCourseWithFallback(prompt, level = 'beginner', maxRetries = 2) {
  let lastError;
  
  // 👈 OBTÉM max_tokens baseado no nível
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.beginner;
  const maxTokens = cfg.maxTokens || 5000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentativa ${attempt} de geração do curso (nível: ${level}, tokens: ${maxTokens})...`);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75,
        response_format: { type: 'json_object' },
        max_tokens: maxTokens, // 👈 USA max_tokens dinâmico
      });

      let rawResponse = completion.choices[0]?.message?.content?.trim();
      if (!rawResponse) {
        throw new Error('Resposta vazia da OpenAI.');
      }

      console.log(`📝 Resposta bruta (tentativa ${attempt}):`, rawResponse.substring(0, 200) + '...');
      console.log(`📊 Tamanho da resposta: ${rawResponse.length} caracteres`); // 👈 NOVO LOG

      rawResponse = sanitizeJSON(rawResponse);

      let courseData;
      try {
        courseData = JSON.parse(rawResponse);
      } catch (parseError) {
        console.log(`❌ JSON inválido na tentativa ${attempt}, tentando recuperar...`);
        console.log(`🔍 Últimos 200 caracteres: ${rawResponse.substring(rawResponse.length - 200)}`); // 👈 LOG MELHORADO
        
        courseData = recoverJSONFromIncomplete(rawResponse);
        
        if (!courseData) {
          throw new Error(`Falha ao interpretar o JSON (tentativa ${attempt}) - Resposta possivelmente truncada`);
        }
        
        console.log('✅ JSON recuperado com sucesso!');
      }

      // Validação da estrutura
      if (courseData && courseData.title && Array.isArray(courseData.modules)) {
        console.log(`✅ Curso gerado com sucesso: ${courseData.modules.length} módulos, ${courseData.modules.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0)} aulas`);
        return courseData;
      } else {
        throw new Error('Estrutura do curso incompleta após recuperação');
      }
      
    } catch (error) {
      lastError = error;
      console.log(`❌ Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Aguardando 1.5 segundos antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }
  
  throw lastError;
}

// =======================================================
// 🧠 ROTA PRINCIPAL - GERAR CURSO (ATUALIZADA)
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

    // 👈 PROMPT ATUALIZADO: Inclui informações de tokens para debug
    const prompt = `
Crie um curso em JSON válido com estas especificações EXATAS:

CATEGORIA: ${categoryName}
SUBCATEGORIA: ${subcategoryName || 'Geral'}  
NÍVEL: ${level.toUpperCase()}
MÓDULOS: ${cfg.modules}
AULAS POR MÓDULO: ${cfg.lessonsPerModule}
DICAS POR AULA: ${cfg.tips}
EXERCÍCIOS POR AULA: ${cfg.exercises}
TOKENS DISPONÍVEIS: ${cfg.maxTokens} (NÃO TRUNCAR RESPOSTA)

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
- NÃO TRUNCAR A RESPOSTA - use todos os tokens disponíveis se necessário
`.trim();

    console.log(`🎯 Gerando curso ${level.toUpperCase()} com ${cfg.maxTokens} tokens...`);

    // 👈 PASSA O LEVEL para a função de geração
    const courseData = await generateCourseWithFallback(prompt, level, 2);
    
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

    // CRIAÇÃO DO CURSO
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
      modulesCount: newCourse.modules?.length,
      level: newCourse.level
    });

    const created = await client.create(newCourse);
    console.log('✅ Curso criado com sucesso:', created._id);

    // RESPOSTA COMPLETA
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
        tags: validTags.map(tagId => ({ _id: tagId })),
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