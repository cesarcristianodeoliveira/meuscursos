const client = require('../config/sanity');

/**
 * SERVIÇO DE COTAS, CRÉDITOS E PROGRESSO (QuotaService) v1.2.0
 * Gestão de economia, proteção contra abusos e lógica de Level Up.
 */

/**
 * 1. Verifica permissão de geração
 */
const checkUserQuota = async (userId, requestedLevel = 'iniciante') => {
  try {
    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        role, 
        credits, 
        "lastGenerationAt": stats.lastGenerationAt
      }`, 
      { userId }
    );

    if (!user) return { canGenerate: false, reason: "Usuário não encontrado." };
    if (user.role === 'admin') return { canGenerate: true };

    // Bloqueio de Nível Avançado para quem não tem créditos (PRO)
    if ((user.credits || 0) <= 0 && requestedLevel !== 'iniciante') {
      return { 
        canGenerate: false, 
        reason: "Níveis avançados são exclusivos para membros PRO." 
      };
    }

    const globalCheck = await checkGlobalQuota();
    if (!globalCheck.isOk) {
      return { canGenerate: false, reason: "Sistema em alta demanda. Tente em instantes." };
    }

    // Se tem créditos, gasta o crédito
    if ((user.credits || 0) > 0) return { canGenerate: true };

    // Regra da Hora Gratuita (Cooldown de 60 min)
    const now = new Date();
    const lastGen = user.lastGenerationAt ? new Date(user.lastGenerationAt) : new Date(0);
    const minutesPassed = Math.floor((now - lastGen) / (1000 * 60));
    
    if (minutesPassed >= 60) return { canGenerate: true, isFreeTier: true };

    const timeLeft = 60 - minutesPassed;
    return { 
      canGenerate: false, 
      reason: `Aguarde ${timeLeft} min para a próxima geração gratuita ou adquira créditos.`,
      timeLeft 
    };

  } catch (error) {
    console.error("❌ Erro ao verificar cota:", error.message);
    return { canGenerate: false, reason: "Erro na validação de segurança." };
  }
};

/**
 * 2. Verifica a cota GLOBAL (Evita spam no servidor)
 */
const checkGlobalQuota = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const count = await client.fetch(`count(*[_type == "course" && _createdAt > $oneHourAgo])`, { oneHourAgo });
    const GLOBAL_LIMIT = 50; 
    return { isOk: count < GLOBAL_LIMIT };
  } catch (error) {
    return { isOk: false };
  }
};

/**
 * 3. Consome crédito e atualiza estatísticas
 */
const consumeCredit = async (userId) => {
  try {
    const user = await client.fetch(`*[_id == $userId][0]{credits}`, { userId });

    await client.patch(userId)
      .setIfMissing({ 
        stats: { totalXp: 0, level: 1, coursesCreated: 0, coursesCompleted: 0 }, 
        credits: 0 
      })
      .commit();

    const transaction = client.patch(userId);

    // Só decrementa se o usuário de fato tiver créditos comprados
    if ((user.credits || 0) > 0) {
      transaction.dec({ credits: 1 });
    }

    await transaction
      .set({ "stats.lastGenerationAt": new Date().toISOString() })
      .inc({ "stats.coursesCreated": 1 }) 
      .commit();

    return true;
  } catch (error) {
    console.error("❌ Erro ao consumir crédito:", error.message);
    return false;
  }
};

/**
 * 4. Adiciona XP e calcula Level Up
 */
const addXpReward = async (userId, xpAmount) => {
  try {
    const user = await client.fetch(`*[_id == $userId][0]{ "xp": stats.totalXp, "level": stats.level }`, { userId });
    
    const newXp = (user.xp || 0) + xpAmount;
    // Lógica simples de level: cada 1000 XP = 1 nível
    const newLevel = Math.floor(newXp / 1000) + 1;

    const patch = client.patch(userId)
      .setIfMissing({ stats: { totalXp: 0, level: 1, coursesCompleted: 0 } })
      .set({ 
        "stats.totalXp": newXp,
        "stats.level": newLevel
      })
      .inc({ "stats.coursesCompleted": 1 });

    await patch.commit();
    return { success: true, newXp, newLevel };
  } catch (error) {
    console.error("❌ Erro ao processar recompensa:", error.message);
    return false;
  }
};

/**
 * 5. Reembolsa em caso de falha crítica
 */
const refundCredit = async (userId) => {
  try {
    const user = await client.fetch(`*[_id == $userId][0]{credits}`, { userId });
    if (!user) return false;

    const patch = client.patch(userId);
    if (user.credits !== undefined) patch.inc({ credits: 1 });
    
    await patch
      .dec({ "stats.coursesCreated": 1 })
      .commit();

    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  checkUserQuota,
  consumeCredit,
  addXpReward,
  refundCredit
};