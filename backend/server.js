import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken'; // Importar jsonwebtoken para o middleware de proteção

// Importa as funções de registro e login do controlador de autenticação
import { register, login } from './controllers/authController.js'; 

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // Habilita CORS para permitir requisições de origens diferentes
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// --- Configuração da Gemini API ---
if (!process.env.GEMINI_API_KEY) {
    console.error("Erro: Variável de ambiente GEMINI_API_KEY não definida.");
    process.exit(1); // Encerra o processo se a chave não estiver configurada
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Configuração do Sanity Client para o Backend ---
// Assegura que as variáveis de ambiente necessárias estão definidas
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas.");
    process.exit(1); // Encerra o processo se as chaves do Sanity não estiverem configuradas
}
const sanityClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production', // 'production' é o padrão se não especificado
    apiVersion: '2024-06-25', // Use a data atual ou a versão da sua API Sanity
    useCdn: false, // Backend deve sempre acessar a API diretamente, não o CDN
    token: process.env.SANITY_TOKEN, // Token com permissões de escrita (criação de documentos)
});

// --- Middleware de Autenticação (JWT Protection) ---
// Esta função será usada em rotas que requerem que o usuário esteja logado
const protect = (req, res, next) => {
    let token;

    // 1. Verifica se o token está presente no cabeçalho 'Authorization'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extrai o token do formato "Bearer TOKEN"
            token = req.headers.authorization.split(' ')[1];

            // 2. Verifica e decodifica o token usando a chave secreta
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Anexa as informações do usuário (id, isAdmin, plan) à requisição
            // Isso permite que as rotas protegidas saibam quem fez a requisição
            // Não buscamos o usuário do Sanity aqui por performance; as infos do token são suficientes.
            req.user = { 
                id: decoded.id, 
                isAdmin: decoded.isAdmin, 
                plan: decoded.plan 
            }; 
            next(); // Prossegue para a próxima função middleware ou para a rota final

        } catch (error) {
            console.error('Erro na autenticação do token:', error);
            // Retorna 401 se o token for inválido ou expirado
            return res.status(401).json({ message: 'Não autorizado, token inválido ou expirado.' });
        }
    }

    // Retorna 401 se nenhum token for fornecido
    if (!token) {
        return res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
    }
};

// --- Helper para converter string de texto para Portable Text básico ---
// Usado para o campo 'content' das lições no Sanity
const convertToPortableText = (text) => {
    if (!text) return [];
    // Divide o texto em parágrafos usando quebras de linha duplas
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');

    return paragraphs.map(p => ({
        _key: uuidv4(), // ID único para cada bloco Portable Text
        _type: 'block', // Tipo de bloco Portable Text (sempre 'block' para parágrafos)
        children: [
            {
                _key: uuidv4(),
                _type: 'span', // Tipo de conteúdo dentro do bloco
                marks: [], // Formatação de texto (negrito, itálico, etc. - vazia para texto corrido)
                text: p.trim(), // O texto do parágrafo
            },
        ],
        markDefs: [], // Definições para marcas (links, etc. - vazia aqui)
        style: 'normal', // Estilo do parágrafo (padrão)
    }));
};

// --- Rotas da API ---

// Rota de teste simples para verificar se o servidor está rodando
app.get('/', (req, res) => {
    res.send('Servidor do backend "Meus Cursos" está rodando! 🙌');
});

// Rotas de Autenticação (NÃO protegidas, pois são para login/registro)
app.post('/api/auth/register', register); // Rota para criar um novo usuário
app.post('/api/auth/login', login);      // Rota para logar um usuário existente

// Rota de Geração de Cursos (AGORA PROTEGIDA)
// O middleware 'protect' é executado antes da lógica da rota.
// Se o token for inválido, a requisição é rejeitada aqui.
app.post('/api/courses/generate', protect, async (req, res) => { 
    // req.user agora contém { id: ..., isAdmin: ..., plan: ... } do usuário logado
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

        console.log(`Gerando curso para o tópico: "${topic}" para o usuário ${req.user.id}...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse.response.candidates[0].content.parts[0].text;

        let generatedCourseData;
        try {
            let cleanText = text.replace(/```json\n|```json|```/g, '').trim();
            // Remove caracteres de controle (Unicode) e substitui quebras de linha para JSON válido
            cleanText = cleanText.replace(/[\u0000-\u001F\u007F-\u009F\u00A0]/g, '').replace(/(\r\n|\n|\r)/gm, '\\n');
            
            generatedCourseData = JSON.parse(cleanText);
        } catch (parseError) {
            console.error("Erro ao parsear JSON da Gemini API:", parseError);
            console.error("Texto bruto recebido da Gemini:", text);
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA. Formato JSON inválido.', rawText: text });
        }

        // Usa o ID do usuário autenticado como o criador do curso
        const creatorId = req.user.id; 

        const courseId = `course-${uuidv4()}`; // Gera um ID único para o curso

        const transaction = sanityClient.transaction(); // Inicia uma transação Sanity

        const lessonRefs = [];
        for (const lesson of generatedCourseData.lessons) {
            // Garante que o slug da lição é válido, usando o slug do curso se o da lição for nulo
            const lessonSlug = { current: lesson.slug || `${generatedCourseData.slug}-${lesson.order}` };
            const lessonId = `lesson-${uuidv4()}`; // Gera ID único para a lição

            const newLesson = {
                _id: lessonId,
                _type: 'lesson',
                title: lesson.title,
                slug: lessonSlug,
                content: convertToPortableText(lesson.content), // Converte o texto para Portable Text
                order: lesson.order,
                estimatedReadingTime: lesson.estimatedReadingTime || 5,
                status: 'published', // Status padrão para novas lições
                course: { // Referência à qual curso esta lição pertence
                    _ref: courseId,
                    _type: 'reference',
                    _weak: true, // Referência fraca, a lição pode existir sem o curso se ele for deletado
                },
            };

            transaction.create(newLesson); // Adiciona a criação da lição à transação
            lessonRefs.push({ // Armazena a referência da lição para o campo 'lessons' do curso
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
            lessons: lessonRefs, // Links para as lições criadas
            status: 'published',
            price: 0,
            isProContent: false,
            level: 'beginner',
            estimatedDuration: `${generatedCourseData.lessons.length * 10} minutos`,
            creator: { // Referência ao membro que gerou este curso
                _ref: creatorId, 
                _type: 'reference',
                _weak: true,
            },
            // category e subCategory: Você pode adicionar lógica para definir estes campos
            // com base no tópico ou em valores padrão, se forem obrigatórios no seu schema 'course'.
            // Ex: category: { _ref: 'someCategoryId', _type: 'reference' },
            aiGenerationPrompt: prompt, // Salva o prompt usado para auditoria
            aiModelUsed: model.model,   // Salva o modelo da IA usado
            generatedAt: new Date().toISOString(), // Data de criação
            lastGenerationRevision: new Date().toISOString(), // Data da última revisão
        };

        transaction.create(newCourse); // Adiciona a criação do curso à transação
        console.log(`Curso "${newCourse.title}" adicionado à transação.`);

        const sanityResult = await transaction.commit(); // Executa a transação no Sanity
        // --- LINHA AJUSTADA ---
        console.log(`Transação concluída. Documentos criados: ${sanityResult.results.map(doc => doc._id).join(', ')}`);

        // Resposta de sucesso para o frontend
        res.status(201).json({
            message: 'Curso e lições gerados e salvos com sucesso!',
            // --- LINHA AJUSTADA ---
            course: sanityResult.results[0], // Retorna o primeiro documento criado (geralmente o curso)
            lessons: generatedCourseData.lessons // Retorna os dados das lições (não os docs do Sanity)
        });

    } catch (error) {
        console.error("Erro no processo de geração/salvamento do curso:", error);
        // Tratamento de erros detalhado
        if (error.response && error.response.data && error.response.data.error) {
            console.error("Erro da Gemini API:", error.response.data.error);
            return res.status(500).json({ error: `Erro da Gemini API: ${error.response.data.error.message}`, details: error.response.data });
        }
        if (error.statusCode) { // Erros específicos do Sanity Client
            console.error("Erro do Sanity:", error.message);
            return res.status(500).json({ error: `Erro do Sanity CMS: ${error.message}`, details: error });
        }
        // Catch-all para outros erros não esperados
        res.status(500).json({ error: 'Falha interna ao gerar ou salvar o curso.', details: error.message });
    }
});

// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor do backend rodando em http://localhost:${PORT}`);
    console.log('Aguardando requisições do frontend...');
    console.log('Endpoints disponíveis:');
    console.log(`GET /`);
    console.log(`POST /api/auth/register`); // Para registro de novos usuários
    console.log(`POST /api/auth/login`);      // Para login de usuários existentes
    console.log(`POST /api/courses/generate (protegida)`); // Requer autenticação JWT
});