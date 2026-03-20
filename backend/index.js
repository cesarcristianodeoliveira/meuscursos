const express = require('express');
const cors = require('cors');
const { generateCourse } = require('./controllers/courseController');
const client = require('./config/sanity');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// --- ROTA DE MONITORAMENTO DE COTAS (TOKEN-BASED) ---
app.get('/provider-status', async (req, res) => {
  try {
    // 1. Definição de limites (Plano Free Groq Llama 3.3 70B costuma ter ~100k TPM)
    // Vamos definir um teto de segurança por hora para não estourar o limite diário
    const HOURLY_TOKEN_LIMIT = 100000; 
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // 2. Query GROQ: Soma os tokens reais e conta os cursos na última hora
    const stats = await client.fetch(`{
      "count": count(*[_type == "course" && _createdAt > $oneHourAgo]),
      "usedTokens": sum(*[_type == "course" && _createdAt > $oneHourAgo].stats.totalTokens)
    }`, { oneHourAgo });

    const usedTokens = stats.usedTokens || 0;
    const remainingTokens = Math.max(0, HOURLY_TOKEN_LIMIT - usedTokens);
    
    // 3. Estimativa de cursos restantes: 
    // Como seus cursos são densos, usamos uma média segura de 6000 tokens por curso
    const availableByTokens = Math.floor(remainingTokens / 6000);

    res.json({
      groq: {
        available: availableByTokens,
        usedInHour: usedTokens,
        limit: HOURLY_TOKEN_LIMIT,
        enabled: availableByTokens > 0,
        // Mensagem dinâmica que reflete a realidade do consumo
        message: availableByTokens > 0 
          ? `${availableByTokens} cursos disponíveis (cota real)` 
          : "Cota de tokens esgotada (1h)"
      },
      openai: { enabled: false, message: "Esgotado" },
      google: { enabled: false, message: "Em Breve" }
    });
  } catch (error) {
    console.error("Erro ao checar status:", error);
    res.status(500).json({ error: "Erro interno ao validar cotas" });
  }
});

// Rotas
app.post('/generate-course', generateCourse);

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Motor de Cursos Master v1.2 rodando na porta ${PORT}`);
  console.log(`📊 Monitoramento de tokens ativado`);
});