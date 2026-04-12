const client = require('../config/sanity');
const aiService = require('../services/aiService');
const imageService = require('../services/imageService');
const quotaService = require('../services/quotaService');
const { formatSlug } = require('../utils/formatter');

/**
 * CONTROLADOR DE CURSOS (CourseController)
 * Orquestra Quota, IA, Imagem e Persistência no Sanity v1.3.
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
      return res.status(503).json({ error: "O servidor de IA está com alta carga. Tente novamente em breve." });
    }

    // 2. CÉREBRO: Chama o serviço de IA
    // Importante: O aiService deve retornar o JSON no novo formato (com lessons dentro de modules)
    const aiData = await aiService.generateCourseContent(topic, 'llama-3.3-70b-versatile', { level });

    // 3. ESTÉTICA: Busca e faz upload da imagem
    const imageData = await imageService.fetchAndUploadImage(aiData);

    // 4. CATEGORIA: Busca ou Cria de forma dinâmica
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

    // 5. SALVAMENTO: Mapeamento para o Schema v1.3
    const courseTitle = aiData.title;
    // Slug: titulo-da-ia + sufixo aleatório para evitar duplicidade
    const finalSlug = `${formatSlug(courseTitle)}-${Math.random().toString(36).substring(2, 7)}`;

    const newCourse = {
      _type: 'course',
      title: courseTitle,
      slug: { _type: 'slug', current: finalSlug },
      description: aiData.description,
      author: { _type: 'reference', _ref: userId },
      category: { _type: 'reference', _ref: category._id },
      level: level || 'iniciante',
      estimatedTime: aiData.estimatedTime || 0,
      xpReward: aiData.xpReward || 100, // Recompensa padrão
      tags: aiData.tags || [],
      isPublished: true,

      // Estrutura hierárquica atualizada: Módulos -> Aulas -> Exercícios
      modules: aiData.modules.map(module => ({
        _type: 'module', // Importante para o Sanity identificar o objeto
        title: module.title,
        lessons: module.lessons.map(lesson => ({
          _type: 'object',
          title: lesson.title,
          content: lesson.content,
          duration: lesson.duration || 5
        })),
        exercises: module.exercises.map(ex => ({
          _type: 'object',
          question: ex.question,
          options: ex.options,
          correctAnswer: ex.correctAnswer
        }))
      })),

      finalExam: aiData.finalExam.map(ex => ({
        _type: 'object',
        question: ex.question,
        options: ex.options,
        correctAnswer: ex.correctAnswer
      })),

      // Thumbnail vinda do Sanity Assets
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

    // 6. CONSUMO: Só desconta o crédito do usuário após o Sanity confirmar o registro
    await quotaService.consumeCredit(userId);

    return res.status(201).json({
      success: true,
      message: "Curso gerado e salvo com sucesso!",
      course: {
        id: result._id,
        slug: result.slug.current,
        title: result.title,
        xpReward: result.xpReward
      }
    });

  } catch (error) {
    console.error("❌ Erro Crítico no CourseController:", error.message);

    // Tenta reverter o crédito se algo falhou no meio do caminho
    try {
      await quotaService.refundCredit(userId);
    } catch (refundError) {
      console.error("⚠️ Falha crítica: Erro ao reembolsar crédito do usuário.");
    }

    return res.status(500).json({ 
      success: false,
      error: "Falha na geração do curso. Seus créditos foram preservados." 
    });
  }
};

module.exports = { createCourse };