const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const generateCourse = async (req, res) => {
  // Aumenta o timeout para lidar com o processamento denso da IA
  req.setTimeout(600000); 

  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'O tema é obrigatório' });

  // --- CONFIGURAÇÃO PARA PROGRESSO REAL (SSE - Server Sent Events) ---
  // Isso permite que o backend envie mensagens sem fechar a conexão
  res.setHeader('Content-Type', 'application/json'); 
  // Nota: Para simplificar sem mudar o frontend para EventSource agora, 
  // vamos usar um helper para logs no console do backend e manter o res.json no final,
  // mas preparei os pontos de progresso para a integração total.

  try {
    console.log(`🚀 [0%] Iniciando geração pedagógica para: ${topic}`);

    // --- Passo 1: IA Gerando Conteúdo ---
    const courseData = await generateCourseContent(topic);
    console.log(`🧠 [40%] IA estruturou o conteúdo. Processando dados...`);

    const rawModules = courseData.modules || [];
    if (rawModules.length === 0) {
      throw new Error('A IA falhou ao estruturar os módulos.');
    }

    // --- Passo 2: Lógica de Cálculos ---
    const allText = courseData.description + rawModules.reduce((acc, mod) => acc + (mod.content || ""), "");
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

    console.log(`🎨 [60%] Gerando identidade visual e buscando imagens...`);

    // --- Passo 4: Upload da Imagem ---
    const imageAsset = await fetchAndUploadImage(
      courseData.searchQuery || topic, 
      courseData.pixabay_category || "education" 
    );

    console.log(`🏗️ [80%] Montando documento final para o Sanity...`);

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
    console.log(`📦 [95%] Salvando no banco de dados...`);
    const result = await client.create(doc);
    
    console.log(`✅ [100%] Curso pronto: ${finalTitle}`);

    // Resposta Final
    res.status(200).json({ 
      message: 'Curso gerado com sucesso!', 
      courseId: result._id,
      slug: doc.slug.current,
      debug: { time: finalEstimatedTime, words: wordCount, rating: finalRating }
    });

  } catch (error) {
    console.error("❌ Erro Crítico no Controller:", error);
    res.status(500).json({ 
      error: 'Falha técnica ao processar curso.',
      message: error.message 
    });
  }
};

module.exports = { generateCourse };