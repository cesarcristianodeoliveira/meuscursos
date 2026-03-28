const express = require('express');
const cors = require('cors');
const { generateCourse } = require('./controllers/courseController');
const client = require('./config/sanity');
require('dotenv').config();

const app = express();

// Configuração de CORS
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// --- ROTA DE MONITORAMENTO DE COTAS ---
app.get('/provider-status', async (req, res) => {
  try {
    // Limite de segurança baseado no plano gratuito da Groq (Tokens Per Minute/Hour)
    const HOURLY_TOKEN_LIMIT = 100000; 
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // BUSCA: Pegamos os tokens dos cursos gerados na última hora
    // Adicionamos um filtro de segurança para garantir que stats.totalTokens exista
    const query = `*[_type == "course" && stats.generatedAt > $oneHourAgo && defined(stats.totalTokens)].stats.totalTokens`;
    const tokensArray = await client.fetch(query, { oneHourAgo });

    // SOMA: Calculamos quanto da cota já foi consumida
    const usedTokens = (tokensArray || []).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    
    const remainingTokens = Math.max(0, HOURLY_TOKEN_LIMIT - usedTokens);
    
    // Estimativa conservadora: 6500 tokens por curso completo (IA + Imagem + Processamento)
    const availableByTokens = Math.floor(remainingTokens / 6500);

    res.json({
      groq: {
        id: 'groq',
        enabled: availableByTokens > 0,
        message: availableByTokens > 0 
          ? `${availableByTokens} gerações disponíveis` 
          : "Limite atingido (aguarde 1h)",
        available: availableByTokens
      },
      openai: { 
        id: 'openai', 
        enabled: false, 
        message: "Em breve" 
      },
      google: { 
        id: 'google', 
        enabled: false, 
        message: "Em breve" 
      }
    });
  } catch (error) {
    console.error("❌ Erro ao checar status de cotas:", error.message);
    
    // FALLBACK: Se o Sanity falhar, permitimos a tentativa de geração para não travar o app
    res.json({
      groq: { id: 'groq', enabled: true, message: "Sistema Online", available: 5 },
      openai: { id: 'openai', enabled: false, message: "Offline" },
      google: { id: 'google', enabled: false, message: "Offline" }
    });
  }
});

// Rota principal de geração
app.post('/generate-course', generateCourse);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Motor de IA v1.2 rodando na porta ${PORT}`);
});