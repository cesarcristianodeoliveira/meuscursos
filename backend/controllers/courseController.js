// D:\meuscursos\backend\controllers\courseController.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';

// --- Configuração da Gemini API ---
if (!process.env.GEMINI_API_KEY) {
    console.error("Erro: Variável de ambiente GEMINI_API_KEY não definida em courseController.");
    // Em produção, você pode querer lançar um erro ou parar a execução
}
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;


// --- Configuração do Sanity Client ---
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em courseController.");
    // Em produção, você pode querer lançar um erro ou parar a execução
}
const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12', // RECOMENDADO: Use a data atual para garantir compatibilidade com patches.
    useCdn: false,
    token: process.env.SANITY_TOKEN,
}) : null;


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

export const generateCourse = async (req, res) => {
    // Verificar se as configurações estão OK antes de prosseguir
    if (!genAI || !sanityClient) {
        return res.status(500).json({ error: 'Erro de configuração do servidor para geração de cursos.' });
    }

    // NOVO: req.user.id deve vir do seu middleware de autenticação
    const { topic, category, subCategory, level, userId } = req.body; // Supondo que userId também possa vir do corpo da requisição ou req.user.id

    // MODIFICADO: Use userId do corpo da requisição ou do objeto req.user (se for injetado por um middleware de auth)
    const creatorId = userId || req.user?.id; // Usar 'req.user?.id' com optional chaining é mais seguro

    if (!topic || !category || !subCategory || !level || !creatorId) {
        return res.status(400).json({ error: 'Todos os campos (tópico, categoria, subcategoria, nível, userId) são necessários para gerar o curso.' });
    }

    let transaction; // Declare transaction fora do try para que possa ser acessado no catch

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

        const prompt = `Gere um esquema de curso detalhado em português.
        O curso deve ser sobre "${topic}", na categoria de ID "${category}" e subcategoria de ID "${subCategory}", e ter um nível de dificuldade "${level}".
        
        O esquema deve conter:
        - Um campo 'title' (string): Título do curso. O título deve ser criativo, conciso e refletir claramente o conteúdo gerado com base no tópico, categoria, subcategoria e nível.
        - Um campo 'description' (string): Uma breve descrição do curso (1-2 frases).
        - Um campo 'slug' (string): Um slug único e formatado para URL (ex: "introducao-a-ia").
        - Um campo 'lessons' (array de objetos): Uma lista de 5 a 7 lições. Cada lição deve ter:
            - 'title' (string): Título da lição.
            - 'slug' (string): Slug único da lição.
            - 'order' (number): A ordem da lição no curso, começando de 1.
            - 'content' (string): Conteúdo detalhado da lição (3-5 parágrafos de texto corrido, sem formatação Markdown complexa ou HTML).
            - 'estimatedReadingTime' (number): Tempo estimado de leitura em minutos para esta lição (entre 3 e 15).
        A resposta deve ser APENAS um objeto JSON válido, sem nenhum texto introdutório ou explicativo, e sem aspas triplas ('''json) ou outros caracteres extras.
        Exemplo de formato JSON para as lições:
        "lessons": [
            {
                "title": "Titulo da Licao 1",
                "slug": "titulo-da-licao-1",
                "order": 1,
                "content": "Conteúdo do parágrafo 1.\\n\\nConteúdo do parágrafo 2.",
                "estimatedReadingTime": 7
            }
        ]`;

        console.log(`Gerando curso para o tópico: "${topic}", categoria: "${category}", subcategoria: "${subCategory}", nível: "${level}" para o usuário ${creatorId}...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse.response.candidates[0].content.parts[0].text;

        let generatedCourseData;
        try {
            let cleanText = text.replace(/```json\n|```json|```/g, '').trim();
            // Esta linha abaixo pode ser problemática se a IA inserir caracteres especiais que não são UTF-8 válidos
            // ou se estiver removendo coisas que não deveria.
            // Para JSON, '\\n' é a representação correta de quebra de linha.
            // Se a IA não estiver gerando \\n, você pode precisar ajustar o prompt ou a sanitização.
            // Por enquanto, vamos manter, mas fique atento.
            cleanText = cleanText.replace(/[\u0000-\u001F\u007F-\u009F\u00A0]/g, '').replace(/(\r\n|\n|\r)/gm, '\\n');
            
            generatedCourseData = JSON.parse(cleanText);
        } catch (parseError) {
            console.error("Erro ao parsear JSON da Gemini API:", parseError);
            console.error("Texto bruto recebido da Gemini:", text);
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA. Formato JSON inválido.', rawText: text });
        }

        const courseId = `course-${uuidv4()}`; 
        transaction = sanityClient.transaction(); // Inicia a transação aqui

        // NOVO: 1. Obter informações do membro antes de criar o curso
        const member = await sanityClient.fetch(
            `*[_id == $creatorId][0]{isAdmin, credits}`,
            { creatorId }
        );

        if (!member) {
            throw new Error(`Member with ID ${creatorId} not found.`);
        }

        let updatedCredits = member.credits;
        const isMemberAdmin = member.isAdmin === true; // Garante que é booleano

        // NOVO: 2. Lógica de Consumo de Créditos
        if (!isMemberAdmin) {
            if (member.credits <= 0) {
                throw new Error('Insufficient credits to create a course.');
            }
            updatedCredits = member.credits - 1; // Decrementa 1 crédito
            console.log(`Credits before: ${member.credits}, Credits after: ${updatedCredits} for member ${creatorId}`);
        } else {
            console.log(`Admin user ${creatorId} is creating a course. No credits consumed.`);
        }

        // NOVO: 3. Adicionar operação de atualização de créditos do membro na transação
        // E também adicionar a referência do curso ao array createdCourses do membro.
        transaction.patch(creatorId, (patch) =>
            patch
                .set({ credits: updatedCredits }) // Atualiza o valor do campo 'credits'
                .insert('after', 'createdCourses[-1]', [{ // Adiciona a nova referência ao final do array
                    _ref: courseId, // Usa o ID do curso que será criado
                    _type: 'reference',
                    _key: uuidv4(), // Usa um novo uuid para a _key do item no array
                }])
        );

        const lessonRefs = [];
        const createdLessonIds = []; 
        for (const lesson of generatedCourseData.lessons) {
            const lessonSlug = { current: lesson.slug || `${generatedCourseData.slug}-${lesson.order}` };
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
                    _ref: courseId, // Referencia o curso pai
                    _type: 'reference',
                },
            };

            transaction.create(newLesson);
            lessonRefs.push({
                _key: uuidv4(), // Use uuidv4 para o _key da referência no array do curso
                _ref: lessonId,
                _type: 'reference',
            });
            createdLessonIds.push(lessonId);
            console.log(`Lição "${lesson.title}" adicionada à transação (ID: ${lessonId}).`);
        }

        const newCourse = {
            _id: courseId,
            _type: 'course',
            title: generatedCourseData.title,
            description: generatedCourseData.description,
            slug: { current: generatedCourseData.slug },
            lessons: lessonRefs,
            status: 'published',
            price: 0,
            isProContent: false,
            level: level,
            // MODIFICADO: Mantenha estimatedDuration como um número (total de minutos) para facilitar cálculos
            // É melhor calcular a soma total das estimatedReadingTime das lições
            estimatedDuration: generatedCourseData.lessons.reduce((sum, l) => sum + (l.estimatedReadingTime || 0), 0), 
            creator: {
                _ref: creatorId, 
                _type: 'reference',
            },
            category: { _ref: category, _type: 'reference' }, 
            subCategory: { _ref: subCategory, _type: 'reference' }, 
            aiGenerationPrompt: prompt, 
            aiModelUsed: model.model,   
            generatedAt: new Date().toISOString(),
            lastGenerationRevision: new Date().toISOString(),
        };

        transaction.create(newCourse);
        console.log(`Curso "${newCourse.title}" adicionado à transação (ID: ${courseId}).`);

        // NOVO: Executa todas as operações em uma única transação atômica
        const transactionResult = await transaction.commit(); 
        
        console.log(`Transação concluída. Documentos criados e atualizados:`, transactionResult);

        res.status(201).json({
            message: 'Curso, lições geradas e salvos com sucesso! Créditos e cursos do membro atualizados.',
            course: newCourse, 
            lessons: generatedCourseData.lessons,
            memberUpdate: transactionResult.results.find(r => r.document._id === creatorId), // Opcional: retornar o membro atualizado
        });

    } catch (error) {
        console.error("Erro no processo de geração/salvamento do curso:", error);
        // NOVO: Se a transação foi iniciada e falhou, Sanity tentará um rollback automático.
        // Não é necessário chamar transaction.abort() explicitamente a menos que haja um cenário muito específico.

        if (error.message === 'Insufficient credits to create a course.') {
            return res.status(403).json({ error: error.message }); // 403 Forbidden para falta de créditos
        }
        if (error.message.includes('Member not found')) {
            return res.status(404).json({ error: error.message }); // 404 Not Found para membro
        }
        if (error.response && error.response.data && error.response.data.error) {
            console.error("Erro da Gemini API:", error.response.data.error);
            return res.status(500).json({ error: `Erro da Gemini API: ${error.response.data.error.message}`, details: error.response.data });
        }
        if (error.statusCode) { 
            console.error("Erro do Sanity:", error.message);
            return res.status(500).json({ error: `Erro do Sanity CMS: ${error.message}`, details: error });
        }
        res.status(500).json({ error: 'Falha interna ao gerar ou salvar o curso.', details: error.message });
    }
};