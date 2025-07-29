// D:\meuscursos\backend\middleware\authMiddleware.js
import jwt from 'jsonwebtoken';

// Middleware para proteger rotas (verificar JWT)
export const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Anexa as informações do usuário (id, isAdmin, plan) ao objeto de requisição
            req.user = { 
                id: decoded.id, 
                isAdmin: decoded.isAdmin, 
                plan: decoded.plan 
            }; 
            next();
        } catch (error) {
            console.error('Erro na autenticação do token:', error);
            return res.status(401).json({ message: 'Não autorizado, token inválido ou expirado.' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
    }
};

// Middleware para verificar se o usuário é Admin
export const adminProtect = (req, res, next) => {
    // Verifica se o usuário está autenticado e se possui a flag isAdmin
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
    }
    next();
};
