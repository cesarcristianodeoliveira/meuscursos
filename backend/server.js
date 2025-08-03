import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

// Middlewares e rotas
import { protect, adminProtect } from './middleware/authMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import aiModelRoutes from './routes/aiModelRoutes.js';
import mailchimpRoutes from './routes/mailchimpRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS ---
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://meuscursos.netlify.app',
  'https://meuscursos.onrender.com',
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        const msg = `CORS policy: origem não permitida -> ${origin}`;
        console.error(msg);
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// --- Middleware para JSON ---
app.use(express.json());

// --- Rotas públicas ---
app.get('/', (req, res) => {
  res.send('Servidor do backend "Meus Cursos" está rodando! 🙌');
});

app.use('/api/auth', authRoutes);
app.use('/api/ai-models', aiModelRoutes);
app.use('/api/newsletter', mailchimpRoutes);

// --- Rotas protegidas ---
app.get('/api/protected', protect, (req, res) => {
  res.status(200).json({
    message: 'Você acessou uma rota protegida!',
    user: req.user,
  });
});

app.get('/api/admin', protect, adminProtect, (req, res) => {
  res.status(200).json({
    message: 'Você acessou uma rota de administrador!',
    user: req.user,
  });
});

// --- Tratamento de erros JWT ---
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res
      .status(401)
      .json({ message: 'Não autorizado, token inválido ou expirado.' });
  }
  next(err);
});

// --- Inicialização do servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log('🔗 Endpoints disponíveis:');
  console.log('GET  /');
  console.log('POST /api/auth/register');
  console.log('POST /api/auth/login');
  console.log('GET  /api/ai-models');
  console.log('GET  /api/protected');
  console.log('GET  /api/admin');
  console.log('POST /api/newsletter/subscribe');
  console.log('DELETE /api/newsletter/subscribe');
});
