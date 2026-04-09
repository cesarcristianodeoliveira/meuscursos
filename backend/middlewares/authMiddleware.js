const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  // O formato esperado é: "Bearer TOKEN"
  const parts = authHeader.split(' ');

  if (!parts.length === 2) {
    return res.status(401).json({ error: "Erro no token." });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token malformatado." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido ou expirado." });
    }

    // Injeta o ID e dados do usuário na requisição para uso nos controllers
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userPlan = decoded.plan;

    return next();
  });
};