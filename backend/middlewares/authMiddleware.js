const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Verifica se o header existe
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Token não fornecido." });
  }

  // 2. O formato esperado é: "Bearer TOKEN"
  const parts = authHeader.split(' ');

  // Corrigido: Verifica se existem exatamente duas partes (Bearer e o Token)
  if (parts.length !== 2) {
    return res.status(401).json({ success: false, error: "Erro no formato do token." });
  }

  const [scheme, token] = parts;

  // 3. Verifica se a primeira parte é "Bearer" (case-insensitive)
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ success: false, error: "Token malformatado." });
  }

  // 4. Validação do JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        success: false, 
        error: "Sessão expirada ou token inválido. Faça login novamente." 
      });
    }

    /**
     * Injeta os dados do payload do token na requisição.
     * Importante: Usamos 'id' aqui porque foi assim que assinamos no authController.
     */
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userPlan = decoded.plan;

    return next();
  });
};