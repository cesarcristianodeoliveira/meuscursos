const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const generateCourse = async (req, res) => {
  // Aumenta o timeout para lidar com o processamento denso da IA
  req.setTimeout(600000); 

  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'O tema é obrigatório' });

  try {
    console.log(`🚀 Iniciando geração pedagógica para: ${topic}`);
    const courseData = await generateCourseContent(topic);

    const rawModules = courseData.modules || [];
    if (rawModules.length === 0) {
      return res.status(500).json({ error: 'A IA falhou ao estruturar os módulos.' });
    }

    // --- 1. LÓGICA DE TEMPO ESTIMADO (10 caracteres = 5 segundos) ---
    // Somamos a descrição e todo o conteúdo dos módulos
    const totalText = courseData.description + rawModules.reduce((acc, mod) => acc + (mod.content || ""), "");
    const totalCharacters = totalText.length;
    
    // Cálculo: (Caracteres / 10) * 5 segundos = Total em segundos
    // Total em segundos / 60 = Total em minutos
    const totalMinutes = (totalCharacters / 10) * 5 / 60;
    
    // Convertemos para horas com uma casa decimal (ex: 4.5h)
    // Garantimos um mínimo de 1 hora para cursos muito curtos
    const finalEstimatedTime = Math.max(1, parseFloat((totalMinutes / 60).toFixed(1)));

    // --- 2. LÓGICA DE RATING (Arredondamento para múltiplos de 0.5) ---
    // Ex: 3.7 vira 3.5 | 3.8 vira 4.0 | 4.2 vira 4.0 | 4.3 vira 4.5
    const rawRating = Number(courseData.rating) || 4.5;
    const finalRating = Math.round(rawRating * 2) / 2;

    // --- 3. TRATAMENTO DE SLUG E TÍTULO ---
    let finalTitle = courseData.title || topic;
    let slugCandidate = formatSlug(finalTitle);
    
    const existing = await client.fetch(
      `*[_type == "course" && slug.current == $slugCandidate][0]`, 
      { slugCandidate }
    );
    if (existing) {
      slugCandidate = `${slugCandidate}-${Math.floor(Math.random() * 1000)}`;
    }

    // --- 4. UPLOAD DA IMAGEM ---
    const imageAsset = await fetchAndUploadImage(
      courseData.searchQuery || topic, 
      courseData.pixabay_category || "education" 
    );

    // --- 5. MONTAGEM DO DOCUMENTO FINAL ---
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

      // Mapeamento de Módulos (Limitando a 3 exercícios por módulo por segurança)
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

      // Mapeamento da Prova Final (IA gera entre 10 e 20)
      finalExam: (courseData.finalExam || []).map(exam => ({
        _key: Math.random().toString(36).substring(2, 11),
        question: exam.question,
        options: exam.options,
        correctAnswer: String(exam.correctAnswer).trim()
      }))
    };

    if (imageAsset) doc.thumbnail = imageAsset;

    console.log(`📦 Salvando no Sanity: ${finalTitle} (${finalEstimatedTime}h, Rating: ${finalRating})`);
    const result = await client.create(doc);
    
    res.status(200).json({ 
      message: 'Curso gerado com sucesso!', 
      courseId: result._id,
      slug: doc.slug.current,
      debug: { time: finalEstimatedTime, rating: finalRating }
    });

  } catch (error) {
    console.error("❌ Erro Crítico no Controller:", error);
    res.status(500).json({ 
      error: 'Falha técnica ao processar curso denso.',
      message: error.message 
    });
  }
};

module.exports = { generateCourse };