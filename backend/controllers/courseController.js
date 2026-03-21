const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const generateCourse = async (req, res) => {
  // Timeout de 10 min para processos pesados de IA
  req.setTimeout(600000); 

  const { topic, provider } = req.body;
  if (!topic) return res.status(400).json({ error: 'O tema é obrigatório' });

  // --- CONFIGURAÇÃO SSE (Streaming) ---
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); 

  const sendProgress = (progress, message, extra = {}) => {
    const payload = JSON.stringify({ progress, message, ...extra });
    const padding = " ".repeat(1024); // Preenchimento para forçar o flush em alguns navegadores
    res.write(`:${padding}\n`); 
    res.write(`data: ${payload}\n\n`);
  };

  try {
    sendProgress(5, `Iniciando motor de IA via ${provider || 'Groq'}...`);

    // --- Passo 1: IA Gerando Conteúdo + Captura de Limites Reais ---
    const courseData = await generateCourseContent(topic, provider);
    
    // Extraímos os limites reais vindos dos headers da Groq através do aiService
    const currentAiLimits = courseData.limits || {};
    
    sendProgress(40, "Conteúdo estruturado. Calculando métricas pedagógicas...", {
      quotaInfo: currentAiLimits 
    });

    const rawModules = courseData.modules || [];
    if (rawModules.length === 0) throw new Error('A IA falhou ao gerar os módulos.');

    // --- Passo 2: Cálculos de Tempo e Rating ---
    const allText = (courseData.description || "") + 
                    rawModules.reduce((acc, mod) => acc + (mod.content || ""), "");
    
    const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;
    const readingMinutes = wordCount / 225; 
    const totalExercises = rawModules.reduce((acc, mod) => acc + (mod.exercises?.length || 0), 0);
    const activityMinutes = (totalExercises * 2) + (courseData.finalExam?.length || 10) * 1.5;
    
    const finalEstimatedTime = Math.max(0.5, parseFloat(((readingMinutes + activityMinutes) / 60).toFixed(1)));
    const finalRating = Math.round((Number(courseData.rating) || 4.5) * 2) / 2;

    // --- Passo 3: Tratamento de Slug ---
    let finalTitle = courseData.title || topic;
    let slugCandidate = formatSlug(finalTitle);

    sendProgress(65, "Buscando imagens e gerando identidade visual...");

    // --- Passo 4: Upload da Imagem ---
    let imageAsset = null;
    try {
      imageAsset = await fetchAndUploadImage(
        courseData.searchQuery || topic, 
        courseData.pixabay_category || "education" 
      );
    } catch (imgErr) { 
      console.error("⚠️ Erro ao carregar imagem, prosseguindo sem ela:", imgErr.message); 
    }

    sendProgress(85, "Finalizando montagem do material didático...");

    // --- Passo 5: Montagem do Documento Sanity ---
    const doc = {
      _type: 'course',
      title: finalTitle,
      slug: { _type: 'slug', current: slugCandidate },
      description: courseData.description,
      estimatedTime: finalEstimatedTime, 
      rating: finalRating,
      aiProvider: courseData.aiProvider,
      aiModel: courseData.aiModel,
      
      // SALVANDO ESTATÍSTICAS DE TOKENS (Sincronizado com backend/index.js)
      stats: {
        // CORREÇÃO v1.2: Agora usa camelCase para bater com o retorno do aiService revisado
        promptTokens: courseData.usage?.promptTokens || 0,
        completionTokens: courseData.usage?.completionTokens || 0,
        totalTokens: courseData.usage?.totalTokens || 0,
        generatedAt: new Date().toISOString()
      },

      category: {
        name: courseData.categoryName || "Geral",
        slug: { _type: 'slug', current: formatSlug(courseData.categoryName || "geral") }
      },
      modules: rawModules.map(mod => ({
        _key: `mod_${Math.random().toString(36).substr(2, 9)}`,
        title: mod.title || "Módulo",
        content: mod.content || "",
        exercises: (mod.exercises || []).map(ex => ({
          _key: `ex_${Math.random().toString(36).substr(2, 9)}`,
          question: ex.question,
          options: ex.options,
          correctAnswer: String(ex.correctAnswer).trim()
        }))
      })),
      finalExam: (courseData.finalExam || []).map(exam => ({
        _key: `exam_${Math.random().toString(36).substr(2, 9)}`,
        question: exam.question,
        options: exam.options,
        correctAnswer: String(exam.correctAnswer).trim()
      }))
    };

    if (imageAsset) doc.thumbnail = imageAsset;

    // --- Passo 6: Persistência ---
    sendProgress(95, "Salvando no Sanity e indexando...");
    const result = await client.create(doc);
    
    const finalResult = JSON.stringify({ 
      progress: 100,
      message: 'Curso pronto!', 
      courseId: result._id,
      slug: doc.slug.current,
      quotaUpdate: currentAiLimits // Atualiza o Hero no frontend imediatamente após salvar
    });

    res.write(`data: ${finalResult}\n\n`);
    res.end();

  } catch (error) {
    console.error("❌ Erro no Controller:", error);

    if (error.message === "QUOTA_EXCEEDED") {
      const quotaPayload = JSON.stringify({ 
        error: "QUOTA_EXCEEDED", 
        provider: error.provider || provider,
        resetTime: error.resetTime, 
        message: `Limite atingido. Tente novamente em ${error.resetTime || 'alguns minutos'}.`
      });
      res.write(`data: ${quotaPayload}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
    
    res.end();
  }
};

module.exports = { generateCourse };