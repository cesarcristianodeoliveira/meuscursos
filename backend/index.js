const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { generateCourse } = require('./controllers/courseController');
const statusRoutes = require('./routes/statusRoutes');

const app = express();

// --- CONFIGURAÇÃO DE PORTA ---
const PORT = process.env.PORT || 5000;

// --- CONFIGURAÇÃO DE CORS (CORRIGIDA) ---
const allowedOrigins = [
  'http://localhost:3000',           // Frontend Local
  'https://meuscursos.netlify.app',  // SEU FRONTEND REAL NO NETLIFY (Ajustado)
  'https://meuscursos.onrender.com'  // URL da própria API (útil para testes)
];

app.use(cors({
  origin: function (origin, callback) {
    // 1. Permite requisições sem 'origin' (como apps mobile, Insomnia ou Postman)
    if (!origin) return callback(null, true);

    // 2. Verifica se a origem está na nossa lista branca
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log para você ver no console do Render qual URL está sendo bloqueada
      console.error(`🚫 Bloqueio de CORS para a origem: ${origin}`);
      callback(new Error('Bloqueado pelo CORS: Origem não permitida.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// --- PÁGINA INICIAL (HTML SIMPLES) ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Motor de IA | Status</title>
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; color: white; }
        .container { text-align: center; border: 1px solid #1e293b; padding: 2rem; border-radius: 12px; background: #1e293b; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .status { color: #10b981; font-weight: bold; }
        h1 { margin-bottom: 0.5rem; font-size: 1.5rem; }
        p { color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Motor de IA v1.2</h1>
        <p>Status do Servidor: <span class="status">ONLINE</span></p>
        <p>Acesse o painel do Netlify para gerar cursos.</p>
      </div>
    </body>
    </html>
  `);
});

// --- ROTAS DE API ---
app.use('/', statusRoutes); 
app.post('/generate-course', generateCourse);

// --- INICIALIZAÇÃO ---
app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`🚀 Servidor rodando na porta: ${PORT}`);
  console.log(`🌍 Origens permitidas: ${allowedOrigins.join(', ')}`);
  console.log(`-----------------------------------------`);
});