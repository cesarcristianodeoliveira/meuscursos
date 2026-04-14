const client = require('../config/sanity');
const aiService = require('../services/aiService');
const imageService = require('../services/imageService');
const quotaService = require('../services/quotaService');
const { formatSlug } = require('../utils/formatter');
const crypto = require('crypto'); // Para gerar as _key únicas

/**
 * CONTROLADOR DE CURSOS (CourseController) v1.3
 * Orquestra Quota, IA, Imagem e Persistência com chaves únicas.
 */

const createCourse = async (req, res) => {
  const { topic, level } = req.body;
  const userId = req.userId; 

  if (!topic) {
    return res.status(400).json({ error: "O tema do curso é obrigatório." });
  }

  try {
    // 1. SEGURANÇA: Verifica se o usuário tem créditos (Quota)
    const userQuota = await quotaService.checkUserQuota(userId);
    if (!userQuota.canGenerate) {
      return res.status(429).json({ error: userQuota.reason });
    }

    const globalQuota = await quotaService.checkGlobalQuota();
    if (!globalQuota.isOk) {
      return res.status(503).json({ error: "Servidor de IA sobrecarregado. Tente logo mais." });
    }

    // 2. CÉREBRO: Chama o serviço de IA
    const aiData = await aiService.generateCourseContent(topic, 'llama-3.3-70b-versatile', { level });

    // 3. ESTÉTICA: Busca e faz upload da imagem
    const imageData = await imageService.fetchAndUploadImage(aiData);

    // 4. CATEGORIA: Busca ou Cria
    const categoryName = aiData.categoryName || 'Geral';
    const categorySlug = formatSlug(categoryName);

    let category = await client.fetch(
      `*[_type == "category" && slug.current == $slug][0]`, 
      { slug: categorySlug }
    );

    if (!category) {
      category = await client.create({
        _type: 'category',
        title: categoryName,
        slug: { _type: 'slug', current: categorySlug }
      });
    }

    // 5. SALVAMENTO: Mapeamento v1.3 com _key obrigatórias
    const courseTitle = aiData.title;
    const finalSlug = `${formatSlug(courseTitle)}-${crypto.randomBytes(3).toString('hex')}`;

    const newCourse = {
      _type: 'course',
      title: courseTitle,
      slug: { _type: 'slug', current: finalSlug },
      description: aiData.description,
      author: { _type: 'reference', _ref: userId },
      category: { _type: 'reference', _ref: category._id },
      level: level || 'iniciante',
      estimatedTime: aiData.estimatedTime || 0,
      xpReward: aiData.xpReward || 100,
      tags: aiData.tags || [],
      isPublished: true,

      // Mapeamento de Módulos com Chaves Únicas (RESOLVE O WARNING DO SANITY)
      modules: aiData.modules.map(module => ({
        _key: crypto.randomUUID(),
        _type: 'courseModule', // Batendo com o Schema v1.3
        title: module.title,
        lessons: module.lessons.map(lesson => ({
          _key: crypto.randomUUID(),
          _type: 'lesson',
          title: lesson.title,
          content: lesson.content,
          duration: lesson.duration || 5
        })),
        exercises: module.exercises.map(ex => ({
          _key: crypto.randomUUID(),
          _type: 'exercise',
          question: ex.question,
          options: ex.options,
          correctAnswer: ex.correctAnswer
        }))
      })),

      finalExam: aiData.finalExam.map(ex => ({
        _key: crypto.randomUUID(),
        _type: 'examQuestion',
        question: ex.question,
        options: ex.options,
        correctAnswer: ex.correctAnswer
      })),

      thumbnail: imageData?.assetId ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageData.assetId }
      } : undefined,

      externalImageId: imageData?.externalImageId || null,

      aiMetadata: {
        _type: 'object',
        provider: aiData.aiMetadata?.provider || 'Groq',
        model: aiData.aiMetadata?.model || 'llama-3.3-70b-versatile',
        totalTokens: aiData.aiMetadata?.totalTokens || 0,
        generatedAt: new Date().toISOString()
      }
    };

    const result = await client.create(newCourse);

    // 6. CONSUMO: Atualiza créditos e stats.lastGenerationAt
    await quotaService.consumeCredit(userId);

    return res.status(201).json({
      success: true,
      course: {
        id: result._id,
        slug: result.slug.current,
        title: result.title
      }
    });

  } catch (error) {
    console.error("❌ Erro no CourseController:", error.message);
    return res.status(500).json({ 
      success: false,
      error: "Falha na geração do curso." 
    });
  }
};

module.exports = { createCourse };