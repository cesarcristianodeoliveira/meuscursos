const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * ROTAS PÚBLICAS
 * Não precisam de token, pois são o ponto de entrada do usuário.
 */

// Cadastro de novo usuário (Gera o objeto stats v1.3)
router.post('/register', authController.register);

// Login de usuário (Retorna o token e os dados de XP/Nível)
router.post('/login', authController.login);

/**
 * ROTAS PROTEGIDAS
 * Exigem o cabeçalho 'Authorization: Bearer <token>'
 */

// Valida a sessão atual e retorna os dados do usuário logado
// Essencial para o AuthContext.js no Frontend (Zero Pisca)
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;