// D:\meuscursos\backend\server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'; // Importar jsonwebtoken para o middleware de proteção

// Importa as funções de registro e login do controlador de autenticação
import { register, login } from './controllers/authController.js';

// --- Funções do dataController (APENAS o que precisamos AGORA para o Passo 1) ---
// Iremos manter apenas getTopCategories para este primeiro teste.
// As outras funções getCourseCategories, getCourseSubCategories, getCourseTagsByCategory, getAllTags
// e as getTopSubCategories, getTopTags serão adicionadas de volta conforme avançamos nos passos.
import {
    getTopCategories, // MANTIDO: Para o Passo 1 (categorias combinadas)
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

// Rotas de Autenticação (MANTIDAS)
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// --- ROTAS PARA CRIAÇÃO DE CURSOS (PROTEGIDAS) ---

// Passo 1: Busca as categorias combinadas (Sanity + Gemini)
app.get('/api/courses/create/top-categories', protect, getTopCategories);

// --- Rotas de DADOS GERAIS e outros passos de criação de curso REMOVIDOS TEMPORARIAMENTE ---
// Serão adicionadas de volta conforme a necessidade em cada passo.

// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor do backend rodando em http://localhost:${PORT}`);
    console.log('Aguardando requisições do frontend...');
    console.log('Endpoints disponíveis:');
    console.log(`GET /`);
    console.log(`POST /api/auth/register`);
    console.log(`POST /api/auth/login`);
    // Rotas de criação de curso (apenas as ativas no momento)
    console.log(`GET /api/courses/create/top-categories (protegida)`);
});