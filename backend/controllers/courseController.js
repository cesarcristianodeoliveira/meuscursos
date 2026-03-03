const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const generateCourse = async (req, res) => {
  // Define um timeout longo para aguentar o tempo de resposta da IA (60s+)
  req.setTimeout(600000); 

  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'O tema é obrigatório' });

  try {
    console.log(`🚀 Gerando curso exaustivo sobre: ${topic}`);
    const courseData = await generateCourseContent(topic);

    const rawModules = courseData.modules || [];
    if (rawModules.length === 0) {
      return res.status(500).json({ error: 'A IA não retornou módulos válidos.' });
    }

    // 1. Definição de Título e Slug
    let finalTitle = courseData.title || topic;
    let slugCandidate = formatSlug(finalTitle);
    
    // Verifica duplicidade de slug
    const existing = await client.fetch(
      `*[_type == "course" && slug.current == $slugCandidate][0]`, 
      { slugCandidate }
    );
    if (existing) {
      slugCandidate = `${slugCandidate}-${Math.floor(Math.random() * 1000)}`;
    }

    // 2. Upload da Imagem
    const imageAsset = await fetchAndUploadImage(
      courseData.searchQuery || topic, 
      courseData.pixabay_category || "education" 
    );

    // 3. Montagem do Documento (Sincronizado com o novo Schema)
    const doc = {
      _type: 'course',
      title: finalTitle,
      slug: { _type: 'slug', current: slugCandidate },
      description: courseData.description,
      estimatedTime: Number(courseData.estimatedTime) || 4,
      rating: Number(courseData.rating) || 5,
      aiProvider: courseData.aiProvider,
      aiModel: courseData.aiModel,
      
      // Ajuste para o objeto Categoria do seu Schema
      category: {
        name: courseData.categoryName || "Geral",
        slug: { _type: 'slug', current: formatSlug(courseData.categoryName || "geral") }
      },

      // Mapeamento de Módulos + Exercícios (O segredo do aprendizado ativo)
      modules: rawModules.map(mod => ({
        _key: Math.random().toString(36).substring(2, 11),
        title: mod.title || "Unidade Técnica",
        content: mod.content || "",
        exercises: (mod.exercises || []).map(ex => ({
          _key: Math.random().toString(36).substring(2, 11),
          question: ex.question,
          options: ex.options,
          correctAnswer: String(ex.correctAnswer).trim() // Limpa espaços extras
        }))
      })),

      // Mapeamento da Prova Final (15 questões conforme instrução)
      finalExam: (courseData.finalExam || []).map(exam => ({
        _key: Math.random().toString(36).substring(2, 11),
        question: exam.question,
        options: exam.options,
        correctAnswer: String(exam.correctAnswer).trim()
      }))
    };

    if (imageAsset) {
      doc.thumbnail = imageAsset;
    }

    console.log(`📦 Enviando curso denso para o Sanity...`);
    const result = await client.create(doc);
    
    res.status(200).json({ 
      message: 'Curso gerado com sucesso!', 
      courseId: result._id,
      slug: doc.slug.current 
    });

  } catch (error) {
    console.error("❌ Erro no Controller:", error);
    res.status(500).json({ 
      error: 'Falha técnica ao processar curso.',
      message: error.message 
    });
  }
};

module.exports = { generateCourse };