import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Configuração da Gemini API ---
// Garante que a chave da API está presente
if (!process.env.GEMINI_API_KEY) {
    console.error("Erro: Variável de ambiente GEMINI_API_KEY não definida.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Configuração do Sanity Client para o Backend ---
// Garante que as credenciais do Sanity estão presentes
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas.");
    process.exit(1);
}
const sanityClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-06-25', // Usando a data de hoje, uma versão estável mais recente
    useCdn: false,
    token: process.env.SANITY_TOKEN, // Usará o token de escrita do .env
});

// --- Rotas da API ---
app.get('/', (req, res) => {
    res.send('Servidor do backend "Meus Cursos" está rodando! 🙌');
});

// Helper para converter string de texto para Portable Text básico (apenas blocos de parágrafo)
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

app.post('/api/courses/generate', async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'Um tópico é necessário para gerar o curso.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

        const prompt = `Gere um esquema de curso detalhado em português sobre "${topic}".
        O esquema deve conter:
        - Um campo 'title' (string): Título do curso.
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

        console.log(`Gerando curso para o tópico: "${topic}"...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse.response.candidates[0].content.parts[0].text;

        let generatedCourseData;
        try {
            let cleanText = text.replace(/```json\n|```json|```/g, '').trim();
            // Nova linha de correção para caracteres de controle
            cleanText = cleanText.replace(/[\u0000-\u001F\u007F-\u009F\u00A0]/g, '').replace(/(\r\n|\n|\r)/gm, '\\n');
            
            generatedCourseData = JSON.parse(cleanText);
        } catch (parseError) {
            console.error("Erro ao parsear JSON da Gemini API:", parseError);
            console.error("Texto bruto recebido da Gemini:", text);
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA. Formato JSON inválido.', rawText: text });
        }

        // ATENÇÃO: Este ID PRECISA ser o _id de um documento 'member' existente no seu Sanity Studio.
        const dummyCreatorId = '43893a06-75ab-4313-a81b-9947524fdbeb'; 

        const courseId = `course-${uuidv4()}`;

        const transaction = sanityClient.transaction();

        const lessonRefs = [];
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
                    _weak: true,
                },
            };

            transaction.create(newLesson);
            lessonRefs.push({
                _key: uuidv4(),
                _ref: lessonId,
                _type: 'reference'
            });
            console.log(`Lição "${lesson.title}" adicionada à transação.`);
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
            level: 'beginner',
            estimatedDuration: `${generatedCourseData.lessons.length * 10} minutos`,
            creator: {
                _ref: dummyCreatorId,
                _type: 'reference',
                _weak: true,
            },
            // Se 'category' e 'subCategory' são obrigatórios no seu schema do Sanity,
            // você precisará adicionar IDs válidos aqui. Exemplo:
            // category: { _ref: 'seu_id_da_categoria', _type: 'reference' },
            // subCategory: { _ref: 'seu_id_da_subcategoria', _type: 'reference' },
            aiGenerationPrompt: prompt,
            aiModelUsed: model.model,
            generatedAt: new Date().toISOString(),
            lastGenerationRevision: new Date().toISOString(),
        };

        transaction.create(newCourse);
        console.log(`Curso "${newCourse.title}" adicionado à transação.`);

        const sanityResult = await transaction.commit();
        console.log(`Transação concluída.`); // Log simplificado aqui

        if (Array.isArray(sanityResult)) { // <-- VERIFICAÇÃO ADICIONADA AQUI
            console.log(`IDs dos documentos criados:`, sanityResult.map(doc => doc._id));
            res.status(201).json({
                message: 'Curso e lições gerados e salvos com sucesso!',
                course: sanityResult[0],
                lessons: generatedCourseData.lessons
            });
        } else {
            console.warn("A transação com o Sanity não retornou um array de resultados. Verifique o log do backend para mais detalhes.");
            res.status(201).json({
                message: 'Curso e lições gerados e salvos com sucesso! (Verifique o log do backend para detalhes)',
                course: null,
                lessons: generatedCourseData.lessons
            });
        }

    } catch (error) {
        console.error("Erro no processo de geração/salvamento do curso:", error);
        // Erros da API Gemini
        if (error.response && error.response.data && error.response.data.error) {
            console.error("Erro da Gemini API:", error.response.data.error);
            return res.status(500).json({ error: `Erro da Gemini API: ${error.response.data.error.message}`, details: error.response.data });
        }
        // Erros do Sanity
        if (error.statusCode) {
            console.error("Erro do Sanity:", error.message);
            return res.status(500).json({ error: `Erro do Sanity CMS: ${error.message}`, details: error });
        }
        // Outros erros
        res.status(500).json({ error: 'Falha interna ao gerar ou salvar o curso.', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor do backend rodando em http://localhost:${PORT}`);
    console.log('Aguardando requisições do frontend...');
    console.log('Endpoints disponíveis:');
    console.log(`    GET /`);
    console.log(`    POST /api/courses/generate`);
});