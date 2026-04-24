const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Verifica se o secret existe no ambiente para evitar erros fatais
  if (!process.env.JWT_SECRET) {
    console.error("ERRO CRÍTICO: JWT_SECRET não definido nas variáveis de ambiente.");
    return res.status(500).json({ success: false, error: "Erro interno de configuração." });
  }

  // 2. Verifica se o header existe
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Acesso negado. Token não fornecido." });
  }

  // 3. Verifica o formato: "Bearer TOKEN"
  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ success: false, error: "Erro no formato do token." });
  }

  const [scheme, token] = parts;

  // Verifica se a primeira parte é "Bearer"
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ success: false, error: "Token malformatado. Use o prefixo Bearer." });
  }

  // 4. Validação do JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // Diferencia erro de expiração de erro de assinatura (opcional, mas bom para UX)
      const message = err.name === 'TokenExpiredError' 
        ? "Sessão expirada. Faça login novamente." 
        : "Token inválido ou corrompido.";

      return res.status(401).json({ 
        success: false, 
        error: message 
      });
    }

    /**
     * Injeta os dados decodificados na requisição.
     * Certificamos que o ID está presente para evitar o erro de "Usuário não encontrado"
     */
    if (!decoded.id && !decoded._id) {
      return res.status(401).json({ success: false, error: "Payload do token inválido." });
    }

    req.userId = decoded.id || decoded._id;
    req.userRole = decoded.role || 'user';
    req.userPlan = decoded.plan || 'free';

    return next();
  });
};