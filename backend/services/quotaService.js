const client = require('../config/sanity');

/**
 * SERVIÇO DE COTAS E GAMIFICAÇÃO v1.3.0 - Edição Lançamento
 */

const checkUserQuota = async (userId, requestedLevel = 'iniciante') => {
  try {
    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        role, credits, "lastGenerationAt": stats.lastGenerationAt
      }`, { userId }
    );

    if (!user) return { canGenerate: false, reason: "Usuário não encontrado." };
    if (user.role === 'admin') return { canGenerate: true };

    // Bloqueio PRO para níveis avançados
    if ((user.credits || 0) <= 0 && requestedLevel !== 'iniciante') {
      return { canGenerate: false, reason: "Níveis avançados são exclusivos para membros PRO." };
    }

    const globalCheck = await checkGlobalQuota();
    if (!globalCheck.isOk) return { canGenerate: false, reason: "Sistema em alta demanda. Tente em instantes." };

    if ((user.credits || 0) > 0) return { canGenerate: true };

    // Regra da Hora Gratuita (Cooldown 60 min)
    const minutesPassed = Math.floor((new Date() - new Date(user.lastGenerationAt || 0)) / 60000);
    if (minutesPassed >= 60) return { canGenerate: true, isFreeTier: true };

    return { 
      canGenerate: false, 
      reason: `Aguarde ${60 - minutesPassed} min para a próxima geração gratuita.`,
      timeLeft: 60 - minutesPassed 
    };
  } catch (error) {
    return { canGenerate: false, reason: "Erro na validação de segurança." };
  }
};

const checkGlobalQuota = async () => {
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const count = await client.fetch(`count(*[_type == "course" && _createdAt > $oneHourAgo])`, { oneHourAgo });
  return { isOk: count < 100 }; // Aumentado para 100 no lançamento
};

const consumeCredit = async (userId) => {
  try {
    const user = await client.fetch(`*[_id == $userId][0]{credits}`, { userId });
    const transaction = client.patch(userId).setIfMissing({ 
      stats: { totalXp: 0, level: 1, coursesCreated: 0, coursesCompleted: 0 } 
    });

    if ((user?.credits || 0) > 0) transaction.dec({ credits: 1 });

    await transaction
      .set({ "stats.lastGenerationAt": new Date().toISOString() })
      .inc({ "stats.coursesCreated": 1 })
      .commit();
    return true;
  } catch (error) {
    return false;
  }
};

const addXpReward = async (userId, courseId, xpAmount) => {
  try {
    // PROTEÇÃO: Verifica se o usuário já completou este curso específico
    const alreadyAwarded = await client.fetch(
      `*[_type == "enrollment" && user._ref == $userId && course._ref == $courseId][0].isXpAwarded`,
      { userId, courseId }
    );

    if (alreadyAwarded) return { success: false, message: "XP já resgatado." };

    const user = await client.fetch(`*[_id == $userId][0]{ "xp": stats.totalXp }`, { userId });
    const newXp = (user.xp || 0) + xpAmount;
    const newLevel = Math.floor(newXp / 1000) + 1;

    // Atualiza Usuário e marca a matrícula como "XP Pago"
    await Promise.all([
      client.patch(userId).set({ "stats.totalXp": newXp, "stats.level": newLevel }).inc({ "stats.coursesCompleted": 1 }).commit(),
      client.patch({ query: `*[_type == "enrollment" && user._ref == $userId && course._ref == $courseId][0]` })
            .set({ isXpAwarded: true }).commit()
    ]);

    return { success: true, newXp, newLevel };
  } catch (error) {
    return false;
  }
};

module.exports = { checkUserQuota, consumeCredit, addXpReward };