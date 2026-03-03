const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const generateCourse = async (req, res) => {
  // Aumenta o tempo de resposta aceitável para o cliente
  req.setTimeout(600000); // 10 minutos (previne timeout no Vercel/Node)

  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'O tema é obrigatório' });

  try {
    console.log(`🚀 Iniciando geração exaustiva para: ${topic}...`);
    
    // Chama a IA com o novo prompt de alta densidade
    const data = await generateCourseContent(topic);

    if (!data.modules || data.modules.length === 0) {
      throw new Error("A IA retornou um curso sem módulos.");
    }

    // 1. Tratamento de Título e Slug Inteligente
    let finalTitle = data.title || topic;
    let slugCandidate = formatSlug(finalTitle);
    
    // Verifica se já existe um curso com esse slug para evitar erro no Sanity
    const existing = await client.fetch(`*[_type == "course" && slug.current == $slugCandidate][0]`, { slugCandidate });
    if (existing) {
      slugCandidate = `${slugCandidate}-${Math.floor(Math.random() * 1000)}`;
    }

    // 2. Upload da Imagem (Paralelo ao processamento se desejar, mas mantido sequencial para segurança)
    const imageAsset = await fetchAndUploadImage(
      data.searchQuery || topic, 
      data.pixabay_category || "education"
    );

    // 3. Montagem do Documento com Sanitização
    const doc = {
      _type: 'course',
      title: finalTitle,
      slug: { _type: 'slug', current: slugCandidate },
      description: data.description,
      estimatedTime: Number(data.estimatedTime) || 5,
      rating: Number(data.rating) || 4.9,
      aiProvider: data.aiProvider,
      aiModel: data.aiModel,
      
      category: {
        name: data.categoryName || "Geral",
        slug: { _type: 'slug', current: formatSlug(data.categoryName || "Geral") }
      },

      // Mapeamento de Módulos
      modules: data.modules.map(mod => ({
        _key: Math.random().toString(36).substring(2, 11),
        title: mod.title,
        content: mod.content,
        exercises: (mod.exercises || []).map(ex => ({
          _key: Math.random().toString(36).substring(2, 11),
          question: ex.question,
          options: ex.options,
          // Garante que a resposta correta não tenha espaços vazios nas pontas
          correctAnswer: String(ex.correctAnswer).trim()
        }))
      })),

      // Prova Final (15 questões esperadas)
      finalExam: (data.finalExam || []).map(exam => ({
        _key: Math.random().toString(36).substring(2, 11),
        question: exam.question,
        options: exam.options,
        correctAnswer: String(exam.correctAnswer).trim()
      }))
    };

    if (imageAsset) doc.thumbnail = imageAsset;

    console.log(`📦 Enviando curso (${doc.modules.length} módulos) para o Sanity...`);
    const result = await client.create(doc);
    
    res.status(200).json({ 
      message: 'Curso Profissional Gerado com Sucesso!', 
      courseId: result._id,
      slug: doc.slug.current,
      stats: {
        modules: doc.modules.length,
        examQuestions: doc.finalExam.length,
        time: doc.estimatedTime
      }
    });

  } catch (error) {
    console.error("❌ Erro Crítico no Controller:", error.message);
    res.status(500).json({ 
      error: 'Falha ao processar conteúdo denso.',
      details: error.message 
    });
  }
};

module.exports = { generateCourse };