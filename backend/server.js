// D:\meuscursos\backend\server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'; // Importar jsonwebtoken para o middleware de proteção

// Importa as funções de registro e login do controlador de autenticação
import { register, login } from './controllers/authController.js';

// --- NOVAS E EXISTENTES FUNÇÕES DO courseController ---
// generateCoursePreview: para o Passo 7 (gerar conteúdo completo do curso)
// saveGeneratedCourse: para o Passo 8 (salvar no Sanity)
// generateTags: para o Passo 3 (gerar tags com IA)
// NOVO: generateCourseTitles: para o Passo 5 (gerar 5 títulos)
// NOVO: getPixabayImages: para o Passo 6 (buscar imagens Pixabay)
import {
    generateCoursePreview,
    saveGeneratedCourse,
    generateTags,
    generateCourseTitles, // Importação da nova função
    getPixabayImages // Importação da nova função
} from './controllers/courseController.js';

// --- NOVAS E EXISTENTES FUNÇÕES DO dataController ---
// getCourseCategories: para buscar todas as categorias (pode ser adaptada para "top 10")
// getCourseSubCategories: para buscar todas as subcategorias (pode ser adaptada para "top 10")
// getCourseTagsByCategory: para buscar tags existentes por categoria (se ainda for necessário)
// getAllTags: para buscar todas as tags (se ainda for necessário)
// NOVO: getTopCategories: para o Passo 1 (10 categorias mais procuradas)
// NOVO: getTopSubCategories: para o Passo 2 (10 subcategorias mais procuradas)
// NOVO: getTopTags: para o Passo 3 (10 tags mais procuradas)
import {
    getCourseCategories,
    getCourseSubCategories,
    getCourseTagsByCategory,
    getAllTags,
    getTopCategories, // Importação da nova função
    getTopSubCategories, // Importação da nova função
    getTopTags // Importação da nova função
} from './controllers/dataController.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Middleware de Autenticação (JWT Protection) ---
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                id: decoded.id,
                isAdmin: decoded.isAdmin,
                plan: decoded.plan
            };
            next();
        } catch (error) {
            console.error('Erro na autenticação do token:', error);
            return res.status(401).json({ message: 'Não autorizado, token inválido ou expirado.' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
    }
};

// --- Rotas da API ---

app.get('/', (req, res) => {
    res.send('Servidor do backend "Meus Cursos" está rodando! 🙌');
});

// Rotas de Autenticação
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// --- ROTAS PARA CRIAÇÃO DE CURSOS (PROTEGIDAS) ---

// Passo 1: Busca as 10 categorias mais procuradas
// Usaremos getTopCategories do dataController
app.get('/api/courses/create/top-categories', protect, getTopCategories);

// Passo 2: Busca as 10 subcategorias mais procuradas para uma categoria específica
// Usaremos getTopSubCategories do dataController
app.get('/api/courses/create/top-subcategories', protect, getTopSubCategories);

// Passo 3: Busca as 10 tags mais procuradas para categoria e subcategoria
// Usaremos getTopTags do dataController
app.get('/api/courses/create/top-tags', protect, getTopTags);

// Passo 5: Gera 5 títulos de curso com base nas seleções (via Gemini API)
// Usaremos generateCourseTitles do courseController
app.post('/api/courses/create/generate-titles', protect, generateCourseTitles);

// Passo 6: Busca 3 imagens aleatórias da Pixabay relacionadas às tags
// Usaremos getPixabayImages do courseController
app.get('/api/courses/create/pixabay-images', protect, getPixabayImages);

// Passo 7: Gera a pré-visualização completa do curso (via Gemini API)
// Reutilizamos generateCoursePreview do courseController
app.post('/api/courses/create/generate-preview', protect, generateCoursePreview);

// Passo 8: Salva o curso gerado no Sanity CMS
// Reutilizamos saveGeneratedCourse do courseController
app.post('/api/courses/create/save', protect, saveGeneratedCourse);

// --- ROTAS DE DADOS GERAIS (Podem ser públicas ou protegidas conforme sua necessidade) ---
// Mantidas as rotas existentes, caso sejam usadas em outras partes da aplicação
app.get('/api/data/categories', getCourseCategories);
app.get('/api/data/subcategories', getCourseSubCategories);
app.get('/api/data/tags', getAllTags);
app.get('/api/data/tags/byCategory/:categoryId', getCourseTagsByCategory);

// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor do backend rodando em http://localhost:${PORT}`);
    console.log('Aguardando requisições do frontend...');
    console.log('Endpoints disponíveis:');
    console.log(`GET /`);
    console.log(`POST /api/auth/register`);
    console.log(`POST /api/auth/login`);
    // Novas rotas de criação de curso
    console.log(`GET /api/courses/create/top-categories (protegida)`);
    console.log(`GET /api/courses/create/top-subcategories (protegida)`);
    console.log(`GET /api/courses/create/top-tags (protegida)`);
    console.log(`POST /api/courses/create/generate-titles (protegida)`);
    console.log(`GET /api/courses/create/pixabay-images (protegida)`);
    console.log(`POST /api/courses/create/generate-preview (protegida)`);
    console.log(`POST /api/courses/create/save (protegida)`);
    // Rotas de dados gerais
    console.log(`GET /api/data/categories`);
    console.log(`GET /api/data/subcategories`);
    console.log(`GET /api/data/tags`);
    console.log(`GET /api/data/tags/byCategory/:categoryId`);
});