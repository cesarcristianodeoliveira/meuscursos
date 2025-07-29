// D:\meuscursos\backend\server.js

import dotenv from 'dotenv';
dotenv.config(); // Carrega as variáveis de ambiente do .env

import express from 'express';
import cors from 'cors';

// Importa os middlewares de autenticação
import { protect, adminProtect } from './middleware/authMiddleware.js';

// Importa as rotas de autenticação
import authRoutes from './routes/authRoutes.js';

// Importa as novas rotas de modelos de IA
import aiModelRoutes from './routes/aiModelRoutes.js'; 

const app = express();
const PORT = process.env.PORT || 3001; 

// --- Configuração CORS para Produção ---
const allowedOrigins = [
    process.env.FRONTEND_URL, 
    'http://localhost:3000', 
    'https://meuscursos.netlify.app', 
    'https://meuscursos.onrender.com', 
].filter(Boolean); // Filtra quaisquer valores nulos/indefinidos

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem origem (como de ferramentas Postman/Insomnia ou requisições do mesmo servidor)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            console.error(msg); 
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Permite o envio de cookies de credenciais
    optionsSuccessStatus: 204, // Resposta para requisições OPTIONS bem-sucedidas
}));

app.use(express.json()); // Habilita o parsing de JSON para o corpo das requisições

// --- Rotas da API ---
app.get('/', (req, res) => {
    res.send('Servidor do backend "Meus Cursos" está rodando! 🙌');
});

// Monta as rotas de Autenticação sob o prefixo /api/auth
app.use('/api/auth', authRoutes);

// Monta as novas rotas de modelos de IA sob o prefixo /api/ai-models
// O middleware 'protect' já está aplicado dentro de 'aiModelRoutes.js' para a rota específica.
app.use('/api/ai-models', aiModelRoutes); 

// Exemplo de rota protegida (requer token JWT válido)
// Você pode adicionar mais rotas protegidas aqui, usando 'protect'
app.get('/api/protected', protect, (req, res) => {
    // req.user estará disponível aqui com as informações do usuário decodificadas do token
    res.status(200).json({ 
        message: 'Você acessou uma rota protegida!', 
        user: req.user 
    });
});

// Exemplo de rota protegida para administradores (requer token JWT válido e isAdmin: true)
app.get('/api/admin', protect, adminProtect, (req, res) => {
    res.status(200).json({ 
        message: 'Você acessou uma rota de administrador!', 
        user: req.user 
    });
});


// Tratamento de erros para JWT (se o token for inválido, etc.)
// Este middleware de erro deve ser o último a ser definido, antes do app.listen
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        // Erro específico do express-jwt (se estivesse sendo usado)
        // Como estamos usando um middleware JWT customizado, este bloco pode ser ajustado
        // O erro já é tratado dentro do middleware 'protect'
        return res.status(401).json({ message: 'Não autorizado, token inválido ou expirado.' });
    }
    // Para outros tipos de erros, passa para o próximo middleware de erro ou Express lida
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
    console.log(`GET /api/ai-models (requer autenticação)`); // Adicionado o novo endpoint
    console.log(`GET /api/protected (requer autenticação)`);
    console.log(`GET /api/admin (requer autenticação e permissão de admin)`);
});
