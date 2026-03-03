const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const generateCourse = async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'O tema é obrigatório' });

  try {
    const data = await generateCourseContent(topic);

    // 1. Tratamento de Título e Slug
    let finalTitle = data.title || topic;
    const slugCandidate = formatSlug(finalTitle);
    
    // 2. Upload da Imagem
    const imageAsset = await fetchAndUploadImage(
      data.searchQuery || topic, 
      data.pixabay_category || "education"
    );

    // 3. Montagem do Documento Sanity conforme novo Schema
    const doc = {
      _type: 'course',
      title: finalTitle,
      slug: { _type: 'slug', current: slugCandidate },
      description: data.description,
      estimatedTime: data.estimatedTime || 10,
      rating: data.rating || 4.8,
      aiProvider: data.aiProvider,
      aiModel: data.aiModel,
      
      // Categoria como Objeto
      category: {
        name: data.categoryName || "Geral",
        slug: { _type: 'slug', current: formatSlug(data.categoryName || "Geral") }
      },

      // Mapeamento de Módulos com Exercícios
      modules: (data.modules || []).map(mod => ({
        _key: Math.random().toString(36).substring(2, 11),
        title: mod.title || "Módulo Técnico",
        content: mod.content || "",
        exercises: (mod.exercises || []).map(ex => ({
          _key: Math.random().toString(36).substring(2, 11),
          question: ex.question,
          options: ex.options,
          correctAnswer: ex.correctAnswer
        }))
      })),

      // Prova Final
      finalExam: (data.finalExam || []).map(exam => ({
        _key: Math.random().toString(36).substring(2, 11),
        question: exam.question,
        options: exam.options,
        correctAnswer: exam.correctAnswer
      }))
    };

    if (imageAsset) doc.thumbnail = imageAsset;

    const result = await client.create(doc);
    
    res.status(200).json({ 
      message: 'Curso Completo Gerado!', 
      courseId: result._id,
      slug: doc.slug.current 
    });

  } catch (error) {
    console.error("Erro no Controller:", error);
    res.status(500).json({ error: 'Falha técnica ao processar curso denso.' });
  }
};

module.exports = { generateCourse };