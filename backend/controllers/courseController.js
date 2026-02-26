const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const generateCourse = async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'O tema é obrigatório' });

  try {
    const courseData = await generateCourseContent(topic);

    const rawModules = courseData.modules || courseData.modulos || [];
    if (rawModules.length === 0) {
      return res.status(500).json({ error: 'Erro na estrutura da IA.' });
    }

    let finalTitle = courseData.title || topic;
    const slugCandidate = formatSlug(finalTitle);
    
    const existing = await client.fetch(
      `*[_type == "course" && slug.current == $slugCandidate][0]`, 
      { slugCandidate }
    );
    
    if (existing) {
      finalTitle = `${finalTitle}: Edição Profissional`;
    }

    const imageAsset = await fetchAndUploadImage(
      courseData.searchQuery || topic, 
      courseData.pixabay_category || "education" 
    );

    const doc = {
      _type: 'course',
      title: finalTitle,
      // CORREÇÃO DA CATEGORIA: Aplicando formatSlug para ficar minúsculo e com hifens
      category: formatSlug(courseData.site_category || "geral"),
      slug: { _type: 'slug', current: formatSlug(finalTitle) },
      description: courseData.description,
      modules: rawModules.map(mod => ({
        _key: Math.random().toString(36).substring(2, 11),
        title: mod.title || "Unidade Técnica",
        content: (Array.isArray(mod.content) ? mod.content.join('\n\n') : (mod.content || ""))
          .split('\n')
          .map(l => l.trimStart())
          .join('\n')
      }))
    };

    if (imageAsset) {
      doc.thumbnail = imageAsset;
    }

    const result = await client.create(doc);
    
    res.status(200).json({ 
      message: 'Curso gerado com sucesso!', 
      courseId: result._id,
      slug: doc.slug.current 
    });

  } catch (error) {
    console.error("Erro no Controller:", error);
    res.status(500).json({ error: 'Falha técnica ao processar curso.' });
  }
};

module.exports = { generateCourse };