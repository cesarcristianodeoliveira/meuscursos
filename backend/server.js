// D:\meuscursos\backend\server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'; 

// Importa as funções de registro e login do controlador de autenticação
import { register, login } from './controllers/authController.js';

// --- Importa funções do dataController ---
import {
    getTopCategories, 
    createCategory,
    getSubcategories,
    createSubcategory
} from './controllers/dataController.js';

const app = express();
const PORT = process.env.PORT || 3001; 

// --- Configuração CORS para Produção ---
const allowedOrigins = [
    'https://meuscursos.netlify.app',
    'http://localhost:3000',
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem 'origin' (ex: mobile apps, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
}));

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

// --- Middleware para verificar se o usuário é Admin ---
const adminProtect = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
    }
    next();
};


// --- Rotas da API ---
app.get('/', (req, res) => {
    res.send('Servidor do backend "Meus Cursos" está rodando! 🙌');
});

// Rotas de Autenticação
app.post('/api/auth/register', register); 
app.post('/api/auth/login', login);

// Rota para buscar as categorias (protegida)
app.get('/api/courses/create/top-categories', protect, getTopCategories); 

// Rota para criar uma nova categoria (protegida por adminProtect)
app.post('/api/categories', protect, adminProtect, createCategory); 

// NOVO: Rota para buscar subcategorias (protegida)
app.get('/api/courses/create/subcategories', protect, getSubcategories);

// NOVO: Rota para criar uma nova subcategoria (protegida por adminProtect)
app.post('/api/subcategories', protect, adminProtect, createSubcategory);

// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor do backend rodando em http://localhost:${PORT}`);
    console.log('Aguardando requisições do frontend...');
    console.log('Endpoints disponíveis:');
    console.log(`GET /`);
    console.log(`POST /api/auth/register`); 
    console.log(`POST /api/auth/login`);
    console.log(`GET /api/courses/create/top-categories (protegida)`); 
    console.log(`POST /api/categories (protegida por admin)`);
    console.log(`GET /api/courses/create/subcategories?categoryId=[id]&categoryName=[name] (protegida)`);
    console.log(`POST /api/subcategories (protegida por admin)`);
});
