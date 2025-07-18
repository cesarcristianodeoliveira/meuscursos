// D:\meuscursos\backend\server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'; 

// Importa as funções de registro e login do controlador de autenticação
import { register, login } from './controllers/authController.js';

// --- Importa funções do dataController ---
// Agora importamos getTopCategories
import {
    getTopCategories, 
} from './controllers/dataController.js';

const app = express();
const PORT = process.env.PORT || 3001; // Porta 3001, como você especificou

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

// Rota para buscar as categorias (agora importada e definida)
// O frontend chamará esta rota para obter as categorias da Gemini
app.get('/api/courses/create/top-categories', protect, getTopCategories); 

// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor do backend rodando em http://localhost:${PORT}`);
    console.log('Aguardando requisições do frontend...');
    console.log('Endpoints disponíveis:');
    console.log(`GET /`);
    console.log(`POST /api/auth/register`); 
    console.log(`POST /api/auth/login`);
    console.log(`GET /api/courses/create/top-categories (protegida)`); // Adicionado ao log de endpoints
});
