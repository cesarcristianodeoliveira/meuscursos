const client = require('../config/sanity');

/**
 * SERVIÇO DE COTAS E CRÉDITOS (QuotaService) v1.0.0-rc1
 * Proteção contra abusos, gestão de créditos Pro e suporte a níveis.
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

    // A. ADMIN: Acesso total e irrestrito
    if (user.role === 'admin') return { canGenerate: true };

    // B. Bloqueio de Nível (Exemplo de Regra de Negócio para Cursos Livres)
    // Usuários sem créditos (Free Tier) só podem gerar cursos 'iniciante'
    if (user.credits <= 0 && requestedLevel !== 'iniciante') {
      return { 
        canGenerate: false, 
        reason: "O nível intermediário/avançado é exclusivo para usuários PRO. Adquira créditos para continuar." 
      };
    }

    // C. Proteção Global (Evita queima de orçamento da API em caso de ataque)
    const globalCheck = await checkGlobalQuota();
    if (!globalCheck.isOk) {
      return { 
        canGenerate: false, 
        reason: "O sistema atingiu o limite de tráfego momentâneo. Tente novamente em instantes." 
      };
    }

    // D. Verificação de Créditos Pagos
    if (user.credits > 0) return { canGenerate: true };

    // E. Regra da Hora Gratuita (Micro-learning orgânico)
    const now = new Date();
    const lastGen = user.lastGenerationAt ? new Date(user.lastGenerationAt) : new Date(0);
    const msPassed = now - lastGen;
    const minutesPassed = Math.floor(msPassed / (1000 * 60));
    
    if (minutesPassed >= 60) {
      return { canGenerate: true, isFreeTier: true };
    }

    // Retorno amigável com tempo de espera
    const timeLeft = 60 - minutesPassed;
    return { 
      canGenerate: false, 
      reason: `Você já gerou um curso recentemente. Seu próximo acesso gratuito será em ${timeLeft} minutos.`,
      timeLeft 
    };

  } catch (error) {
    console.error("❌ Erro ao verificar cota:", error.message);
    return { canGenerate: false, reason: "Falha na validação de segurança." };
  }
};

/**
 * 2. Verifica a cota GLOBAL (Monitoramento de custos operacionais)
 */
const checkGlobalQuota = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const query = `count(*[_type == "course" && _createdAt > $oneHourAgo])`;
    const coursesInLastHour = await client.fetch(query, { oneHourAgo });

    const GLOBAL_LIMIT = 30; // Ajustado para segurança inicial
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
 * 3. Consome o crédito ou atualiza o timestamp da hora gratuita
 */
const consumeCredit = async (userId) => {
  try {
    // Buscamos o estado atual do crédito antes de agir
    const user = await client.fetch(`*[_id == $userId][0]{credits}`, { userId });

    const patch = client.patch(userId).setIfMissing({ stats: {}, credits: 0 });

    // Se o usuário tinha créditos, remove 1. Se era a hora gratuita, créditos continuam 0.
    if (user.credits > 0) {
      patch.dec({ credits: 1 });
    }

    await patch
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
 * 4. Reembolsa o usuário (Essencial para falhas de imagem/IA)
 */
const refundCredit = async (userId) => {
  try {
    const user = await client.fetch(`*[_id == $userId][0]{credits}`, { userId });
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    const patch = client.patch(userId).setIfMissing({ stats: {}, credits: 0 });

    // Se o usuário já tinha créditos, ele recebe o ponto de volta.
    // Se era Free Tier, voltamos o relógio para ele tentar de novo agora.
    if (user.credits > 0) {
      patch.inc({ credits: 1 });
    }

    await patch
      .set({ "stats.lastGenerationAt": oneHourAgo })
      .dec({ "stats.coursesCreated": 1 }) // Remove da contagem de sucesso
      .commit();

    console.log(`♻️ Crédito/Tempo estornado para o usuário: ${userId}`);
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