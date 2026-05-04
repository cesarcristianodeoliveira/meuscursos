const client = require('../config/sanity');

/**
 * SERVIÇO DE COTAS, CRÉDITOS E PROGRESSO (QuotaService) v1.1.0
 * Gestão de economia do app, proteção contra abusos e evolução de nível.
 */

/**
 * 1. Verifica permissão de geração (Individual + Global + Nível)
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

    // Bloqueio de Nível PRO
    if ((user.credits || 0) <= 0 && requestedLevel !== 'iniciante') {
      return { 
        canGenerate: false, 
        reason: "O nível intermediário/avançado é exclusivo para usuários PRO." 
      };
    }

    const globalCheck = await checkGlobalQuota();
    if (!globalCheck.isOk) {
      return { canGenerate: false, reason: "Sistema sobrecarregado. Tente em instantes." };
    }

    if ((user.credits || 0) > 0) return { canGenerate: true };

    // Regra da Hora Gratuita
    const now = new Date();
    const lastGen = user.lastGenerationAt ? new Date(user.lastGenerationAt) : new Date(0);
    const minutesPassed = Math.floor((now - lastGen) / (1000 * 60));
    
    if (minutesPassed >= 60) return { canGenerate: true, isFreeTier: true };

    const timeLeft = 60 - minutesPassed;
    return { 
      canGenerate: false, 
      reason: `Próximo acesso gratuito em ${timeLeft} minutos.`,
      timeLeft 
    };

  } catch (error) {
    console.error("❌ Erro ao verificar cota:", error.message);
    return { canGenerate: false, reason: "Falha na validação de segurança." };
  }
};

/**
 * 2. Verifica a cota GLOBAL
 */
const checkGlobalQuota = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const query = `count(*[_type == "course" && _createdAt > $oneHourAgo])`;
    const count = await client.fetch(query, { oneHourAgo });

    const GLOBAL_LIMIT = 30; 
    return { availableSlots: GLOBAL_LIMIT - count, isOk: count < GLOBAL_LIMIT };
  } catch (error) {
    return { isOk: false };
  }
};

/**
 * 3. Consome o crédito e inicializa Stats com segurança
 */
const consumeCredit = async (userId) => {
  try {
    const user = await client.fetch(`*[_id == $userId][0]{credits}`, { userId });

    // Patch inicial: Garante que o objeto stats e campos base existam
    await client.patch(userId)
      .setIfMissing({ 
        stats: { totalXp: 0, level: 1, coursesCreated: 0, coursesCompleted: 0 }, 
        credits: 0 
      })
      .commit();

    const transaction = client.patch(userId);

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
 * 4. Adiciona XP e completa curso (ESSENCIAL PARA O GAME)
 * Corrige o erro de gravação de XP no objeto aninhado.
 */
const addXpReward = async (userId, xpAmount) => {
  try {
    // Garante que o caminho stats.totalXp exista antes de incrementar
    await client.patch(userId)
      .setIfMissing({ "stats.totalXp": 0, "stats.coursesCompleted": 0 })
      .inc({ 
        "stats.totalXp": xpAmount,
        "stats.coursesCompleted": 1 
      })
      .commit();
    
    console.log(`⭐ ${xpAmount} XP adicionado ao usuário ${userId}`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao gravar progresso:", error.message);
    return false;
  }
};

/**
 * 5. Reembolsa o usuário em caso de erro na IA
 */
const refundCredit = async (userId) => {
  try {
    const user = await client.fetch(`*[_id == $userId][0]{credits}`, { userId });
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    const patch = client.patch(userId);

    if ((user.credits || 0) > 0) {
      patch.inc({ credits: 1 });
    }

    await patch
      .set({ "stats.lastGenerationAt": oneHourAgo })
      .dec({ "stats.coursesCreated": 1 })
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
  addXpReward, // Novo método para seu sistema de níveis
  refundCredit
};