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
} from './controllers/dataController.js';

const app = express();
const PORT = process.env.PORT || 3001; 

// --- Configuração CORS para Produção ---
// Permite requisições da sua URL do Netlify.
// Se você estiver testando localmente, adicione 'http://localhost:3000' também.
const allowedOrigins = [
    'https://meuscursos.netlify.app', // Sua URL do Netlify
    'http://localhost:3000',          // Para desenvolvimento local do frontend
    // Adicione outras origens se necessário
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
    credentials: true, // Permite o envio de cookies de autenticação
    optionsSuccessStatus: 204, // Para requisições OPTIONS
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

// --- Rotas da API ---
app.get('/', (req, res) => {
    res.send('Servidor do backend "Meus Cursos" está rodando! 🙌');
});

// Rotas de Autenticação
app.post('/api/auth/register', register); 
app.post('/api/auth/login', login);

// --- ROTAS PARA CRIAÇÃO DE CURSOS (PROTEGIDAS) ---

app.get('/api/courses/create/top-categories', protect, getTopCategories); 

// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor do backend rodando em http://localhost:${PORT}`);
    console.log('Aguardando requisições do frontend...');
    console.log('Endpoints disponíveis:');
    console.log(`GET /`);
    console.log(`POST /api/auth/register`); 
    console.log(`POST /api/auth/login`);
    console.log(`GET /api/courses/create/top-categories (protegida)`); 
});
