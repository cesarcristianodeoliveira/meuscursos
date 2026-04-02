const client = require('../config/sanity');

/**
 * SERVIÇO DE COTAS E CRÉDITOS (QuotaService)
 * Gerencia o saldo de gerações e previne gastos excessivos.
 */

/**
 * 1. Verifica se o usuário tem permissão para gerar.
 * Regra: Se tiver crédito > 0, pode. Se crédito === 0, verifica se já passou 1h do último gasto.
 */
const checkUserQuota = async (userId) => {
  try {
    const user = await client.fetch(`*[_type == "user" && _id == $userId][0]`, { userId });

    if (!user) return { canGenerate: false, reason: "Usuário não encontrado." };

    // Regra para ADMIN: Sempre liberado
    if (user.role === 'admin') return { canGenerate: true };

    // Se ele já tem crédito disponível (não gastou o da hora atual), libera.
    if (user.credits > 0) return { canGenerate: true };

    // Se ele NÃO tem crédito, verificamos o timestamp do último gasto
    const now = new Date();
    // Usaremos um campo específico 'lastGenerationAt' para precisão total
    const lastGen = user.stats?.lastGenerationAt ? new Date(user.stats.lastGenerationAt) : new Date(0);
    
    const msPassed = now - lastGen;
    const minutesPassed = msPassed / (1000 * 60);
    const hoursPassed = minutesPassed / 60;

    // Se já passou 1 hora desde o ÚLTIMO GASTO, ele recupera o direito de gerar
    if (hoursPassed >= 1) {
      return { canGenerate: true, autoRefill: true };
    }

    const timeLeft = Math.ceil(60 - minutesPassed);
    return { 
      canGenerate: false, 
      reason: `Você já gerou um curso recentemente. Novo crédito em ${timeLeft} minutos.`,
      timeLeft 
    };

  } catch (error) {
    console.error("❌ Erro ao verificar cota:", error.message);
    return { canGenerate: false, reason: "Erro ao validar créditos." };
  }
};

/**
 * 2. Verifica a cota GLOBAL (Segurança de custos da API)
 */
const checkGlobalQuota = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const query = `count(*[_type == "course" && aiMetadata.generatedAt > $oneHourAgo])`;
    const coursesInLastHour = await client.fetch(query, { oneHourAgo });

    const GLOBAL_LIMIT = 50; 
    return {
      availableSlots: GLOBAL_LIMIT - coursesInLastHour,
      isOk: coursesInLastHour < GLOBAL_LIMIT
    };
  } catch (error) {
    return { isOk: false };
  }
};

/**
 * 3. Consome o crédito e marca o tempo exato do gasto.
 */
const consumeCredit = async (userId) => {
  try {
    await client
      .patch(userId)
      .set({ 
        credits: 0, 
        "stats.lastGenerationAt": new Date().toISOString() 
      })
      .inc({ "stats.coursesCreated": 1 })
      .commit();
    return true;
  } catch (error) {
    console.error("❌ Erro ao consumir crédito:", error.message);
    return false;
  }
};

/**
 * 4. Reembolsa o crédito em caso de erro na API de IA.
 */
const refundCredit = async (userId) => {
  try {
    // Ao reembolsar, limpamos o timestamp para que ele possa tentar de novo IMEDIATAMENTE
    await client
      .patch(userId)
      .set({ 
        credits: 1,
        "stats.lastGenerationAt": null 
      })
      .commit();
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  checkUserQuota,
  checkGlobalQuota,
  consumeCredit,
  refundCredit
};