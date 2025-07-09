// D:\meuscursos\backend\server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors'; // Certifique-se de que 'cors' está instalado
import jwt from 'jsonwebtoken';

import { register, login } from './controllers/authController.js'; 
import { generateCoursePreview, saveGeneratedCourse } from './controllers/courseController.js'; 
import { getCourseCategories, getCourseSubCategories, getCourseTagsByCategory } from './controllers/dataController.js'; 

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuração CORS ---
const allowedOrigins = [
    'https://meuscursos.netlify.app', // Sua URL do frontend no Netlify
    'http://localhost:3000',          // Se você roda seu frontend localmente em 3000
    'http://localhost:5173',          // Ou outra porta que você usa em desenvolvimento local (ex: Vite usa 5173)
    'http://localhost:8080'           // Mais uma opção comum para desenvolvimento local
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permite requisições sem "origin" (como de apps mobile ou ferramentas como Postman)
        // OU se a origem está na lista de allowedOrigins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP que você permite
    credentials: true, // Importante se você usa cookies ou cabeçalhos de autenticação
    optionsSuccessStatus: 204 // Para algumas compatibilidades de navegadores antigos
};

app.use(cors(corsOptions)); // Aplica a configuração CORS com as opções definidas
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