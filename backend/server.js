// D:\meuscursos\backend\server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

import { register, login } from './controllers/authController.js'; 
// ATUALIZADO: Importa as duas novas funções do courseController
import { generateCoursePreview, saveGeneratedCourse } from './controllers/courseController.js'; 
import { getCourseCategories, getCourseSubCategories, getCourseTagsByCategory } from './controllers/dataController.js'; 

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

// ATUALIZADO: Rota para gerar PRÉ-VISUALIZAÇÃO de Cursos (protegida)
app.post('/api/courses/generate-preview', protect, generateCoursePreview); 

// NOVA ROTA: Rota para SALVAR Cursos Gerados e Debitar Créditos (protegida)
app.post('/api/courses/save-generated', protect, saveGeneratedCourse); 

// --- ROTAS PARA BUSCA DE DADOS ---
app.get('/api/data/categories', getCourseCategories);
app.get('/api/data/subcategories', getCourseSubCategories);
app.get('/api/data/tags/byCategory/:categoryId', getCourseTagsByCategory);

// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor do backend rodando em http://localhost:${PORT}`);
    console.log('Aguardando requisições do frontend...');
    console.log('Endpoints disponíveis:');
    console.log(`GET /`);
    console.log(`POST /api/auth/register`); 
    console.log(`POST /api/auth/login`);
    console.log(`POST /api/courses/generate-preview (protegida)`);
    console.log(`POST /api/courses/save-generated (protegida)`);
    console.log(`GET /api/data/categories`); 
    console.log(`GET /api/data/subcategories`);
    console.log(`GET /api/data/tags/byCategory/:categoryId`);
});