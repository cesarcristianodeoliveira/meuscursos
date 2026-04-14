const client = require('../config/sanity');

/**
 * SERVIÇO DE COTAS E CRÉDITOS (QuotaService) v1.3
 * Gerencia saldo, recuperação automática de 1h e limites globais.
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

    // 1. Se ele tem crédito positivo (acumulado via plano ou bônus), libera.
    if (user.credits > 0) return { canGenerate: true };

    // 2. Lógica de recuperação por tempo (1 crédito por hora para Plano Free)
    const now = new Date();
    // Se o campo não existir, usamos uma data muito antiga para permitir a primeira geração
    const lastGen = user.stats?.lastGenerationAt 
      ? new Date(user.stats.lastGenerationAt) 
      : new Date(0);

    const msPassed = now - lastGen;
    const minutesPassed = msPassed / (1000 * 60);
    const hoursPassed = minutesPassed / 60;

    // Se já passou 1 hora desde a última geração de sucesso
    if (hoursPassed >= 1) {
      return { canGenerate: true, autoRefill: true };
    }

    // Caso contrário, calcula quanto tempo falta para completar 60 minutos
    const timeLeft = Math.ceil(60 - minutesPassed);
    return { 
      canGenerate: false, 
      reason: `Limite de 1 curso por hora atingido. Próximo crédito em ${timeLeft} min.`,
      timeLeft 
    };

  } catch (error) {
    console.error("❌ Erro ao verificar cota:", error.message);
    return { canGenerate: false, reason: "Erro ao validar créditos." };
  }
};

/**
 * 2. Verifica a cota GLOBAL (Segurança contra custos excessivos da API de IA)
 */
const checkGlobalQuota = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    // Conta quantos cursos foram criados por TODOS os usuários na última hora
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
    
    // Se o usuário tinha créditos acumulados (>0), subtrai 1. 
    // Se estava no 0 usando a regra de 1h, mantém 0.
    const newCreditAmount = user.credits > 0 ? user.credits - 1 : 0;

    await client
      .patch(userId)
      .setIfMissing({ stats: {} }) // Garante que o objeto stats existe antes de atualizar filhos
      .set({ 
        credits: newCreditAmount, 
        "stats.lastGenerationAt": new Date().toISOString() 
      })
      .inc({ "stats.coursesCreated": 1 }) // Incrementa contador de cursos criados
      .commit();
      
    return true;
  } catch (error) {
    console.error("❌ Erro ao consumir crédito:", error.message);
    return false;
  }
};

/**
 * 4. Reembolsa o crédito em caso de falha crítica na IA ou Imagem.
 */
const refundCredit = async (userId) => {
  try {
    // Devolve 1 crédito e reseta o timestamp para permitir nova tentativa imediata
    await client
      .patch(userId)
      .setIfMissing({ stats: {} })
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