const client = require('../config/sanity');
const aiService = require('../services/aiService');
const imageService = require('../services/imageService');
const quotaService = require('../services/quotaService');
const { formatSlug } = require('../utils/formatter');

const createCourse = async (req, res) => {
  const { topic, level } = req.body;
  const userId = req.userId; // Vem do authMiddleware

  try {
    // 1. SEGURANÇA: Verifica cota do usuário e global
    const userQuota = await quotaService.checkUserQuota(userId);
    if (!userQuota.canGenerate) {
      return res.status(429).json({ error: userQuota.reason });
    }

    const globalQuota = await quotaService.checkGlobalQuota();
    if (!globalQuota.isOk) {
      return res.status(503).json({ error: "Sistema sobrecarregado. Tente em 1 hora." });
    }

    // 2. CÉREBRO: Gera a estrutura do curso via IA (Groq)
    const aiData = await aiService.generateCourseContent(topic, 'llama-3.3-70b-versatile', { level });

    // 3. ESTÉTICA: Busca e faz upload da capa (Pixabay -> Sanity Assets)
    const imageData = await imageService.fetchAndUploadImage(aiData);

    // 4. CATEGORIA: Garante que a categoria existe ou cria uma nova
    const categorySlug = formatSlug(aiData.categoryName || 'Geral');
    let category = await client.fetch(`*[_type == "category" && slug.current == $slug][0]`, { slug: categorySlug });

    if (!category) {
      category = await client.create({
        _type: 'category',
        title: aiData.categoryName || 'Geral',
        slug: { _type: 'slug', current: categorySlug }
      });
    }

    // 5. SALVAMENTO: Monta o documento final no Sanity
    const newCourse = {
      _type: 'course',
      title: aiData.title,
      slug: { _type: 'slug', current: `${formatSlug(aiData.title)}-${Date.now()}` },
      description: aiData.description,
      author: { _type: 'reference', _ref: userId },
      category: { _type: 'reference', _ref: category._id },
      level: level || 'iniciante',
      estimatedTime: aiData.estimatedTime,
      xpReward: aiData.xpReward,
      tags: aiData.tags || [],
      modules: aiData.modules,
      finalExam: aiData.finalExam,
      isPublished: true,
      thumbnail: imageData ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageData.assetId }
      } : undefined,
      aiMetadata: {
        ...aiData.aiMetadata,
        externalImageId: imageData?.externalImageId
      }
    };

    const result = await client.create(newCourse);

    // 6. FINALIZAÇÃO: Consome o crédito do usuário
    await quotaService.consumeCredit(userId);

    res.status(201).json({
      message: "Curso gerado com sucesso!",
      course: {
        id: result._id,
        slug: result.slug.current,
        xpReward: result.xpReward
      }
    });

  } catch (error) {
    console.error("❌ Erro ao criar curso:", error.message);
    // REEMBOLSO: Se deu erro após o check, devolvemos o crédito (opcional)
    await quotaService.refundCredit(userId);
    res.status(500).json({ error: "Falha na geração do curso. Crédito preservado." });
  }
};

module.exports = { createCourse };