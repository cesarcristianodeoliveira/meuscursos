// D:\meuscursos\backend\controllers\courseController.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';

// --- Configuração da Gemini API ---
if (!process.env.GEMINI_API_KEY) {
    console.error("Erro: Variável de ambiente GEMINI_API_KEY não definida em courseController.");
}
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// --- Configuração do Sanity Client ---
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em courseController.");
}
const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12', 
    useCdn: false, 
    token: process.env.SANITY_TOKEN, 
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
    
    // Adiciona um UUID curto para ajudar na unicidade imediata, 
    // mas a verificação no Sanity é o que garante 100%
    return `${baseSlug}-${uuidv4().substring(0, 8)}`; 
};

// Helper para converter string de texto para Portable Text básico
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

// --- NOVA FUNÇÃO: generateCoursePreview ---
export const generateCoursePreview = async (req, res) => {
    if (!genAI || !sanityClient) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Chaves de API ou Cliente Sanity não inicializados.' });
    }

    const { topic, category, subCategory, level, tags } = req.body; 
    const creatorId = req.user?.id; // Usar o ID do usuário autenticado

    if (!topic || !category || !subCategory || !level || !creatorId) {
        return res.status(400).json({ error: 'Dados incompletos: Tópico, Categoria, Subcategoria, Nível e ID do criador são necessários.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

        let tagsContext = '';
        if (tags && tags.length > 0) {
            const tagDetails = await sanityClient.fetch(
                `*[_type == "courseTag" && _id in $tags]{name, description}`,
                { tags }
            );

            if (tagDetails.length > 0) {
                tagsContext = `Considere também as seguintes tags para o curso e suas lições, utilizando-as para refinar o foco e o vocabulário: \n`;
                tagDetails.forEach(tag => {
                    tagsContext += `- **${tag.name}**: ${tag.description || 'Nenhuma descrição fornecida.'}\n`;
                });
                tagsContext += `As tags devem ser incorporadas de forma a enriquecer o título, a descrição e o conteúdo das lições.\n\n`;
            }
        }

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
        A resposta deve ser APENAS um objeto JSON válido, sem nenhum texto introdutório ou explicativo, e sem aspas triplas ('''json) ou outros caracteres extras.
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
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            let rawJsonString = jsonMatch ? jsonMatch[1] : text.trim();
            rawJsonString = rawJsonString.replace(/^[\r\n]+|[\r\n]+$/g, '');
            rawJsonString = rawJsonString.replace(/”/g, '"').replace(/“/g, '"');

            generatedCourseData = JSON.parse(rawJsonString);

            // --- MUDANÇA IMPORTANTE AQUI: GERAÇÃO DE SLUGS NO BACKEND PARA PRÉ-VISUALIZAÇÃO ---
            // A IA não gera mais o slug; seu backend o faz.
            if (generatedCourseData.title) {
                generatedCourseData.slug = {
                    current: generateSlug(generatedCourseData.title),
                    _type: 'slug' // Sanity exige _type para campo slug
                };
            } else {
                generatedCourseData.slug = { current: `curso-${uuidv4()}` };
            }

            if (generatedCourseData.lessons && Array.isArray(generatedCourseData.lessons)) {
                generatedCourseData.lessons = generatedCourseData.lessons.map(lesson => {
                    if (lesson.title) {
                        lesson.slug = {
                            current: generateSlug(lesson.title),
                            _type: 'slug'
                        };
                    } else {
                        lesson.slug = { current: `licao-${uuidv4()}` };
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
            tags: tags, // Enviar os IDs das tags de volta,
            promptUsed: prompt,
        };

        res.status(200).json({
            message: 'Pré-visualização do curso gerada com sucesso!',
            coursePreview: responseData, 
            promptUsed: prompt,
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de geração da pré-visualização do curso:", error);
        
        if (error.response && error.response.data) {
            if (error.response.status === 429) { 
                console.error("[BACKEND] Gemini API Rate Limit Excedido:", error.response.data.error);
                return res.status(429).json({ error: "Limite de requisições da IA excedido. Por favor, tente novamente em breve.", details: error.response.data.error.message });
            }
            console.error("[BACKEND] Erro da Gemini API:", error.response.data.error);
            return res.status(500).json({ error: `Erro da Gemini API: ${error.response.data.error.message}`, details: error.response.data });
        }
        res.status(500).json({ error: 'Falha interna ao gerar a pré-visualização do curso.', details: error.message });
    }
};

// --- NOVA FUNÇÃO: saveGeneratedCourse ---
export const saveGeneratedCourse = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Cliente Sanity não inicializado.' });
    }

    const { courseData, category, subCategory, level, tags } = req.body; 
    const creatorId = req.user?.id; 

    if (!courseData || !creatorId || !category || !subCategory || !level) {
        return res.status(400).json({ error: 'Dados incompletos para salvar o curso. Verifique courseData, category, subCategory, level e creatorId.' });
    }

    let transaction; 

    try {
        const member = await sanityClient.fetch(
            `*[_id == $creatorId][0]{isAdmin, credits}`,
            { creatorId }
        );

        if (!member) {
            throw new Error(`Member with ID ${creatorId} not found.`);
        }

        let updatedCredits = member.credits;
        const isMemberAdmin = member.isAdmin === true; 

        if (!isMemberAdmin) {
            if (member.credits <= 0) {
                throw new Error('Insufficient credits to create a course.');
            }
            updatedCredits = member.credits - 1; 
            console.log(`[BACKEND] Credits before: ${member.credits}, Credits after: ${updatedCredits} for member ${creatorId}`);
        } else {
            console.log(`[BACKEND] Admin user ${creatorId} is creating a course. No credits consumed.`);
        }

        // --- MUDANÇA IMPORTANTE AQUI: LÓGICA DE VALIDAÇÃO DE UNICIDADE DO SLUG DO CURSO ---
        // O slug já vem do frontend (gerado pela preview), mas validamos e ajustamos aqui se necessário.
        let initialCourseSlug = courseData.slug.current; // Pega o slug que veio da pré-visualização
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
                // Se o slug da pré-visualização já existe, gera um novo a partir do título original
                // e garante um sufixo para unicidade.
                finalCourseSlug = `${generateSlug(courseData.title)}-retry-${uuidv4().substring(0, 4)}`;
            }
        }

        if (!slugIsUnique) {
            throw new Error('Falha ao gerar um slug único para o curso após múltiplas tentativas. Por favor, tente um tópico diferente para o curso.');
        }

        const courseSlugForSanity = { // Objeto slug no formato Sanity
            _type: 'slug',
            current: finalCourseSlug,
        };
        // --- FIM DA LÓGICA de Validação de Unicidade do SLUG do CURSO ---


        const courseId = `course-${uuidv4()}`; 
        const lessonRefs = [];
        let totalEstimatedDuration = 0; 
        const createdLessonIds = []; 

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
        console.log(`[BACKEND] Transação iniciada. Member ${creatorId} será atualizado.`);

        for (const lesson of courseData.lessons) {
            // O slug da lição já veio da pré-visualização, mas podemos gerar um novo aqui
            // se precisarmos de uma lógica de unicidade para lições (normalmente não é necessário para lições,
            // pois elas são aninhadas sob o curso e seu slug já é localmente único pelo uuidv4 da generateSlug).
            // Manter como está, usando o slug já gerado na preview.
            const lessonSlug = lesson.slug; // Pega o slug que veio da pré-visualização

            const lessonId = `lesson-${uuidv4()}`; 

            const newLesson = {
                _id: lessonId,
                _type: 'lesson',
                title: lesson.title,
                slug: lessonSlug, // Usa o slug gerado na pré-visualização (que já é único)
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
            createdLessonIds.push(lessonId);
            totalEstimatedDuration += (lesson.estimatedReadingTime || 0); 
            console.log(`[BACKEND] Lição "${lesson.title}" adicionada à transação (ID: ${lessonId}).`);
        }

        const courseTagRefs = []; 
        if (tags && tags.length > 0) {
            tags.forEach(tagId => {
                courseTagRefs.push({
                    _ref: tagId,
                    _type: 'reference',
                    _key: uuidv4(), 
                });
            });
        }

        const newCourse = {
            _id: courseId,
            _type: 'course',
            title: courseData.title,
            description: courseData.description,
            slug: courseSlugForSanity, // Usa o slug validado e único aqui!
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
            aiGenerationPrompt: courseData.aiGenerationPrompt || '', 
            aiModelUsed: courseData.aiModelUsed || "gemini-2.0-flash",   
            generatedAt: new Date().toISOString(),
            lastGenerationRevision: new Date().toISOString(),
        };

        transaction.create(newCourse);
        console.log(`[BACKEND] Curso "${newCourse.title}" adicionado à transação (ID: ${courseId}).`);

        console.log("[BACKEND] Transação preparada para criar curso, lições e ATUALIZAR membro.");

        const transactionResult = await transaction.commit(); 
        
        console.log(`[BACKEND] Transação concluída. Documentos criados e atualizados:`, transactionResult);

        const memberUpdateInfo = transactionResult.results.find(
            r => r.id === creatorId && r.operation === 'update'
        );

        res.status(201).json({
            message: 'Curso, lições geradas e salvos com sucesso! Créditos e cursos do membro atualizados.',
            course: newCourse, 
            lessons: courseData.lessons,
            memberUpdateId: memberUpdateInfo ? memberUpdateInfo.id : null, 
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de salvamento do curso:", error);
        
        if (error.message === 'Insufficient credits to create a course.') {
            return res.status(403).json({ error: error.message }); 
        }
        if (error.message.includes('Member with ID') && error.message.includes('not found')) {
            return res.status(404).json({ error: error.message }); 
        }
        if (error.message.includes('Falha ao gerar um slug único')) {
            return res.status(500).json({ error: error.message }); 
        }
        if (error.statusCode) { 
            console.error("[BACKEND] Erro do Sanity:", error.message);
            return res.status(500).json({ error: `Erro do Sanity CMS: ${error.message}`, details: error });
        }
        res.status(500).json({ error: 'Falha interna ao salvar o curso.', details: error.message });
    }
};