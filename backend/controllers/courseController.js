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

    // --- Passo 2: Cálculos de Tempo e Rating (CORRIGIDOS) ---
    
    // 1. Somamos todo o conteúdo textual para um cálculo real
    const allText = [
      courseData.title || "",
      courseData.description || "",
      ...rawModules.map(m => (m.title || "") + " " + (m.content || ""))
    ].join(" ");

    const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;
    
    // Métrica: 180 palavras por minuto (leitura técnica/educacional)
    const readingMinutes = wordCount / 180; 

    // Métrica: Exercícios dos módulos (2 min cada) + Prova final (3 min cada questão)
    const moduleExercisesCount = rawModules.reduce((acc, mod) => acc + (mod.exercises?.length || 0), 0);
    const finalExamCount = (courseData.finalExam?.length || 0);
    const activityMinutes = (moduleExercisesCount * 2) + (finalExamCount * 3);

    // Tempo total com 10% de margem para navegação/reflexão
    const totalMinutes = (readingMinutes + activityMinutes) * 1.1;

    // FORÇAR NUMBER COM PONTO: Number(value.toFixed(1)) garante o tipo numérico puro
    const finalEstimatedTime = Number(Math.max(0.5, totalMinutes / 60).toFixed(1));

    // RATING: Garantir que seja número entre 4 e 5 com ponto decimal
    let rawRating = Number(courseData.rating) || 4.5;
    if (rawRating < 4) rawRating = 4.3; // Ajuste para cursos não ficarem com nota baixa
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
      estimatedTime: finalEstimatedTime, // Gravado como Number puro
      rating: finalRating,               // Gravado como Number puro
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

    // Ajuste da estrutura da imagem para o Sanity
    if (imageAsset) {
      doc.thumbnail = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAsset._id || imageAsset
        }
      };
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