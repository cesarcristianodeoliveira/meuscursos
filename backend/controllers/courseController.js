const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

/**
 * Função Auxiliar para garantir Unicidade
 * Retorna o slug final e o número do sufixo (se houver)
 */
const getUniqueSlugInfo = async (baseSlug) => {
  let finalSlug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    // Consulta no Sanity se o slug já existe
    const query = `count(*[_type == "course" && slug.current == $slug])`;
    const count = await client.fetch(query, { slug: finalSlug });

    if (count === 0) {
      isUnique = true;
    } else {
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
    }
  }
  return { finalSlug, counter };
};

const generateCourse = async (req, res) => {
  req.setTimeout(600000); 

  const { topic, provider } = req.body;
  if (!topic) return res.status(400).json({ error: 'O tema é obrigatório' });

  // --- CONFIGURAÇÃO SSE ---
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); 

  const sendProgress = (progress, message, extra = {}) => {
    const payload = JSON.stringify({ progress, message, ...extra });
    res.write(`data: ${payload}\n\n`);
  };

  try {
    sendProgress(5, `Conectando ao provedor ${provider || 'Groq'}...`);

    // --- Passo 1: IA Gerando Conteúdo ---
    const courseData = await generateCourseContent(topic, provider);
    sendProgress(40, "Conteúdo estruturado. Analisando métricas pedagógicas...");

    const rawModules = courseData.modules || [];
    if (rawModules.length === 0) throw new Error('A IA falhou ao gerar os módulos.');

    // --- Passo 2: Cálculos de Tempo e Rating ---
    const allText = [
      courseData.title || "",
      courseData.description || "",
      ...rawModules.map(m => (m.title || "") + " " + (m.content || ""))
    ].join(" ");

    const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;
    const readingMinutes = wordCount / 180; 
    const activityMinutes = (rawModules.reduce((acc, mod) => acc + (mod.exercises?.length || 0), 0) * 2) + 
                            ((courseData.finalExam?.length || 0) * 3);

    const finalEstimatedTime = Number(Math.max(0.5, ((readingMinutes + activityMinutes) * 1.1) / 60).toFixed(1));
    const finalRating = Number((Math.max(4.3, Math.min(5.0, Number(courseData.rating) || 4.5))).toFixed(1));

    // --- Passo 3: Tratamento de Slug e Título ÚNICOS ---
    const rawTitle = courseData.title || topic;
    const baseSlug = formatSlug(rawTitle);

    sendProgress(55, "Verificando integridade e duplicidade...");
    
    // Chamada da verificação no Sanity
    const { finalSlug, counter } = await getUniqueSlugInfo(baseSlug);

    // Se o counter for maior que 1, adicionamos o (N) no título visual
    const finalTitle = counter > 1 ? `${rawTitle} (${counter})` : rawTitle;

    sendProgress(65, "Buscando imagens e gerando identidade visual...");

    // --- Passo 4: Upload da Imagem ---
    let imageAsset = null;
    try {
      imageAsset = await fetchAndUploadImage(
        courseData.searchQuery || topic, 
        courseData.category?.name || "education"
      );
    } catch (imgErr) { 
      console.error("⚠️ Erro no processo de imagem:", imgErr.message); 
    }

    sendProgress(85, "Finalizando montagem do material didático...");

    // --- Passo 5: Montagem do Documento Sanity ---
    const doc = {
      _type: 'course',
      title: finalTitle,
      slug: { _type: 'slug', current: finalSlug },
      description: courseData.description,
      estimatedTime: finalEstimatedTime, 
      rating: finalRating,
      aiProvider: courseData.aiProvider || "Groq",
      aiModel: courseData.aiModel || "llama-3.3-70b",
      stats: {
        promptTokens: courseData.usage?.promptTokens || 0,
        completionTokens: courseData.usage?.completionTokens || 0,
        totalTokens: courseData.usage?.totalTokens || 0,
        generatedAt: new Date().toISOString()
      },
      category: {
        name: courseData.category?.name || "Geral",
        slug: formatSlug(courseData.category?.slug || courseData.category?.name || "geral")
      },
      modules: rawModules.map(mod => ({
        _key: `mod_${Math.random().toString(36).substr(2, 9)}`,
        title: mod.title || "Módulo",
        content: mod.content || "",
        exercises: (mod.exercises || []).map(ex => ({
          _key: `ex_${Math.random().toString(36).substr(2, 9)}`,
          question: ex.question,
          options: ex.options,
          correctAnswer: String(ex.correctAnswer).trim()
        }))
      })),
      finalExam: (courseData.finalExam || []).map(exam => ({
        _key: `exam_${Math.random().toString(36).substr(2, 9)}`,
        question: exam.question,
        options: exam.options,
        correctAnswer: String(exam.correctAnswer).trim()
      }))
    };

    if (imageAsset && imageAsset._id) {
      doc.thumbnail = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAsset._id
        }
      };
      console.log("🔗 Thumbnail vinculada:", imageAsset._id);
    }

    sendProgress(95, "Salvando no banco de dados...");
    
    const result = await client.create(doc);

    sendProgress(100, 'Curso gerado com sucesso!', { 
      courseId: result._id,
      slug: finalSlug // Garantimos que o frontend redirecione para o novo slug único
    });
    
    res.end();

  } catch (error) {
    console.error("❌ Erro no Controller:", error);
    res.write(`data: ${JSON.stringify({ error: "SERVER_ERROR", message: error.message })}\n\n`);
    res.end();
  }
};

module.exports = { generateCourse };