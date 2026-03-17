const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const generateCourse = async (req, res) => {
  // Aumenta o timeout para 10 minutos para processos longos de IA
  req.setTimeout(600000); 

  const { topic, provider } = req.body;
  if (!topic) return res.status(400).json({ error: 'O tema é obrigatório' });

  // --- CONFIGURAÇÃO PARA PROGRESSO REAL (SSE) ---
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); 

  const sendProgress = (progress, message) => {
    const payload = JSON.stringify({ progress, message });
    const padding = " ".repeat(1024);
    res.write(`:${padding}\n`); 
    res.write(`data: ${payload}\n\n`);
    console.log(`🚀 [${progress}%] ${message}`);
  };

  try {
    sendProgress(5, `Iniciando motor de IA via ${provider || 'Groq'}...`);

    // --- Passo 1: IA Gerando Conteúdo ---
    const courseData = await generateCourseContent(topic, provider);
    sendProgress(40, "Conteúdo estruturado. Calculando métricas pedagógicas...");

    const rawModules = courseData.modules || [];
    if (rawModules.length === 0) throw new Error('A IA falhou ao gerar os módulos.');

    // --- Passo 2: Lógica de Cálculos de Tempo (V1.0) ---
    const allText = (courseData.description || "") + 
                    rawModules.reduce((acc, mod) => acc + (mod.content || ""), "");
    
    const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;
    const readingMinutes = wordCount / 225; // 225 palavras por minuto
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
    } catch (imgErr) { console.error("Erro Imagem:", imgErr); }

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
      slug: doc.slug.current
    });

    res.write(`data: ${finalResult}\n\n`);
    res.end();

  } catch (error) {
    console.error("❌ Erro no Controller:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

module.exports = { generateCourse };