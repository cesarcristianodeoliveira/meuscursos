const express = require('express');
const router = express.Router();
const client = require('../config/sanityClient');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');

// 👇 CONFIGURAÇÃO DAS APIS
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 👇 CONFIGURAÇÃO CORRIGIDA DO GEMINI
const configureGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada');
  }
  return new GoogleGenerativeAI(apiKey);
};

// 👇 TRACKING DE USO PARA LIMITES
const usageTracker = {
  openai: { dailyCount: 0, lastReset: new Date() },
  gemini: { dailyCount: 0, lastReset: new Date() }
};

// 👇 LIMITES DIÁRIOS
const DAILY_LIMITS = {
  openai: 50,
  gemini: 50
};

// 👇 VERIFICAR E ATUALIZAR USO
function checkAndUpdateUsage(provider) {
  const now = new Date();
  const tracker = usageTracker[provider];
  
  // Reset diário
  if (now.toDateString() !== tracker.lastReset.toDateString()) {
    tracker.dailyCount = 0;
    tracker.lastReset = now;
  }
  
  // Verificar limite
  if (tracker.dailyCount >= DAILY_LIMITS[provider]) {
    throw new Error(`Limite diário de ${DAILY_LIMITS[provider]} cursos atingido para ${provider}`);
  }
  
  // Incrementar uso
  tracker.dailyCount++;
  console.log(`📊 Uso ${provider}: ${tracker.dailyCount}/${DAILY_LIMITS[provider]}`);
}

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

// 👇 FUNÇÃO: Gerar curso com OpenAI
async function generateWithOpenAI(prompt, level = 'beginner', maxRetries = 2) {
  let lastError;
  
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.beginner;
  const maxTokens = cfg.maxTokens || 5000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 OpenAI - Tentativa ${attempt} (nível: ${level}, tokens: ${maxTokens})...`);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75,
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
      });

      let rawResponse = completion.choices[0]?.message?.content?.trim();
      if (!rawResponse) {
        throw new Error('Resposta vazia da OpenAI.');
      }

      console.log(`📝 OpenAI - Resposta:`, rawResponse.substring(0, 200) + '...');
      console.log(`📊 OpenAI - Tamanho: ${rawResponse.length} caracteres`);

      rawResponse = sanitizeJSON(rawResponse);

      let courseData;
      try {
        courseData = JSON.parse(rawResponse);
      } catch (parseError) {
        console.log(`❌ OpenAI - JSON inválido, tentando recuperar...`);
        courseData = recoverJSONFromIncomplete(rawResponse);
        
        if (!courseData) {
          throw new Error(`Falha ao interpretar o JSON`);
        }
        
        console.log('✅ OpenAI - JSON recuperado com sucesso!');
      }

      if (courseData && courseData.title && Array.isArray(courseData.modules)) {
        console.log(`✅ OpenAI - Curso gerado: ${courseData.modules.length} módulos, ${courseData.modules.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0)} aulas`);
        return courseData;
      } else {
        throw new Error('Estrutura do curso incompleta');
      }
      
    } catch (error) {
      lastError = error;
      console.log(`❌ OpenAI - Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }
  
  throw lastError;
}

// 👇 FUNÇÃO CORRIGIDA: Gerar curso com Gemini
async function generateWithGemini(prompt, level = 'beginner', maxRetries = 2) {
  let lastError;
  
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.beginner;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Gemini - Tentativa ${attempt} (nível: ${level})...`);
      
      const genAI = configureGemini();
      
      // 👇 MODELOS DISPONÍVEIS PARA TESTAR
      const availableModels = ['gemini-pro', 'models/gemini-pro'];
      let geminiError = null;
      
      for (const modelName of availableModels) {
        try {
          console.log(`🔍 Tentando modelo: ${modelName}`);
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: cfg.maxTokens || 4000,
            }
          });

          const jsonPrompt = `${prompt}\n\nIMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional, sem markdown, sem explicações.`;
          
          const result = await model.generateContent(jsonPrompt);
          const response = await result.response;
          let rawResponse = response.text().trim();

          if (!rawResponse) {
            throw new Error('Resposta vazia da Gemini.');
          }

          console.log(`📝 Gemini - Resposta:`, rawResponse.substring(0, 200) + '...');
          console.log(`📊 Gemini - Tamanho: ${rawResponse.length} caracteres`);

          rawResponse = sanitizeJSON(rawResponse);

          let courseData;
          try {
            courseData = JSON.parse(rawResponse);
          } catch (parseError) {
            console.log(`❌ Gemini - JSON inválido, tentando recuperar...`);
            courseData = recoverJSONFromIncomplete(rawResponse);
            
            if (!courseData) {
              throw new Error(`Falha ao interpretar o JSON`);
            }
            
            console.log('✅ Gemini - JSON recuperado com sucesso!');
          }

          if (courseData && courseData.title && Array.isArray(courseData.modules)) {
            console.log(`✅ Gemini - Curso gerado: ${courseData.modules.length} módulos, ${courseData.modules.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0)} aulas`);
            return courseData;
          } else {
            throw new Error('Estrutura do curso incompleta');
          }
          
        } catch (modelError) {
          geminiError = modelError;
          console.log(`❌ Modelo ${modelName} falhou:`, modelError.message);
          // Continua para o próximo modelo
        }
      }
      
      // Se todos os modelos falharem
      throw geminiError;
      
    } catch (error) {
      lastError = error;
      console.log(`❌ Gemini - Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Esperando 1.5s antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }
  
  throw lastError;
}

// 👇 FUNÇÃO: Build prompt
function buildPrompt(payload) {
  const { level = 'beginner', categoryId, subcategoryId, tags = [] } = payload;
  
  const categoryName = 'Categoria';
  const subcategoryName = 'Subcategoria';
  
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.beginner;

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
- Tono: ${cfg.tone}
- Foco em aplicação prática
- Exercícios com 3 opções
- NÃO use "A.", "B.", "C." nas opções - use apenas o texto da opção
- A RESPOSTA deve ser o TEXTO COMPLETO da opção correta
- Garanta que a resposta corresponda exatamente a uma das opções fornecidas
`.trim();
}

// 👇 FUNÇÃO PRINCIPAL: Escolhe o provider
async function generateCourseWithProvider(payload, provider = 'openai', level = 'beginner') {
  console.log(`🎯 Gerando curso ${level.toUpperCase()} com ${provider.toUpperCase()}...`);
  console.log(`🎯 Usando provider: ${provider.toUpperCase()}`);
  
  // 👇 VERIFICAR LIMITE ANTES DE PROSSEGUIR
  try {
    checkAndUpdateUsage(provider);
  } catch (limitError) {
    console.log(`❌ Limite atingido para ${provider}:`, limitError.message);
    throw limitError;
  }
  
  const prompt = buildPrompt(payload);
  let courseData;

  try {
    if (provider.toLowerCase() === 'gemini') {
      try {
        console.log('🔄 Tentando Gemini primeiro...');
        courseData = await generateWithGemini(prompt, level, 1);
        console.log('✅ Gemini funcionou!');
      } catch (geminiError) {
        console.log('🔄 Gemini falhou, usando OpenAI como fallback...');
        console.log(`🔍 Erro do Gemini: ${geminiError.message}`);
        
        // 👇 FALLBACK PARA OPENAI
        if (process.env.OPENAI_API_KEY) {
          try {
            checkAndUpdateUsage('openai');
            courseData = await generateWithOpenAI(prompt, level, 2);
            console.log('✅ Fallback OpenAI bem-sucedido');
          } catch (openaiError) {
            // Reverter contagem do Gemini já que não foi usado
            usageTracker.gemini.dailyCount--;
            throw new Error(`Gemini falhou e fallback OpenAI também: ${openaiError.message}`);
          }
        } else {
          // Reverter contagem do Gemini já que não foi usado
          usageTracker.gemini.dailyCount--;
          throw new Error('Gemini falhou e OpenAI não está configurado');
        }
      }
    } else {
      // 👇 OPENAI NORMAL
      courseData = await generateWithOpenAI(prompt, level, 2);
    }
    
    return courseData;
    
  } catch (error) {
    console.error(`❌ Erro final em generateCourseWithProvider:`, error.message);
    throw error;
  }
}

// 👇 FUNÇÃO: Adiciona _key recursivamente
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

// 👇 FUNÇÃO: Sanitiza dados mantendo estrutura correta
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

// 👇 FUNÇÃO: Calcula duração
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

// 👇 Tags opcionais e deduplicadas
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
    maxTokens: 4000
  },
  intermediate: {
    modules: 4,
    lessonsPerModule: 3,
    tips: 2,
    exercises: 2,
    tone: 'detalhado e aplicado, com exemplos reais e desafios práticos',
    maxTokens: 5000
  },
  advanced: {
    modules: 5,
    lessonsPerModule: 4,
    tips: 3,
    exercises: 3,
    tone: 'abrangente, técnico e aprofundado, voltado para profissionais experientes',
    maxTokens: 7000
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

// =======================================================
// 🧠 ROTA PRINCIPAL - GERAR CURSO
// =======================================================
router.post('/course', async (req, res) => {
  try {
    const { level, categoryId, subcategoryId, tags = [], provider } = req.body;
    console.log('🧾 Payload recebido:', req.body);

    if (!level) {
      return res.status(400).json({ error: 'level é obrigatório.' });
    }
    if (!categoryId) {
      return res.status(400).json({ error: 'categoryId é obrigatório.' });
    }
    if (!provider) {
      return res.status(400).json({ error: 'provider é obrigatório.' });
    }

    if (!['openai', 'gemini'].includes(provider)) {
      return res.status(400).json({ error: 'Provider deve ser "openai" ou "gemini".' });
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
      return res.status(400).json({ error: 'Level deve ser "beginner", "intermediate" ou "advanced".' });
    }

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
- NÃO TRUNCAR A RESPOSTA - use todos os tokens disponíveis se necessário
`.trim();

    console.log(`🎯 Gerando curso ${level.toUpperCase()} com ${provider.toUpperCase()}...`);

    const courseData = await generateCourseWithProvider(req.body, provider, level);
    
    if (!courseData) {
      throw new Error('Não foi possível gerar o curso após todas as tentativas');
    }

    const sanitizedData = sanitizeCourseData(courseData);
    const validation = validateCourseData(sanitizedData);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

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
          provider: provider,
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
      provider: provider,
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
      level: newCourse.level,
      tagsCount: newCourse.tags?.length,
      modulesCount: newCourse.modules?.length
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
        provider: provider,
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

// 👇 ROTA: Verificar providers disponíveis
router.get('/providers', async (req, res) => {
  try {
    const providers = {
      openai: {
        status: process.env.OPENAI_API_KEY ? 'available' : 'unconfigured',
        model: 'gpt-4o-mini',
        usage: usageTracker.openai,
        limit: DAILY_LIMITS.openai
      },
      gemini: {
        status: process.env.GEMINI_API_KEY ? 'available' : 'unconfigured',
        model: 'gemini-pro',
        usage: usageTracker.gemini,
        limit: DAILY_LIMITS.gemini
      }
    };

    // Testa conexão Gemini se disponível
    if (providers.gemini.status === 'available') {
      try {
        const genAI = configureGemini();
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        await model.generateContent("Test");
        providers.gemini.status = 'available';
      } catch (geminiError) {
        console.error('❌ Gemini API test failed:', geminiError.message);
        providers.gemini.status = 'unavailable';
        providers.gemini.error = geminiError.message;
      }
    }

    // Verifica limites de uso
    Object.keys(providers).forEach(provider => {
      if (providers[provider].status === 'available') {
        try {
          checkAndUpdateUsage(provider);
          // Se passou, reverte o incremento (só verificação)
          usageTracker[provider].dailyCount--;
        } catch (limitError) {
          providers[provider].status = 'limit_reached';
          providers[provider].error = limitError.message;
        }
      }
    });

    const availableProviders = Object.keys(providers).filter(
      provider => providers[provider].status === 'available'
    );

    res.json({
      available: availableProviders,
      detailed: providers,
      usage: usageTracker
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar providers:', error);
    res.status(500).json({ 
      available: process.env.OPENAI_API_KEY ? ['openai'] : [],
      error: error.message 
    });
  }
});

module.exports = router;