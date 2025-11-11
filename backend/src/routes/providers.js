// src/routes/providers.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const providers = [
      { id: 'openai', name: 'ChatGPT (OpenAI)', enabled: !!process.env.OPENAI_API_KEY },
      { id: 'gemini', name: 'Gemini', enabled: !!process.env.GEMINI_API_KEY },
    ];
    res.json(providers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar providers' });
  }
});

module.exports = router;
