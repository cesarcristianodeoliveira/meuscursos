const express = require('express');
const cors = require('cors');
const { generateCourse } = require('./controllers/courseController');
const client = require('./config/sanity'); // Importando o client do Sanity
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// --- NOVA ROTA DE MONITORAMENTO REAL ---
app.get('/provider-status', async (req, res) => {
  try {
    // Definimos o limite com base no plano Free da Groq (aprox. 30 requisições por hora para o Llama 3.3)
    const MAX_PER_HOUR = 30; 
    
    // Contamos quantos cursos foram criados na ÚLTIMA HORA no seu Sanity
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const query = `count(*[_type == "course" && _createdAt > $oneHourAgo])`;
    
    const count = await client.fetch(query, { oneHourAgo });
    const available = Math.max(0, MAX_PER_HOUR - count);

    res.json({
      groq: {
        available,
        limit: MAX_PER_HOUR,
        enabled: available > 0,
        // Mensagem dinâmica para o seu Select no Hero
        message: available > 0 ? `${available} cursos disponíveis (esta hora)` : "Limite da hora atingido"
      }
    });
  } catch (error) {
    console.error("Erro ao checar status:", error);
    res.status(500).json({ error: "Erro interno ao validar cotas" });
  }
});

// Rotas existentes
app.post('/generate-course', generateCourse);

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Motor de Cursos Master rodando na porta ${PORT}`);
});