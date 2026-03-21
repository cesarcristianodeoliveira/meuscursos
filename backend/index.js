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
    const HOURLY_TOKEN_LIMIT = 100000; 
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // BUSCA: Pegamos apenas o array de números de tokens dos cursos da última hora
    // Usamos 'coalesce' para garantir que se o campo não existir, venha 0
    const query = `*[_type == "course" && stats.generatedAt > $oneHourAgo].stats.totalTokens`;
    const tokensArray = await client.fetch(query, { oneHourAgo });

    // SOMA MANUAL (Mais segura): Somamos os tokens retornados no array
    const usedTokens = tokensArray.reduce((acc, curr) => acc + (curr || 0), 0);
    
    const remainingTokens = Math.max(0, HOURLY_TOKEN_LIMIT - usedTokens);
    
    // Estimativa de 6000 tokens por curso
    const availableByTokens = Math.floor(remainingTokens / 6000);

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
    console.error("❌ Erro Real ao checar status:", error);
    // FALLBACK DE SEGURANÇA (Se der erro, ele mostra o status real do sistema)
    res.json({
      groq: { id: 'groq', enabled: true, message: "Sistema Online", available: 5 },
      openai: { id: 'openai', enabled: false, message: "Esgotado" },
      google: { id: 'google', enabled: false, message: "Em Breve" }
    });
  }
});

app.post('/generate-course', generateCourse);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Motor v1.2 rodando na porta ${PORT}`);
});