const client = require('../config/sanity');

/**
 * SERVIÇO DE COTAS E CRÉDITOS (QuotaService)
 * Gerencia o saldo de gerações, recuperações automáticas e limites globais v1.3.
 */

/**
 * 1. Verifica se o usuário tem permissão para gerar.
 */
const checkUserQuota = async (userId) => {
  try {
    const user = await client.fetch(`*[_type == "user" && _id == $userId][0]`, { userId });

    if (!user) return { canGenerate: false, reason: "Usuário não encontrado." };

    // Regra para ADMIN: Sempre liberado
    if (user.role === 'admin') return { canGenerate: true };

    // 1. Se ele tem crédito disponível (acumulado ou plano), libera.
    if (user.credits > 0) return { canGenerate: true };

    // 2. Lógica de recuperação por tempo (1 crédito por hora)
    const now = new Date();
    const lastGen = user.stats?.lastGenerationAt 
      ? new Date(user.stats.lastGenerationAt) 
      : new Date(0);

    const msPassed = now - lastGen;
    const minutesPassed = msPassed / (1000 * 60);
    const hoursPassed = minutesPassed / 60;

    // Se já passou 1 hora desde o último gasto, ele recupera o direito.
    if (hoursPassed >= 1) {
      return { canGenerate: true, autoRefill: true };
    }

    // Caso contrário, informa quanto tempo falta
    const timeLeft = Math.ceil(60 - minutesPassed);
    return { 
      canGenerate: false, 
      reason: `Limite de geração atingido. Novo crédito disponível em ${timeLeft} minutos.`,
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
    console.error("❌ Erro na cota global:", error.message);
    return { isOk: false };
  }
};

/**
 * 3. Consome o crédito de forma inteligente.
 */
const consumeCredit = async (userId) => {
  try {
    const user = await client.fetch(`*[_id == $userId][0]{credits}`, { userId });
    
    // Se o usuário tinha créditos acumulados, apenas subtrai 1.
    // Se estava usando o crédito "temporal" (credits era 0), ele continua em 0.
    const newCreditAmount = user.credits > 0 ? user.credits - 1 : 0;

    await client
      .patch(userId)
      .setIfMissing({ stats: { coursesCreated: 0 } })
      .set({ 
        credits: newCreditAmount, 
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
 * 4. Reembolsa o crédito em caso de falha.
 */
const refundCredit = async (userId) => {
  try {
    // Devolve 1 crédito e "limpa" o timestamp para ele poder tentar de novo imediatamente
    await client
      .patch(userId)
      .inc({ credits: 1 })
      .set({ "stats.lastGenerationAt": new Date(0).toISOString() })
      .commit();
    return true;
  } catch (error) {
    console.error("❌ Erro ao reembolsar crédito:", error.message);
    return false;
  }
};

module.exports = {
  checkUserQuota,
  checkGlobalQuota,
  consumeCredit,
  refundCredit
};