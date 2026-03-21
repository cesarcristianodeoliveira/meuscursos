const express = require('express');
const cors = require('cors');
const { generateCourse } = require('./controllers/courseController');
const client = require('./config/sanity');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// --- ROTA DE MONITORAMENTO DE COTAS CORRIGIDA ---
app.get('/provider-status', async (req, res) => {
  try {
    // Definimos 100k tokens por hora como teto
    const HOURLY_TOKEN_LIMIT = 100000; 
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // CORREÇÃO: Usamos $oneHourAgo na query e stats.generatedAt para precisão imediata
    const query = `{
      "usedTokens": sum(*[_type == "course" && stats.generatedAt > $oneHourAgo].stats.totalTokens)
    }`;

    const stats = await client.fetch(query, { oneHourAgo });

    // Tratamos o caso de banco zerado (null vira 0)
    const usedTokens = stats.usedTokens || 0;
    const remainingTokens = Math.max(0, HOURLY_TOKEN_LIMIT - usedTokens);
    
    // Estimativa de 6000 tokens por curso
    const availableByTokens = Math.floor(remainingTokens / 6000);

    // Resposta formatada exatamente como o CourseContext espera
    res.json({
      groq: {
        id: 'groq',
        enabled: availableByTokens > 0,
        message: availableByTokens > 0 
          ? `${availableByTokens} cursos disponíveis` 
          : "Limite da hora atingido",
        available: availableByTokens
      },
      openai: { id: 'openai', enabled: false, message: "Esgotado" },
      google: { id: 'google', enabled: false, message: "Em Breve" }
    });
  } catch (error) {
    console.error("❌ Erro ao checar status:", error);
    // Fallback amigável para o frontend não ficar em "Consultando" eterno
    res.json({
      groq: { enabled: true, message: "10 cursos disponíveis (fallback)" },
      openai: { enabled: false, message: "Esgotado" },
      google: { enabled: false, message: "Em Breve" }
    });
  }
});

app.post('/generate-course', generateCourse);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Motor v1.2 rodando na porta ${PORT}`);
});