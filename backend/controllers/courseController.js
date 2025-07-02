// D:\meuscursos\backend\controllers\courseController.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@sanity/client'; // Importar createClient aqui também
import { v4 as uuidv4 } from 'uuid';

// Replicar a configuração do Sanity Client e Gemini aqui ou passar como argumento
// Idealmente, você configuraria o Sanity Client globalmente uma vez e o importaria.
// Para simplicidade e para não quebrar seu código, vamos redefinir aqui por enquanto,
// mas em um projeto maior, um arquivo de config.js para Sanity e Gemini seria melhor.

// --- Configuração da Gemini API (repetida para este exemplo, idealmente importada) ---
if (!process.env.GEMINI_API_KEY) {
    console.error("Erro: Variável de ambiente GEMINI_API_KEY não definida em courseController.");
    // Considere um tratamento de erro mais robusto para produção
    // throw new Error("GEMINI_API_KEY não definida.");
}
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;


// --- Configuração do Sanity Client (repetida para este exemplo, idealmente importada) ---
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em courseController.");
    // Considere um tratamento de erro mais robusto para produção
    // throw new Error("SANITY_PROJECT_ID ou SANITY_TOKEN não definidas.");
}
const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-06-25',
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

    const { topic, category, subCategory, level } = req.body;

    if (!topic || !category || !subCategory || !level) {
        return res.status(400).json({ error: 'Todos os campos (tópico, categoria, subcategoria, nível) são necessários para gerar o curso.' });
    }

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

        console.log(`Gerando curso para o tópico: "${topic}", categoria: "${category}", subcategoria: "${subCategory}", nível: "${level}" para o usuário ${req.user.id}...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse.response.candidates[0].content.parts[0].text;

        let generatedCourseData;
        try {
            let cleanText = text.replace(/```json\n|```json|```/g, '').trim();
            cleanText = cleanText.replace(/[\u0000-\u001F\u007F-\u009F\u00A0]/g, '').replace(/(\r\n|\n|\r)/gm, '\\n');
            
            generatedCourseData = JSON.parse(cleanText);
        } catch (parseError) {
            console.error("Erro ao parsear JSON da Gemini API:", parseError);
            console.error("Texto bruto recebido da Gemini:", text);
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA. Formato JSON inválido.', rawText: text });
        }

        const creatorId = req.user.id; 
        const courseId = `course-${uuidv4()}`; 
        const transaction = sanityClient.transaction(); 

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
            estimatedDuration: `${generatedCourseData.lessons.length * 10} minutos`,
            creator: {
                _ref: creatorId, 
                _type: 'reference',
                _weak: true, 
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

        await transaction.commit(); 
        
        console.log(`Transação concluída. IDs de documentos criados: Curso: ${courseId}, Lições: ${createdLessonIds.join(', ')}`);

        res.status(201).json({
            message: 'Curso e lições gerados e salvos com sucesso!',
            course: newCourse, 
            lessons: generatedCourseData.lessons 
        });

    } catch (error) {
        console.error("Erro no processo de geração/salvamento do curso:", error);
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