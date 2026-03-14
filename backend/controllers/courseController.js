const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const generateCourse = async (req, res) => {
  // Aumenta o timeout para 10 minutos
  req.setTimeout(600000); 

  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'O tema é obrigatório' });

  // --- CONFIGURAÇÃO PARA PROGRESSO REAL (SSE) ---
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Desativa buffering no Nginx/Render

  // Helper para enviar o progresso com "Padding" para forçar o Render a liberar o buffer
  const sendProgress = (progress, message) => {
    const payload = JSON.stringify({ progress, message });
    // Enviamos um comentário inicial ":" seguido de espaços para garantir que o pacote tenha > 1kb
    // Isso "destrava" o streaming em proxies como o do Render
    const padding = " ".repeat(1024);
    res.write(`:${padding}\n`); 
    res.write(`data: ${payload}\n\n`);
    
    // Log no console do backend
    console.log(`🚀 [${progress}%] ${message}`);
  };

  try {
    sendProgress(5, "Iniciando integração com a IA...");

    // --- Passo 1: IA Gerando Conteúdo ---
    const courseData = await generateCourseContent(topic);
    sendProgress(40, "Conteúdo estruturado. Calculando métricas pedagógicas...");

    const rawModules = courseData.modules || [];
    if (rawModules.length === 0) {
      throw new Error('A IA falhou ao estruturar os módulos.');
    }

    // --- Passo 2: Lógica de Cálculos ---
    const allText = (courseData.description || "") + rawModules.reduce((acc, mod) => acc + (mod.content || ""), "");
    const wordCount = allText.split(/\s+/).filter(word => word.length > 0).length;
    const readingMinutes = wordCount / 200;
    const exerciseMinutes = (rawModules.length * 3 * 2) + (courseData.finalExam?.length || 10);
    const totalMinutes = readingMinutes + exerciseMinutes;
    const finalEstimatedTime = Math.max(1, parseFloat((totalMinutes / 60).toFixed(1)));
    const finalRating = Math.round((Number(courseData.rating) || 4.5) * 2) / 2;

    // --- Passo 3: Tratamento de Slug ---
    let finalTitle = courseData.title || topic;
    let slugCandidate = formatSlug(finalTitle);
    const existing = await client.fetch(`*[_type == "course" && slug.current == $slugCandidate][0]`, { slugCandidate });
    if (existing) slugCandidate = `${slugCandidate}-${Math.floor(Math.random() * 1000)}`;

    sendProgress(65, "Buscando imagens e gerando identidade visual...");

    // --- Passo 4: Upload da Imagem ---
    let imageAsset = null;
    try {
      imageAsset = await fetchAndUploadImage(
        courseData.searchQuery || topic, 
        courseData.pixabay_category || "education" 
      );
    } catch (imgErr) {
      console.error("Erro ao carregar imagem:", imgErr);
    }

    sendProgress(85, "Finalizando montagem do material didático...");

    // --- Passo 5: Montagem do Documento ---
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
        _key: Math.random().toString(36).substring(2, 11),
        title: mod.title || "Módulo",
        content: mod.content || "",
        exercises: (mod.exercises || []).slice(0, 3).map(ex => ({
          _key: Math.random().toString(36).substring(2, 11),
          question: ex.question,
          options: ex.options,
          correctAnswer: String(ex.correctAnswer).trim()
        }))
      })),
      finalExam: (courseData.finalExam || []).map(exam => ({
        _key: Math.random().toString(36).substring(2, 11),
        question: exam.question,
        options: exam.options,
        correctAnswer: String(exam.correctAnswer).trim()
      }))
    };

    if (imageAsset) doc.thumbnail = imageAsset;

    // --- Passo 6: Persistência ---
    sendProgress(95, "Salvando no Sanity e indexando conteúdo...");
    const result = await client.create(doc);
    
    // --- RESPOSTA FINAL (Ainda via stream) ---
    const finalResult = JSON.stringify({ 
      progress: 100,
      message: 'Curso gerado com sucesso!', 
      courseId: result._id,
      slug: doc.slug.current
    });

    res.write(`data: ${finalResult}\n\n`);
    res.end(); // Finaliza a conexão

  } catch (error) {
    console.error("❌ Erro Crítico no Controller:", error);
    const errorPayload = JSON.stringify({ 
      error: 'Falha técnica ao processar curso.',
      message: error.message 
    });
    res.write(`data: ${errorPayload}\n\n`);
    res.end();
  }
};

module.exports = { generateCourse };