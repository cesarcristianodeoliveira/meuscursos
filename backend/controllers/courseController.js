const client = require('../config/sanity');
const aiService = require('../services/aiService');
const imageService = require('../services/imageService');
const quotaService = require('../services/quotaService');
const { formatSlug } = require('../utils/formatter');

/**
 * CONTROLADOR DE CURSOS (CourseController)
 * Orquestra Quota, IA, Imagem e Persistência no Sanity.
 */

const createCourse = async (req, res) => {
  const { topic, level } = req.body;
  const userId = req.userId; // Extraído do Token via authMiddleware

  if (!topic) {
    return res.status(400).json({ error: "O tema do curso é obrigatório." });
  }

  try {
    // 1. SEGURANÇA: Verifica se o usuário tem permissão para gerar
    const userQuota = await quotaService.checkUserQuota(userId);
    if (!userQuota.canGenerate) {
      return res.status(429).json({ error: userQuota.reason });
    }

    const globalQuota = await quotaService.checkGlobalQuota();
    if (!globalQuota.isOk) {
      return res.status(503).json({ error: "O servidor de IA está com alta carga. Tente novamente em breve." });
    }

    // 2. CÉREBRO: Gera o conteúdo estruturado via Groq/Llama
    // Passamos o tópico e o nível (iniciante, intermediario, avancado)
    const aiData = await aiService.generateCourseContent(topic, 'llama-3.3-70b-versatile', { level });

    // 3. ESTÉTICA: Busca capa no Pixabay e faz upload para o Sanity Assets
    const imageData = await imageService.fetchAndUploadImage(aiData);

    // 4. CATEGORIA: Garante que a categoria exista (Busca ou Cria)
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

    // 5. SALVAMENTO: Prepara o documento final seguindo o Schema atualizado
    const courseTitle = aiData.title;
    const finalSlug = `${formatSlug(courseTitle)}-${Math.random().toString(36).substring(2, 7)}`;

    const newCourse = {
      _type: 'course',
      title: courseTitle,
      slug: { _type: 'slug', current: finalSlug },
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
      
      // Upload do asset se a imagem foi encontrada
      thumbnail: imageData ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageData.assetId }
      } : undefined,

      // Campo independente conforme discutido no Schema
      externalImageId: imageData?.externalImageId || null,

      // Metadados para auditoria
      aiMetadata: {
        provider: aiData.aiMetadata.provider,
        model: aiData.aiMetadata.model,
        totalTokens: aiData.aiMetadata.totalTokens,
        generatedAt: aiData.aiMetadata.generatedAt
      }
    };

    const result = await client.create(newCourse);

    // 6. FINALIZAÇÃO: Só consome o crédito após o sucesso total da operação
    await quotaService.consumeCredit(userId);

    return res.status(201).json({
      message: "Seu curso foi gerado com sucesso pela nossa IA!",
      course: {
        id: result._id,
        slug: result.slug.current,
        title: result.title,
        xpReward: result.xpReward
      }
    });

  } catch (error) {
    console.error("❌ Erro Crítico no CourseController:", error.message);
    
    // Tenta reembolsar em caso de quebra após o início do processo
    try {
      await quotaService.refundCredit(userId);
    } catch (refundError) {
      console.error("⚠️ Falha ao processar reembolso automático.");
    }

    return res.status(500).json({ 
      error: "Ocorreu um erro ao processar sua solicitação. Seus créditos foram preservados." 
    });
  }
};

module.exports = { createCourse };