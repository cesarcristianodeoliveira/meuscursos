const express = require('express');
const router = express.Router();
const { checkGlobalQuota } = require('../services/quotaService');

router.get('/provider-status', async (req, res) => {
  try {
    const globalStatus = await checkGlobalQuota();

    res.json({
      groq: {
        id: 'groq',
        enabled: globalStatus.availableSlots > 0,
        message: globalStatus.availableSlots > 0 
          ? `${globalStatus.availableSlots} gerações globais disponíveis` 
          : "Servidor em cooldown (limite de API atingido)",
        available: globalStatus.availableSlots
      },
      openai: { id: 'openai', enabled: false, message: "Em breve" },
      google: { id: 'google', enabled: false, message: "Em breve" }
    });
  } catch (error) {
    console.error("❌ Erro Status:", error.message);
    res.json({
      groq: { id: 'groq', enabled: true, message: "Sistema Online", available: 1 },
      openai: { id: 'openai', enabled: false, message: "Offline" }
    });
  }
});

module.exports = router;