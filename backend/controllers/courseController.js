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
    
    // NOTA: Para garantir a unicidade no backend, você pode querer adicionar uma verificação
    // no Sanity se o slug já existe, especialmente para o slug do curso principal.
    // Por enquanto, o uuidv4() ajuda a garantir a unicidade.
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
        // NOTA: Não precisamos de courseTagRefs aqui, pois não estamos salvando o curso ainda.
        // O frontend enviará os IDs das tags novamente na requisição de salvar.
        
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
        - Um campo 'slug' (string): Um slug único e formatado para URL, derivado do título. Ex: "introducao-a-inteligencia-artificial-para-iniciantes-inovador" ou "desvendando-a-programacao-python-com-projetos-praticos-essenciais". **É CRÍTICO que este slug seja único.**
        - Um campo 'lessons' (array de objetos): Uma lista de **5 a 7 lições essenciais e bem estruturadas**. Cada lição deve ter:
            - 'title' (string): **Um título único e cativante** para a lição, que seja relevante para o curso e não repetitivo em relação a outras lições.
            - 'slug' (string): Slug único da lição. **É CRÍTICO que este slug seja único e derivado do título da lição.**
            - 'order' (number): A ordem da lição no curso, começando de 1.
            - 'content' (string): Conteúdo detalhado da lição (3-5 parágrafos de texto corrido, sem formatação Markdown complexa ou HTML). Foque em clareza, profundidade adequada ao nível especificado e exemplos práticos quando aplicável.
            - 'estimatedReadingTime' (number): Tempo estimado de leitura em minutos para esta lição (entre 3 e 15).
        A resposta deve ser APENAS um objeto JSON válido, sem nenhum texto introdutório ou explicativo, e sem aspas triplas ('''json) ou outros caracteres extras.
        Exemplo de formato JSON para o curso e lições:
        {
            "title": "Titulo do Curso Único e Criativo",
            "description": "Uma descrição breve e engajante que destaca a singularidade.",
            "slug": "titulo-do-curso-unico-e-criativo-com-sufixo",
            "lessons": [
                {
                    "title": "Titulo da Licao 1 Única",
                    "slug": "titulo-da-licao-1-unica",
                    "order": 1,
                    "content": "Conteúdo do parágrafo 1.\\n\\nConteúdo do parágrafo 2.",
                    "estimatedReadingTime": 7
                },
                {
                    "title": "Titulo da Licao 2 Diferente",
                    "slug": "titulo-da-licao-2-diferente",
                    "order": 2,
                    "content": "Mais conteúdo aqui.\\n\\nOutro parágrafo.",
                    "estimatedReadingTime": 10
                }
            ]
        }
        `;

        console.log(`[BACKEND] Gerando pré-visualização para o tópico: "${topic}", categoria: "${category}", subcategoria: "${subCategory}", nível: "${level}"...`);
        const geminiResponse = await model.generateContent(prompt);
        // Acessar o texto de forma mais segura, verificando se os objetos existem.
        const text = geminiResponse?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("[BACKEND] Resposta vazia ou inesperada da Gemini API.");
            return res.status(500).json({ error: 'A IA retornou uma resposta vazia ou em formato inesperado.' });
        }

        let generatedCourseData;
        try {
            // Remove as aspas triplas de Markdown e qualquer texto antes/depois do JSON
            // Ajustado para capturar o JSON completo
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            let rawJsonString = jsonMatch ? jsonMatch[1] : text.trim();

            // Uma segunda tentativa de limpeza caso a primeira não ache o bloco ```json```
            // Isso lida com casos onde a IA pode não colocar aspas triplas ou texto extra.
            // Remove quebras de linha/retornos de carro no início e fim para garantir JSON válido.
            rawJsonString = rawJsonString.replace(/^[\r\n]+|[\r\n]+$/g, '');

            // Normaliza aspas duplas, se houver problemas de codificação
            rawJsonString = rawJsonString.replace(/”/g, '"').replace(/“/g, '"');

            // Remove a linha que substitui \r\n por \\n, pois o Gemini já deve formatar corretamente
            // e essa linha pode causar duplicação de escapes se a string já contiver quebras de linha escapadas.
            // REMOVIDO: cleanText = cleanText.replace(/(\r\n|\r)/gm, '\\n');

            generatedCourseData = JSON.parse(rawJsonString);

        } catch (parseError) {
            console.error("[BACKEND] Erro ao parsear JSON da Gemini API:", parseError);
            console.error("[BACKEND] Texto bruto recebido da Gemini (primeiros 500 chars):", text.substring(0, 500) + (text.length > 500 ? '...' : ''));
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA. Formato JSON inválido.', rawText: text });
        }

        // Adicione os IDs de categoria, subcategoria, nível e tags ao objeto retornado para o frontend
        // O frontend precisará desses para enviar na requisição de salvamento
        const responseData = {
            ...generatedCourseData,
            category: category,
            subCategory: subCategory,
            level: level,
            tags: tags, // Enviar os IDs das tags de volta
        };

        res.status(200).json({
            message: 'Pré-visualização do curso gerada com sucesso!',
            coursePreview: responseData, // Renomeado para clareza
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de geração da pré-visualização do curso:", error);
        
        if (error.response && error.response.data) {
            if (error.response.status === 429) { // Too Many Requests
                console.error("[BACKEND] Gemini API Rate Limit Excedido:", error.response.data.error);
                return res.status(429).json({ error: "Limite de requisições da IA excedido. Por favor, tente novamente em breve.", details: error.response.data.error.message });
            }
            console.error("[BACKEND] Erro da Gemini API:", error.response.data.error);
            return res.status(500).json({ error: `Erro da Gemini API: ${error.response.data.error.message}`, details: error.response.data });
        }
        // Erro genérico
        res.status(500).json({ error: 'Falha interna ao gerar a pré-visualização do curso.', details: error.message });
    }
};

// --- NOVA FUNÇÃO: saveGeneratedCourse ---
export const saveGeneratedCourse = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Cliente Sanity não inicializado.' });
    }

    // Recebe o objeto completo do curso gerado, ID do usuário e os IDs originais
    const { courseData, category, subCategory, level, tags } = req.body; 
    const creatorId = req.user?.id; // Usar o ID do usuário autenticado

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

        // --- INÍCIO DA LÓGICA DE VALIDAÇÃO DE UNICIDADE DO SLUG DO CURSO ---
        let courseBaseSlug = generateSlug(courseData.title);
        let finalCourseSlug = courseBaseSlug;
        let slugAlreadyExists = true;
        let attempt = 0;
        const MAX_SLUG_ATTEMPTS = 5; // Limite para evitar loops infinitos em casos extremos

        while (slugAlreadyExists && attempt < MAX_SLUG_ATTEMPTS) {
            const existingCourse = await sanityClient.fetch(
                `*[_type == "course" && slug.current == $slug][0]{_id}`,
                { slug: finalCourseSlug }
            );

            if (existingCourse) {
                attempt++;
                console.warn(`[BACKEND] Slug "${finalCourseSlug}" já existe. Tentando gerar um novo (tentativa ${attempt}).`);
                // Adiciona um novo sufixo baseado em UUID e um contador para tentar a unicidade
                finalCourseSlug = `${courseBaseSlug}-${uuidv4().substring(0, 4)}-${attempt}`; 
            } else {
                slugAlreadyExists = false; // Encontrou um slug único!
            }
        }

        if (slugAlreadyExists) {
            // Se chegou aqui, não conseguiu um slug único após várias tentativas
            throw new Error('Falha ao gerar um slug único para o curso após múltiplas tentativas. Por favor, tente um tópico diferente.');
        }

        const courseSlug = { current: finalCourseSlug }; // Use o slug validado
        // --- FIM DA LÓGICA DE VALIDAÇÃO DE UNICIDADE DO SLUG DO CURSO ---


        const courseId = `course-${uuidv4()}`; // Gera o ID real do curso aqui
        const lessonRefs = [];
        let totalEstimatedDuration = 0; 
        const createdLessonIds = []; 

        transaction = sanityClient.transaction(); // Inicia a transação aqui

        // Agora, o patch para o membro é adicionado UMA ÚNICA VEZ e usa o courseId real
        transaction.patch(creatorId, (patch) => {
            return patch
                .set({ credits: updatedCredits }) 
                .setIfMissing({ createdCourses: [] }) 
                .append('createdCourses', [{ 
                    _ref: courseId, // Usa o ID real do curso gerado logo acima
                    _type: 'reference',
                    _key: uuidv4(), 
                }]);
        });
        console.log(`[BACKEND] Transação iniciada. Member ${creatorId} será atualizado.`);


        for (const lesson of courseData.lessons) {
            // Para as lições, mantemos a geração de slug com UUID para alta probabilidade de unicidade.
            const lessonSlug = { current: generateSlug(lesson.title) }; 
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
            createdLessonIds.push(lessonId);
            totalEstimatedDuration += (lesson.estimatedReadingTime || 0); 
            console.log(`[BACKEND] Lição "${lesson.title}" adicionada à transação (ID: ${lessonId}).`);
        }

        // Lógica para buscar detalhes das tags selecionadas para referências
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
            slug: courseSlug, // Usa o slug validado e único aqui!
            lessons: lessonRefs,
            status: 'published', 
            price: 0, 
            isProContent: false, 
            level: level, // Usar o level original do request body
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
            return res.status(500).json({ error: error.message }); // Retorna erro específico para o slug
        }
        // Tratamento de erro para Sanity CMS
        if (error.statusCode) { 
            console.error("[BACKEND] Erro do Sanity:", error.message);
            return res.status(500).json({ error: `Erro do Sanity CMS: ${error.message}`, details: error });
        }
        // Erro genérico
        res.status(500).json({ error: 'Falha interna ao salvar o curso.', details: error.message });
    }
};