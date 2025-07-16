// D:\meuscursos\backend\controllers\courseController.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';

// --- Configuração da Gemini API ---
if (!process.env.GEMINI_API_KEY) {
    console.error("Erro: Variável de ambiente GEMINI_API_KEY não definida em courseController.");
}
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// --- Configuração do Sanity Client para ESCRITA ---
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variável de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em courseController.");
}
const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12',
    useCdn: false, // Desabilita CDN para escritas e leitura de dados frescos
    token: process.env.SANITY_TOKEN, // Token de autenticação para escritas
}) : null;

// --- Função auxiliar para gerar slug amigável para URLs e único ---
const generateSlug = (text) => {
    const normalizedText = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const baseSlug = normalizedText
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    return `${baseSlug}-${uuidv4().substring(0, 8)}`; 
};

// Helper para converter string de texto para Portable Text básico (formato Rich Text do Sanity)
const convertToPortableText = (text) => {
    if (!text) return [];
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');

    return paragraphs.map(p => ({
        _key: uuidv4(),
        _type: 'block',
        children: [
            {
                _key: uuidv4(),
                _type: 'span',
                marks: [],
                text: p.trim(),
            },
        ],
        markDefs: [],
        style: 'normal',
    }));
};

// --- Funções do Controlador de Cursos ---

/**
 * @function generateTags
 * @description Endpoint para gerar sugestões de tags para um curso usando a IA da Gemini.
 * @param {Object} req - Objeto de requisição (contém topic, category, subCategory, level no body).
 * @param {Object} res - Objeto de resposta.
 */
export const generateTags = async (req, res) => {
    if (!genAI) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Chave da Gemini API não inicializada.' });
    }

    const { topic, category, subCategory, level } = req.body; 

    if (!topic || !category || !subCategory || !level) {
        return res.status(400).json({ error: 'Dados incompletos: Tópico, Categoria, Subcategoria e Nível são necessários para gerar tags.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

        // ALTERAÇÃO NO PROMPT: Removido o ```json para instruir a IA a não incluir isso na resposta
        const prompt = `Gere uma lista de até 10 tags (palavras-chave) em português para um curso com o seguinte tópico principal: "${topic}".
        Considere que a categoria de ID "${category}", subcategoria de ID "${subCategory}", e nível de dificuldade "${level}".
        As tags devem ser relevantes, concisas (1-3 palavras por tag), e cobrir os principais temas e áreas de interesse do curso.
        Formate a resposta APENAS como um array JSON de strings, sem nenhum texto introdutório ou explicativo.
        Exemplo: ["programacao", "javascript", "frontend", "desenvolvimento web", "react", "iniciante"]
        `;

        console.log(`[BACKEND] Gerando tags para o tópico: "${topic}"...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("[BACKEND] Resposta vazia ou inesperada da Gemini API ao gerar tags.");
            return res.status(500).json({ error: 'A IA retornou uma resposta vazia ou em formato inesperado ao gerar tags.' });
        }

        let suggestedTags;
        try {
            // Ajusta o regex para tentar remover ```json caso a IA ainda os envie (redundante com o novo prompt, mas seguro)
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            let rawJsonString = jsonMatch ? jsonMatch[1] : text.trim();
            rawJsonString = rawJsonString.replace(/^[\r\n]+|[\r\n]+$/g, '');
            rawJsonString = rawJsonString.replace(/”/g, '"').replace(/“/g, '"');
            
            suggestedTags = JSON.parse(rawJsonString);

            if (!Array.isArray(suggestedTags) || suggestedTags.some(tag => typeof tag !== 'string')) {
                throw new Error('Formato de tags sugeridas pela IA inválido: Esperado um array de strings.');
            }
            
            suggestedTags = [...new Set(suggestedTags.map(tag => tag.trim().toLowerCase()))];

        } catch (parseError) {
            console.error("[BACKEND] Erro ao parsear JSON das tags da Gemini API:", parseError);
            console.error("[BACKEND] Texto bruto de tags recebido da Gemini (primeiros 500 chars):", text.substring(0, 500) + (text.length > 500 ? '...' : ''));
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA para tags. Formato JSON inválido.', rawText: text });
        }

        res.status(200).json({
            message: 'Tags sugeridas geradas com sucesso!',
            suggestedTags: suggestedTags,
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de geração de tags pela IA:", error);
        
        if (error.response?.status === 503) {
            console.error("[BACKEND] Gemini API: Modelo sobrecarregado ou serviço indisponível (503 Service Unavailable).");
            return res.status(503).json({
                error: "Nosso serviço de IA está sobrecarregado. Por favor, tente gerar as tags novamente em alguns instantes.",
                details: error.message
            });
        }
        if (error.response?.status === 429) { 
            console.error("[BACKEND] Gemini API Rate Limit Excedido (tags):", error.response.data.error);
            return res.status(429).json({ 
                error: "Limite de requisições da IA para tags excedido. Por favor, tente novamente em breve.", 
                details: error.response.data.error.message 
            });
        }
        if (error.response && error.response.data) {
            console.error("[BACKEND] Erro da Gemini API (tags):", error.response.data.error);
            return res.status(500).json({ 
                error: `Erro da Gemini API ao gerar tags: ${error.response.data.error.message}`, 
                details: error.response.data 
            });
        }
        res.status(500).json({ error: 'Falha interna ao gerar tags para o curso.', details: error.message });
    }
};

/**
 * @function generateCoursePreview
 * @description Endpoint para gerar uma pré-visualização de um curso (título, descrição, lições) usando a IA da Gemini.
 * @param {Object} req - Objeto de requisição (contém topic, category, subCategory, level, tags e creatorId no body).
 * @param {Object} res - Objeto de resposta.
 */
export const generateCoursePreview = async (req, res) => {
    if (!genAI || !sanityClient) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Chaves de API ou Cliente Sanity não inicializados.' });
    }

    const { topic, category, subCategory, level, tags } = req.body; 
    const creatorId = req.user?.id;

    if (!topic || !category || !subCategory || !level || !creatorId) {
        return res.status(400).json({ error: 'Dados incompletos: Tópico, Categoria, Subcategoria, Nível e ID do criador são necessários.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

        let tagsContext = '';
        if (tags && tags.length > 0) {
            tagsContext = `Considere que o curso deve incorporar as seguintes tags/palavras-chave em seu conteúdo, descrição e títulos de lição: "${tags.join(', ')}".
            As tags devem ser incorporadas de forma a enriquecer o título, a descrição e o conteúdo das lições.
            `;
        }

        // ALTERAÇÃO NO PROMPT: Removido o ```json para instruir a IA a não incluir isso na resposta
        const prompt = `Gere um esquema de curso detalhado em português, garantindo que o **título do curso e os títulos das lições sejam altamente originais e únicos**, mesmo quando os parâmetros iniciais são semelhantes.

        ${tagsContext} O curso deve ser sobre "${topic}", na categoria de ID "${category}" e subcategoria de ID "${subCategory}", e ter um nível de dificuldade "${level}".
        
        Considere uma perspectiva ou abordagem ligeiramente diferente para este curso, tornando-o distintivo e não apenas uma repetição de cursos com temas próximos.
        
        **Varie o início do título do curso e das lições** com diferentes abordagens e sinônimos (ex: "Fluência em Inglês", "Domine o Inglês", "Inglês na Prática", "Guia Completo de Inglês", "Desvende o Inglês", etc. para títulos de curso de inglês). **Evite repetir as mesmas palavras iniciais nos títulos de cursos e lições.**

        O esquema deve conter:
        - Um campo 'title' (string): **Um título altamente criativo, único e atraente** para o curso (idealmente até 10 palavras). Deve refletir claramente o conteúdo gerado com base no tópico, categoria, subcategoria e nível, e destacar a unicidade da abordagem.
        - Um campo 'description' (string): Uma breve descrição concisa (2-3 frases), que também capture o ângulo único do curso.
        - Um campo 'lessons' (array de objetos): Uma lista de **5 a 7 lições essenciais e bem estruturadas**. Cada lição deve ter:
            - 'title' (string): **Um título único e cativante** para a lição, que seja relevante para o curso e não repetitivo em relação a outras lições.
            - 'order' (number): A ordem da lição no curso, começando de 1.
            - 'content' (string): Conteúdo detalhado da lição (3-5 parágrafos de texto corrido, sem formatação Markdown complexa ou HTML). Foque em clareza, profundidade adequada ao nível especificado e exemplos práticos quando aplicável.
            - 'estimatedReadingTime' (number): Tempo estimado de leitura em minutos para esta lição (entre 3 e 15).
        A resposta deve ser APENAS um objeto JSON válido, sem nenhum texto introdutório ou explicativo.
        Exemplo de formato JSON para o curso e lições (o slug será gerado pelo backend):
        {
            "title": "Titulo do Curso Único e Criativo",
            "description": "Uma descrição breve e engajante que destaca a singularidade.",
            "lessons": [
                {
                    "title": "Titulo da Licao 1 Única",
                    "order": 1,
                    "content": "Conteúdo do parágrafo 1.\\n\\nConteúdo do parágrafo 2.",
                    "estimatedReadingTime": 7
                },
                {
                    "title": "Titulo da Licao 2 Diferente",
                    "order": 2,
                    "content": "Mais conteúdo aqui.\\n\\nOutro parágrafo.",
                    "estimatedReadingTime": 10
                }
            ]
        }
        `;

        console.log(`[BACKEND] Gerando pré-visualização para o tópico: "${topic}", categoria: "${category}", subcategoria: "${subCategory}", nível: "${level}"...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("[BACKEND] Resposta vazia ou inesperada da Gemini API.");
            return res.status(500).json({ error: 'A IA retornou uma resposta vazia ou em formato inesperado.' });
        }

        let generatedCourseData;
        try {
            // Ajusta o regex para tentar remover ```json caso a IA ainda os envie (redundante com o novo prompt, mas seguro)
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            let rawJsonString = jsonMatch ? jsonMatch[1] : text.trim();
            rawJsonString = rawJsonString.replace(/^[\r\n]+|[\r\n]+$/g, '');
            rawJsonString = rawJsonString.replace(/”/g, '"').replace(/“/g, '"');

            generatedCourseData = JSON.parse(rawJsonString);

            if (generatedCourseData.title) {
                generatedCourseData.slug = {
                    current: generateSlug(generatedCourseData.title),
                    _type: 'slug'
                };
            } else {
                generatedCourseData.slug = { current: `curso-${uuidv4()}`, _type: 'slug' };
            }

            if (generatedCourseData.lessons && Array.isArray(generatedCourseData.lessons)) {
                generatedCourseData.lessons = generatedCourseData.lessons.map(lesson => {
                    if (lesson.title) {
                        lesson.slug = {
                            current: generateSlug(lesson.title),
                            _type: 'slug'
                        };
                    } else {
                        lesson.slug = { current: `licao-${uuidv4()}`, _type: 'slug' };
                    }
                    return lesson;
                });
            }

        } catch (parseError) {
            console.error("[BACKEND] Erro ao parsear JSON ou gerar slugs da Gemini API:", parseError);
            console.error("[BACKEND] Texto bruto recebido da Gemini (primeiros 500 chars):", text.substring(0, 500) + (text.length > 500 ? '...' : ''));
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA. Formato JSON inválido ou falha na geração de slug.', rawText: text });
        }

        const responseData = {
            ...generatedCourseData,
            category: category,
            subCategory: subCategory,
            level: level,
            tags: tags,
            promptUsed: prompt,
            aiModelUsed: "gemini-2.0-flash"
        };

        res.status(200).json({
            message: 'Pré-visualização do curso gerada com sucesso!',
            coursePreview: responseData,
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de geração da pré-visualização do curso:", error);
        
        if (error.response?.status === 429) { 
            console.error("[BACKEND] Gemini API Rate Limit Excedido:", error.response.data.error);
            return res.status(429).json({ 
                error: "Limite de requisições da IA excedido para a pré-visualização. Por favor, tente novamente em breve.", 
                details: error.response.data.error.message 
            });
        }
        if (error.response && error.response.data) {
            console.error("[BACKEND] Erro da Gemini API:", error.response.data.error);
            return res.status(500).json({ 
                error: `Erro da Gemini API: ${error.response.data.error.message}`, 
                details: error.response.data 
            });
        }
        res.status(500).json({ error: 'Falha interna ao gerar a pré-visualização do curso.', details: error.message });
    }
};

/**
 * @function saveGeneratedCourse
 * @description Salva um curso gerado pela IA no Sanity CMS, incluindo lições e tags, e atualiza os créditos do criador.
 * @param {Object} req - Objeto de requisição (contém courseData, category, subCategory, level, tags no body, e user no JWT).
 * @param {Object} res - Objeto de resposta.
 */
export const saveGeneratedCourse = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Cliente Sanity não inicializado.' });
    }

    console.log('[BACKEND - saveGeneratedCourse] Dados recebidos na requisição:', JSON.stringify(req.body, null, 2));

    const { 
        courseData, 
        category, 
        subCategory, 
        level, 
        tags 
    } = req.body; 

    const aiGenerationPromptFromPreview = courseData.promptUsed || ''; 
    const aiModelUsedFromPreview = courseData.aiModelUsed || 'gemini-2.0-flash';

    const creatorId = req.user?.id;

    if (!courseData || !creatorId || !category || !subCategory || !level || !Array.isArray(tags)) {
        return res.status(400).json({ error: 'Dados incompletos para salvar o curso. Verifique courseData, category, subCategory, level, tags (array) e creatorId.' });
    }

    console.log('[BACKEND - saveGeneratedCourse] Conteúdo de courseData:', JSON.stringify(courseData, null, 2));
    console.log('[BACKEND - saveGeneratedCourse] Prompt de Geração da IA (a ser salvo):', aiGenerationPromptFromPreview);
    console.log('[BACKEND - saveGeneratedCourse] Modelo de IA Usado (a ser salvo):', aiModelUsedFromPreview);
    console.log('[BACKEND - saveGeneratedCourse] Tags recebidas (nomes):', tags);

    let transaction; 

    try {
        const member = await sanityClient.fetch(
            `*[_id == $creatorId][0]{isAdmin, credits}`,
            { creatorId }
        );

        if (!member) {
            throw new Error(`Membro com ID ${creatorId} não encontrado.`);
        }

        let updatedCredits = member.credits;
        const isMemberAdmin = member.isAdmin === true; 

        if (!isMemberAdmin) {
            if (member.credits <= 0) {
                throw new Error('Créditos insuficientes para criar um curso.');
            }
            updatedCredits = member.credits - 1; 
            console.log(`[BACKEND] Créditos antes: ${member.credits}, Créditos depois: ${updatedCredits} para o membro ${creatorId}`);
        } else {
            console.log(`[BACKEND] Usuário Admin ${creatorId} está criando um curso. Nenhum crédito consumido.`);
        }

        let initialCourseSlug = courseData.slug.current;
        let finalCourseSlug = initialCourseSlug;
        let slugIsUnique = false;
        let attempt = 0;
        const MAX_SLUG_ATTEMPTS = 5;

        while (!slugIsUnique && attempt < MAX_SLUG_ATTEMPTS) {
            const existingCourse = await sanityClient.fetch(
                `*[_type == "course" && slug.current == $slug][0]{_id}`,
                { slug: finalCourseSlug }
            );

            if (!existingCourse) {
                slugIsUnique = true;
            } else {
                attempt++;
                console.warn(`[BACKEND] Slug "${finalCourseSlug}" já existe no Sanity. Tentando gerar um novo (tentativa ${attempt}).`);
                finalCourseSlug = `${generateSlug(courseData.title)}-${uuidv4().substring(0, 4)}`; 
            }
        }

        if (!slugIsUnique) {
            throw new Error('Falha ao gerar um slug único para o curso após múltiplas tentativas. Por favor, tente um tópico diferente para o curso.');
        }

        const courseSlugForSanity = {
            _type: 'slug',
            current: finalCourseSlug,
        };

        const courseId = `course-${uuidv4()}`; 
        const lessonRefs = []; 
        let totalEstimatedDuration = 0;

        transaction = sanityClient.transaction(); 

        transaction.patch(creatorId, (patch) => {
            return patch
                .set({ credits: updatedCredits })
                .setIfMissing({ createdCourses: [] })
                .append('createdCourses', [{ 
                    _ref: courseId, 
                    _type: 'reference',
                    _key: uuidv4(), 
                }]);
        });
        console.log(`[BACKEND] Transação iniciada. Membro ${creatorId} será atualizado e o curso será adicionado.`);

        for (const lesson of courseData.lessons) {
            const lessonSlug = lesson.slug; 
            const lessonId = `lesson-${uuidv4()}`;

            const newLesson = {
                _id: lessonId,
                _type: 'lesson',
                title: lesson.title,
                slug: lessonSlug,
                content: convertToPortableText(lesson.content),
                order: lesson.order,
                estimatedReadingTime: lesson.estimatedReadingTime || 5,
                status: 'published',
                course: {
                    _ref: courseId, 
                    _type: 'reference',
                },
            };

            transaction.create(newLesson);
            lessonRefs.push({
                _key: uuidv4(), 
                _ref: lessonId,
                _type: 'reference',
            });
            totalEstimatedDuration += (lesson.estimatedReadingTime || 0);
            console.log(`[BACKEND] Lição "${lesson.title}" adicionada à transação (ID: ${lessonId}).`);
        }

        const courseTagRefs = []; 
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                const normalizedTagName = tagName.trim().toLowerCase();

                // Busca a tag existente pelo campo 'name' ou 'title'
                const existingTag = await sanityClient.fetch(
                    `*[_type == "courseTag" && (name == $tagName || title == $tagName)][0]{_id, categories[]->{_id}}`, // Inclui categorias existentes
                    { tagName: normalizedTagName }
                );

                let tagRefId;
                if (existingTag) {
                    tagRefId = existingTag._id;
                    console.log(`[BACKEND] Tag existente encontrada: "${normalizedTagName}" (ID: ${tagRefId}).`);

                    // Verifica se a categoria do curso já está associada a esta tag
                    const categoryAlreadyLinked = existingTag.categories && existingTag.categories.some(cat => cat._id === category);

                    if (!categoryAlreadyLinked) {
                        // Se a tag existe e a categoria atual não está linkada, adiciona a categoria à tag
                        console.log(`[BACKEND] Adicionando referência à categoria "${category}" na tag existente "${normalizedTagName}".`);
                        transaction.patch(tagRefId).append('categories', [{
                            _ref: category,
                            _type: 'reference',
                            _key: uuidv4()
                        }]);
                    }

                } else {
                    // Se a tag não existe, cria uma nova
                    const newTagId = `courseTag-${uuidv4()}`;
                    const newTagSlug = { 
                        _type: 'slug',
                        current: generateSlug(normalizedTagName),
                    };

                    const newTagDocument = {
                        _id: newTagId,
                        _type: 'courseTag',
                        name: normalizedTagName, // Use 'name' se seu schema de tag usa 'name', caso contrário, 'title'
                        slug: newTagSlug,
                        description: `Tag gerada automaticamente para o tópico: ${normalizedTagName}.`,
                        categories: [
                            {
                                _ref: category,
                                _type: 'reference',
                                _key: uuidv4() 
                            }
                        ]
                    };
                    
                    transaction.create(newTagDocument);
                    tagRefId = newTagId;
                    console.log(`[BACKEND] Nova tag criada e adicionada à transação: "${normalizedTagName}" (ID: ${newTagId}).`);
                }

                courseTagRefs.push({
                    _ref: tagRefId,
                    _type: 'reference',
                    _key: uuidv4(), 
                });
            }
        }

        const newCourse = {
            _id: courseId,
            _type: 'course',
            title: courseData.title,
            description: courseData.description,
            slug: courseSlugForSanity,
            lessons: lessonRefs,
            status: 'published',
            price: 0,
            isProContent: false,
            level: level, 
            estimatedDuration: totalEstimatedDuration, 
            creator: {
                _ref: creatorId, 
                _type: 'reference',
            },
            category: { _ref: category, _type: 'reference' }, 
            subCategory: { _ref: subCategory, _type: 'reference' }, 
            courseTags: courseTagRefs,
            aiGenerationPrompt: aiGenerationPromptFromPreview,
            aiModelUsed: aiModelUsedFromPreview,
            generatedAt: new Date().toISOString(),
            lastGenerationRevision: new Date().toISOString(),
        };

        transaction.create(newCourse);
        console.log(`[BACKEND] Curso "${newCourse.title}" adicionado à transação (ID: ${courseId}).`);

        console.log("[BACKEND] Transação preparada para criar curso, lições, tags (se novas) e ATUALIZAR membro. Executando commit...");

        const transactionResult = await transaction.commit(); 
        
        console.log(`[BACKEND] Transação concluída com sucesso! Documentos criados e atualizados:`, transactionResult);

        const memberUpdateInfo = transactionResult.results.find(
            r => r.id === creatorId && r.operation === 'update'
        );

        res.status(201).json({
            message: 'Curso, lições e tags salvos com sucesso! Créditos e cursos do membro atualizados.',
            course: newCourse,
            lessons: courseData.lessons,
            memberUpdateId: memberUpdateInfo ? memberUpdateInfo.id : null,
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de salvamento do curso:", error);
        
        if (error.message === 'Créditos insuficientes para criar um curso.') {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao salvar o curso.', details: error.message });
    }
};