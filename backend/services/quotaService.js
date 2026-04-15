const client = require('../config/sanity');

/**
 * SERVIÇO DE COTAS E CRÉDITOS (QuotaService) v1.3
 * Gerencia saldo, recuperação automática e limites globais.
 */

/**
 * 1. Verifica se o usuário tem permissão para gerar um curso.
 */
const checkUserQuota = async (userId) => {
  try {
    const user = await client.fetch(`*[_type == "user" && _id == $userId][0]`, { userId });

    if (!user) return { canGenerate: false, reason: "Usuário não encontrado." };

    // Regra para ADMIN: Sempre liberado
    if (user.role === 'admin') return { canGenerate: true };

    // 1. Se ele tem crédito positivo, libera imediatamente.
    if (user.credits > 0) return { canGenerate: true };

    // 2. Lógica de recuperação por tempo (1 crédito por hora para Plano Free)
    const now = new Date();
    const lastGen = user.stats?.lastGenerationAt 
      ? new Date(user.stats.lastGenerationAt) 
      : new Date(0);

    const msPassed = now - lastGen;
    const minutesPassed = msPassed / (1000 * 60);
    const hoursPassed = minutesPassed / 60;

    // Se já passou 1 hora desde a última geração
    if (hoursPassed >= 1) {
      // Importante: Não precisamos atualizar o crédito aqui, o consumeCredit fará isso.
      return { canGenerate: true, autoRefill: true };
    }

    // Caso contrário, calcula o tempo restante
    const timeLeft = Math.ceil(60 - minutesPassed);
    return { 
      canGenerate: false, 
      reason: `Você já gerou um curso recentemente. Próximo crédito disponível em ${timeLeft} min.`,
      timeLeft 
    };

  } catch (error) {
    console.error("❌ Erro ao verificar cota:", error.message);
    return { canGenerate: false, reason: "Erro ao validar créditos." };
  }
};

/**
 * 2. Verifica a cota GLOBAL (Evita estourar custos da API de IA)
 */
const checkGlobalQuota = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    // Conta cursos criados globalmente na última hora
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
 * 3. Consome o crédito e atualiza o timestamp de geração.
 */
const consumeCredit = async (userId) => {
  try {
    const user = await client.fetch(`*[_id == $userId][0]{credits}`, { userId });

    // Se ele tinha crédito (ex: 1 ou mais), subtrai. 
    // Se estava usando o "autoRefill" (estava com 0 mas passou 1h), mantém 0.
    const newCreditAmount = user.credits > 0 ? user.credits - 1 : 0;

    await client
      .patch(userId)
      .setIfMissing({ stats: {} })
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
    // Ao reembolsar, voltamos o lastGenerationAt para o passado para liberar o tempo
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    await client
      .patch(userId)
      .setIfMissing({ stats: {} })
      .inc({ credits: 1 })
      .set({ "stats.lastGenerationAt": oneHourAgo })
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