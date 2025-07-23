// D:\meuscursos\backend\server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'; 

// Importa as funções de registro e login do controlador de autenticação
import { register, login } from './controllers/authController.js';

// --- Importa funções do dataController ---
// Agora importamos getTopCategories, createCategory, getSubcategories, createSubcategory, getTags, createTag e getPixabayImages
import {
    getTopCategories, 
    createCategory,
    getSubcategories, 
    createSubcategory,
    getTags, 
    createTag,
    getPixabayImages 
} from './controllers/dataController.js';

const app = express();
const PORT = process.env.PORT || 3001; 

// --- Configuração CORS para Produção ---
const allowedOrigins = [
    process.env.FRONTEND_URL, // Permite que a variável de ambiente seja usada
    'http://localhost:3000', // Para desenvolvimento local
    'https://meuscursos.netlify.app', // Se você estiver usando Netlify para o frontend
    'https://meuscursos.onrender.com', // Adicionado explicitamente a URL do seu frontend no Render
    // Adicione outras origens se necessário, por exemplo, se o seu backend estiver em um subdomínio diferente no Render
    // Ex: 'https://seubackend.onrender.com' se o frontend estiver em 'https://seubackend.onrender.com'
].filter(Boolean); // Remove entradas nulas/vazias se FRONTEND_URL não estiver definida

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem 'origin' (ex: mobile apps, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            console.error(msg); // Loga a origem que está sendo bloqueada
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

// --- ROTAS PARA CRIAÇÃO DE CURSOS (PROTEGIDAS) ---

// Rota para buscar as categorias (protegida)
app.get('/api/courses/create/top-categories', protect, getTopCategories); 

// Rota para criar uma nova categoria (protegida por adminProtect)
app.post('/api/categories', protect, adminProtect, createCategory); 

// Rota para buscar subcategorias (protegida)
app.get('/api/subcategories', protect, getSubcategories);

// Rota para criar uma nova subcategoria (protegida por adminProtect)
app.post('/api/subcategories', protect, adminProtect, createSubcategory);

// Rota para buscar tags (protegida)
app.get('/api/tags', protect, getTags);

// Rota para criar uma nova tag (protegida por adminProtect)
app.post('/api/tags', protect, adminProtect, createTag);

// Rota para buscar imagens do Pixabay (protegida)
app.get('/api/pixabay-images', protect, getPixabayImages);


// Tratamento de erros para JWT (se o token for inválido, etc.)
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(err.status).send({ message: err.message });
    }
    next(err);
});

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
    console.log(`GET /api/subcategories?categoryId=[id]&categoryName=[name] (protegida)`); 
    console.log(`POST /api/subcategories (protegida por admin)`);
    console.log(`GET /api/tags?categoryId=[id]&categoryName=[name]&subcategoryId=[id]&subcategoryName=[name] (protegida)`); 
    console.log(`POST /api/tags (protegida por admin)`);
    console.log(`GET /api/pixabay-images?searchQuery=[termo] (protegida)`); 
});
