const express = require('express');
const router = express.Router();
const { checkGlobalQuota } = require('../services/quotaService');

/**
 * ROTA DE STATUS DOS PROVEDORES (Provider Health)
 * Informa ao Frontend quais IAs estão disponíveis e o limite de cota global.
 */
router.get('/provider-status', async (req, res) => {
  try {
    const globalStatus = await checkGlobalQuota();

    res.json({
      groq: {
        id: 'groq',
        enabled: globalStatus.isOk, // Usando a flag isOk do nosso quotaService
        message: globalStatus.isOk 
          ? `${globalStatus.availableSlots} gerações globais disponíveis` 
          : "Servidor em cooldown (limite de API atingido)",
        available: globalStatus.availableSlots
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
    console.error("❌ Erro ao buscar Status Global:", error.message);
    
    // Fallback de segurança para não travar o Frontend em caso de erro no Sanity
    res.json({
      groq: { 
        id: 'groq', 
        enabled: true, 
        message: "Sistema Online", 
        available: 1 
      },
      openai: { id: 'openai', enabled: false, message: "Offline" },
      google: { id: 'google', enabled: false, message: "Offline" }
    });
  }
});

module.exports = router;