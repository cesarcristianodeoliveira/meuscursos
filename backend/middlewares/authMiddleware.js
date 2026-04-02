const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1. Pega o header de autorização
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  // 2. O formato esperado é "Bearer <TOKEN>"
  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Erro no formato do token.' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token malformatado.' });
  }

  // 3. Verifica o token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    // 4. Injeta o ID do usuário na requisição para os Controllers usarem
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    return next();
  });
};