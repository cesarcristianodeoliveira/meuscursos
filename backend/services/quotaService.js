const client = require('../config/sanity');

/**
 * SERVIÇO DE COTAS E CRÉDITOS (QuotaService)
 * Gerencia o saldo de gerações, recuperações automáticas e limites globais.
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

    // 1. Se ele tem crédito disponível no campo direto, libera.
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
      reason: `Você atingiu seu limite de geração. Novo crédito disponível em ${timeLeft} minutos.`,
      timeLeft 
    };

  } catch (error) {
    console.error("❌ Erro ao verificar cota:", error.message);
    return { canGenerate: false, reason: "Erro ao validar créditos no servidor." };
  }
};

/**
 * 2. Verifica a cota GLOBAL (Segurança de custos da sua API Key)
 */
const checkGlobalQuota = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    // Contagem de cursos gerados por IA na última hora
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
 * 3. Consome o crédito e marca o tempo exato do gasto.
 */
const consumeCredit = async (userId) => {
  try {
    await client
      .patch(userId)
      .setIfMissing({ stats: { coursesCreated: 0 } }) // Garante que stats existe
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
 * 4. Reembolsa o crédito em caso de falha crítica na IA.
 */
const refundCredit = async (userId) => {
  try {
    await client
      .patch(userId)
      .set({ 
        credits: 1,
        "stats.lastGenerationAt": null 
      })
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