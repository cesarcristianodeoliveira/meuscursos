const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { generateCourse } = require('./controllers/courseController');
const statusRoutes = require('./routes/statusRoutes');

const app = express();

// --- CONFIGURAÇÃO DE PORTA ---
// Local usa 5000 (seu setup), Render usa process.env.PORT
const PORT = process.env.PORT || 5000;

// --- CONFIGURAÇÃO DE CORS HÍBRIDO ---
const allowedOrigins = [
  'http://localhost:3000',           // Seu Frontend Local
  'https://meuscursos.onrender.com'  // Seu Frontend em Produção
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (como Insomnia/Postman) ou das URLs permitidas
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS: Origem não permitida.'));
    }
  },
  credentials: true
}));

app.use(express.json());

// --- PÁGINA INICIAL (HTML SIMPLES) ---
// Evita o erro "Cannot GET /" ao acessar a URL da API no navegador
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
        <p>Acesse o painel do aluno para gerar cursos.</p>
      </div>
    </body>
    </html>
  `);
});

// --- ROTAS DE API ---
app.use('/', statusRoutes); // Endpoints como /provider-status
app.post('/generate-course', generateCourse);

// --- INICIALIZAÇÃO ---
app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`🚀 Servidor rodando na porta: ${PORT}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`🌍 Produção: https://meuscursos.onrender.com`);
  console.log(`-----------------------------------------`);
});