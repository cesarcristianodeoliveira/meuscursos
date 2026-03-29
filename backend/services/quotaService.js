const client = require('../config/sanity');

// Configurações de Limite (Mova para o .env futuramente)
const GLOBAL_HOURLY_TOKEN_LIMIT = 100000;
const TOKENS_PER_COURSE_ESTIMATE = 6500;

const checkGlobalQuota = async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  // Query otimizada: busca tokens de cursos gerados na última hora
  const query = `*[_type == "course" && stats.generatedAt > $oneHourAgo && defined(stats.totalTokens)].stats.totalTokens`;
  const tokensArray = await client.fetch(query, { oneHourAgo });

  const usedTokens = (tokensArray || []).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const remainingTokens = Math.max(0, GLOBAL_HOURLY_TOKEN_LIMIT - usedTokens);
  
  return {
    used: usedTokens,
    remaining: remainingTokens,
    availableSlots: Math.floor(remainingTokens / TOKENS_PER_COURSE_ESTIMATE)
  };
};

/**
 * Verifica se um usuário específico pode gerar um curso agora
 * (Limite de 1 por hora para Free/Não Logado)
 */
const checkUserQuota = async (userId) => {
  if (!userId) return { canGenerate: true }; // Se for teste sem login, permitimos (ou bloqueamos conforme sua regra)

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  // Verifica se o usuário gerou algo na última hora
  const query = `*[_type == "course" && author._ref == $userId && stats.generatedAt > $oneHourAgo][0]`;
  const lastCourse = await client.fetch(query, { userId, oneHourAgo });

  return {
    canGenerate: !lastCourse,
    nextAvailable: lastCourse ? new Date(new Date(lastCourse.stats.generatedAt).getTime() + 60 * 60 * 1000) : null
  };
};

module.exports = { checkGlobalQuota, checkUserQuota };