const client = require('../config/sanity');

/**
 * SERVIÇO DE COTAS E CRÉDITOS (QuotaService) v1.4
 * Gerencia limites de usuários, proteção contra spam e custos de API.
 */

/**
 * 1. Verifica permissão de geração (Individual + Global)
 */
const checkUserQuota = async (userId) => {
  try {
    // Busca dados essenciais do usuário
    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        role, 
        credits, 
        "lastGenerationAt": stats.lastGenerationAt
      }`, 
      { userId }
    );

    if (!user) return { canGenerate: false, reason: "Usuário não encontrado." };

    // A. Regra para ADMIN: Sempre liberado
    if (user.role === 'admin') return { canGenerate: true };

    // B. Verificação de Segurança Global (Evita gastos excessivos na API Groq/Pixabay)
    const globalCheck = await checkGlobalQuota();
    if (!globalCheck.isOk) {
      return { 
        canGenerate: false, 
        reason: "O sistema está sob alta carga. Tente novamente em alguns minutos." 
      };
    }

    // C. Se tem créditos comprados/acumulados (> 0), libera.
    if (user.credits > 0) return { canGenerate: true };

    // D. Lógica de Recarga Automática (1 crédito gratuito por hora)
    const now = new Date();
    const lastGen = user.lastGenerationAt ? new Date(user.lastGenerationAt) : new Date(0);
    
    const msPassed = now - lastGen;
    const minutesPassed = Math.floor(msPassed / (1000 * 60));
    
    if (minutesPassed >= 60) {
      return { canGenerate: true, isFreeTier: true };
    }

    // Caso contrário, bloqueia e informa o tempo restante
    const timeLeft = 60 - minutesPassed;
    return { 
      canGenerate: false, 
      reason: `Limite atingido. Seu próximo curso gratuito estará disponível em ${timeLeft} minutos.`,
      timeLeft 
    };

  } catch (error) {
    console.error("❌ Erro ao verificar cota:", error.message);
    return { canGenerate: false, reason: "Erro ao validar seus créditos." };
  }
};

/**
 * 2. Verifica a cota GLOBAL (Proteção de custos)
 */
const checkGlobalQuota = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    // Conta cursos criados globalmente na última hora
    const query = `count(*[_type == "course" && _createdAt > $oneHourAgo])`;
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
 * 3. Consome o crédito com proteção contra concorrência
 */
const consumeCredit = async (userId) => {
  try {
    const user = await client.fetch(`*[_id == $userId][0]{credits}`, { userId });

    // Só decrementa se o usuário tiver créditos. 
    // Se ele estava usando a "hora gratuita" (créditos = 0), apenas atualizamos o timestamp.
    const patch = client.patch(userId).setIfMissing({ stats: {} });

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
 * 4. Reembolsa em caso de erro na geração da IA/Imagem
 */
const refundCredit = async (userId) => {
  try {
    // Movemos o timestamp para 1 hora atrás para liberar a geração gratuita novamente
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    await client
      .patch(userId)
      .setIfMissing({ stats: {} })
      .inc({ credits: 1 })
      .set({ "stats.lastGenerationAt": oneHourAgo })
      .commit();

    console.log(`♻️ Crédito reembolsado para o usuário ${userId}`);
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