// D:\meuscursos\backend\controllers\courseController.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';

// --- Configuração da Gemini API ---
if (!process.env.GEMINI_API_KEY) {
    console.error("Erro: Variável de ambiente GEMINI_API_KEY não definida em courseController.");
    // Em um ambiente de produção, você pode querer lançar um erro fatal ou parar o processo aqui.
}
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;


// --- Configuração do Sanity Client ---
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em courseController.");
    // Em um ambiente de produção, você pode querer lançar um erro fatal ou parar o processo aqui.
}
const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12', // RECOMENDADO: Mantenha a API version atualizada.
    useCdn: false, // Define para false para garantir que você está interagindo com a API de escrita
    token: process.env.SANITY_TOKEN, // Token com permissões de escrita
}) : null;


// --- Função auxiliar para gerar slug amigável para URLs e único ---
const generateSlug = (text) => {
  // Normaliza o texto para remover acentos e caracteres diacríticos
  const normalizedText = text
    .normalize("NFD") // Decompõe caracteres acentuados (ex: 'é' -> 'e', '´')
    .replace(/[\u0300-\u036f]/g, ""); // Remove os diacríticos resultantes

  // Converte para minúsculas, remove caracteres especiais e formata hífens
  const baseSlug = normalizedText
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove tudo que não é letra (a-z), número (0-9), espaço ou hífen
    .replace(/\s+/g, '-')        // Substitui múltiplos espaços por um único hífen
    .replace(/-+/g, '-');        // Substitui múltiplos hífens por um único hífen
  
  // Adiciona um sufixo UUID curto para garantir unicidade
  return `${baseSlug}-${uuidv4().substring(0, 8)}`; 
};

// Helper para converter string de texto para Portable Text básico
const convertToPortableText = (text) => {
    if (!text) return [];
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');

    return paragraphs.map(p => ({
        _key: uuidv4(), // Garante uma chave única para cada bloco
        _type: 'block',
        children: [
            {
                _key: uuidv4(), // Garante uma chave única para cada span
                _type: 'span',
                marks: [],
                text: p.trim(),
            },
        ],
        markDefs: [],
        style: 'normal',
    }));
};

export const generateCourse = async (req, res) => {
    // Verificar se as configurações estão OK antes de prosseguir com qualquer lógica.
    if (!genAI || !sanityClient) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Chaves de API ou Cliente Sanity não inicializados.' });
    }

    const { topic, category, subCategory, level, userId } = req.body; 
    const creatorId = userId || req.user?.id; // Preferir `req.user.id` injetado pelo middleware de autenticação

    if (!topic || !category || !subCategory || !level || !creatorId) {
        return res.status(400).json({ error: 'Dados incompletos: Tópico, Categoria, Subcategoria, Nível e ID do criador são necessários.' });
    }

    let transaction; // Declarada fora do `try` para acessibilidade no `catch`.

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

        // --- PROMPT APERFEIÇOADO PARA MAIOR UNICIDADE E CRIATIVIDADE ---
        const prompt = `Gere um esquema de curso detalhado em português, garantindo que o **título do curso e os títulos das lições sejam altamente originais e únicos**, mesmo quando os parâmetros iniciais são semelhantes.

        O curso deve ser sobre "${topic}", na categoria de ID "${category}" e subcategoria de ID "${subCategory}", e ter um nível de dificuldade "${level}".
        
        Considere uma perspectiva ou abordagem ligeiramente diferente para este curso, tornando-o distintivo e não apenas uma repetição de cursos com temas próximos.

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
        // --- FIM DO PROMPT APERFEIÇOADO ---


        console.log(`[BACKEND] Gerando curso para o tópico: "${topic}", categoria: "${category}", subcategoria: "${subCategory}", nível: "${level}" para o usuário ${creatorId}...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse.response.candidates[0].content.parts[0].text;

        let generatedCourseData;
        try {
            // Remove marcadores de código JSON e espaços em branco extras
            let cleanText = text.replace(/```json\n|```json|```/g, '').trim();
            // Substitui quebras de linha literais por '\n' para garantir JSON válido.
            // A linha que removia '[\u0000-\u001F\u007F-\u009F\u00A0]' foi removida para evitar problemas
            // com caracteres válidos que a IA possa gerar e que não são marcadores de código.
            cleanText = cleanText.replace(/(\r\n|\r)/gm, '\\n'); // Apenas substitui \r\n ou \r por \n

            generatedCourseData = JSON.parse(cleanText);
        } catch (parseError) {
            console.error("[BACKEND] Erro ao parsear JSON da Gemini API:", parseError);
            console.error("[BACKEND] Texto bruto recebido da Gemini (primeiros 500 chars):", text.substring(0, 500) + (text.length > 500 ? '...' : ''));
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA. Formato JSON inválido.', rawText: text });
        }

        const courseId = `course-${uuidv4()}`; 
        transaction = sanityClient.transaction(); // Inicia a transação Sanity.

        // 1. Obter informações do membro criador para verificar créditos e admin status.
        const member = await sanityClient.fetch(
            `*[_id == $creatorId][0]{isAdmin, credits}`,
            { creatorId }
        );

        if (!member) {
            throw new Error(`Member with ID ${creatorId} not found.`);
        }

        let updatedCredits = member.credits;
        const isMemberAdmin = member.isAdmin === true; // Garante que seja booleano.

        // 2. Lógica de Consumo de Créditos.
        if (!isMemberAdmin) {
            if (member.credits <= 0) {
                throw new Error('Insufficient credits to create a course.');
            }
            updatedCredits = member.credits - 1; // Decrementa 1 crédito.
            console.log(`[BACKEND] Credits before: ${member.credits}, Credits after: ${updatedCredits} for member ${creatorId}`);
        } else {
            console.log(`[BACKEND] Admin user ${creatorId} is creating a course. No credits consumed.`);
        }

        // 3. Adicionar operação de atualização de créditos do membro e adicionar o novo curso à lista `createdCourses`.
        transaction.patch(creatorId, (patch) =>
            patch
                .set({ credits: updatedCredits }) // Atualiza o valor do campo 'credits'.
                .insert('after', 'createdCourses[-1]', [{ // Adiciona a nova referência ao final do array.
                    _ref: courseId, // Referência ao curso que será criado nesta mesma transação.
                    _type: 'reference',
                    _key: uuidv4(), // Chave única para o item do array.
                }])
        );

        const lessonRefs = [];
        const createdLessonIds = []; 
        let totalEstimatedDuration = 0; // Para calcular a duração total do curso.

        // 4. Criar os documentos das lições e adicionar à transação.
        for (const lesson of generatedCourseData.lessons) {
            // Garante que o slug da lição seja único
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
                status: 'published', // Status inicial das lições.
                course: {
                    _ref: courseId, // Referencia o curso pai que está sendo criado.
                    _type: 'reference',
                },
            };

            transaction.create(newLesson);
            lessonRefs.push({
                _key: uuidv4(), // Chave única para a referência no array `lessons` do curso.
                _ref: lessonId,
                _type: 'reference',
            });
            createdLessonIds.push(lessonId);
            totalEstimatedDuration += (lesson.estimatedReadingTime || 0); // Soma a duração das lições.
            console.log(`[BACKEND] Lição "${lesson.title}" adicionada à transação (ID: ${lessonId}).`);
        }

        // 5. Criar o documento do curso e adicionar à transação.
        // Garante que o slug do curso seja único
        const courseSlug = { current: generateSlug(generatedCourseData.title) };

        const newCourse = {
            _id: courseId,
            _type: 'course',
            title: generatedCourseData.title,
            description: generatedCourseData.description,
            slug: courseSlug, // Usa o slug gerado com a função generateSlug
            lessons: lessonRefs,
            status: 'published', // Status inicial do curso.
            price: 0, // Preço padrão para cursos gerados por IA.
            isProContent: false, // Define se é conteúdo Pro.
            level: level,
            estimatedDuration: totalEstimatedDuration, // Duração total calculada.
            creator: {
                _ref: creatorId, 
                _type: 'reference',
            },
            category: { _ref: category, _type: 'reference' }, 
            subCategory: { _ref: subCategory, _type: 'reference' }, 
            aiGenerationPrompt: prompt, // Salva o prompt usado para gerar o curso.
            aiModelUsed: model.model,   // Salva o modelo de IA usado.
            generatedAt: new Date().toISOString(),
            lastGenerationRevision: new Date().toISOString(),
        };

        transaction.create(newCourse);
        console.log(`[BACKEND] Curso "${newCourse.title}" adicionado à transação (ID: ${courseId}).`);

        // 6. Comitar a transação: todas as operações são executadas atomicamente.
        const transactionResult = await transaction.commit(); 
        
        console.log(`[BACKEND] Transação concluída. Documentos criados e atualizados:`, transactionResult);

        // 7. Preparar a resposta para o frontend.
        // Encontra o resultado da atualização do membro para incluir na resposta (opcional).
        const memberUpdateInfo = transactionResult.results.find(
            r => r.id === creatorId && r.operation === 'update'
        );

        res.status(201).json({
            message: 'Curso, lições geradas e salvos com sucesso! Créditos e cursos do membro atualizados.',
            course: newCourse, 
            lessons: generatedCourseData.lessons,
            memberUpdateId: memberUpdateInfo ? memberUpdateInfo.id : null, 
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de geração/salvamento do curso:", error);
        
        if (error.message === 'Insufficient credits to create a course.') {
            return res.status(403).json({ error: error.message }); 
        }
        if (error.message.includes('Member with ID') && error.message.includes('not found')) {
            return res.status(404).json({ error: error.message }); 
        }
        if (error.response && error.response.data && error.response.data.error) {
            console.error("[BACKEND] Erro da Gemini API:", error.response.data.error);
            return res.status(500).json({ error: `Erro da Gemini API: ${error.response.data.error.message}`, details: error.response.data });
        }
        if (error.statusCode) { 
            console.error("[BACKEND] Erro do Sanity:", error.message);
            return res.status(500).json({ error: `Erro do Sanity CMS: ${error.message}`, details: error });
        }
        res.status(500).json({ error: 'Falha interna ao gerar ou salvar o curso.', details: error.message });
    }
};