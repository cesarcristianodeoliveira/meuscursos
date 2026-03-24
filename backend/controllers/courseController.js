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
    res.write(`data: ${payload}\n\n`);
  };

  try {
    sendProgress(5, `Conectando ao provedor ${provider || 'Groq'}...`);

    // --- Passo 1: IA Gerando Conteúdo ---
    const courseData = await generateCourseContent(topic, provider);

    sendProgress(40, "Conteúdo estruturado. Analisando métricas pedagógicas...");

    const rawModules = courseData.modules || [];
    if (rawModules.length === 0) throw new Error('A IA falhou ao gerar os módulos.');

    // --- Passo 2: Cálculos de Tempo e Rating ---
    const allText = [
      courseData.title || "",
      courseData.description || "",
      ...rawModules.map(m => (m.title || "") + " " + (m.content || ""))
    ].join(" ");

    const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;
    const readingMinutes = wordCount / 180; 

    const moduleExercisesCount = rawModules.reduce((acc, mod) => acc + (mod.exercises?.length || 0), 0);
    const finalExamCount = (courseData.finalExam?.length || 0);
    const activityMinutes = (moduleExercisesCount * 2) + (finalExamCount * 3);

    const totalMinutes = (readingMinutes + activityMinutes) * 1.1;

    // Persistindo como Number puro para evitar erros de localidade (ponto vs vírgula)
    const finalEstimatedTime = Number(Math.max(0.5, totalMinutes / 60).toFixed(1));

    let rawRating = Number(courseData.rating) || 4.5;
    if (rawRating < 4) rawRating = 4.3;
    if (rawRating > 5) rawRating = 5.0;
    const finalRating = Number(rawRating.toFixed(1));

    // --- Passo 3: Tratamento de Slug e Título ---
    const finalTitle = courseData.title || topic;
    const slugCandidate = formatSlug(finalTitle);

    sendProgress(65, "Buscando imagens e gerando identidade visual...");

    // --- Passo 4: Upload da Imagem ---
    let imageAsset = null;
    try {
      imageAsset = await fetchAndUploadImage(
        courseData.searchQuery || topic, 
        "education" 
      );
    } catch (imgErr) { 
      console.error("⚠️ Erro ao carregar imagem:", imgErr.message); 
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
      aiProvider: courseData.aiProvider || "Groq",
      aiModel: courseData.aiModel || "llama-3.3-70b",

      stats: {
        promptTokens: courseData.usage?.promptTokens || 0,
        completionTokens: courseData.usage?.completionTokens || 0,
        totalTokens: courseData.usage?.totalTokens || 0,
        generatedAt: new Date().toISOString()
      },

      category: {
        name: courseData.category?.name || "Geral",
        slug: formatSlug(courseData.category?.slug || courseData.category?.name || "geral")
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

    // CORREÇÃO: Extração segura do ID para o campo _ref (Evita o ClientError do log)
    if (imageAsset) {
      const assetId = typeof imageAsset === 'string' ? imageAsset : (imageAsset._id || imageAsset.id);
      
      if (assetId) {
        doc.thumbnail = {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: assetId
          }
        };
      }
    }

    // --- Passo 6: Persistência ---
    sendProgress(95, "Salvando no banco de dados e gerando certificados...");
    const result = await client.create(doc);

    const finalResult = JSON.stringify({ 
      progress: 100,
      message: 'Curso gerado com sucesso!', 
      courseId: result._id,
      slug: doc.slug.current
    });

    res.write(`data: ${finalResult}\n\n`);
    res.end();

  } catch (error) {
    console.error("❌ Erro no Controller:", error);
    const errorResponse = {
      error: "SERVER_ERROR",
      message: error.message
    };
    res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
    res.end();
  }
};

module.exports = { generateCourse };