const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * ROTAS DE AUTENTICAÇÃO - v1.3
 * Gerencia ciclo de vida do usuário e integridade de créditos.
 */

// [POST] /api/auth/register
// Cria o usuário com lastGenerationAt antigo para permitir uso imediato.
router.post('/register', authController.register);

// [POST] /api/auth/login
// Realiza o login e verifica se o crédito de 1h deve ser resetado.
router.post('/login', authController.login);

/**
 * ROTAS PROTEGIDAS
 * Necessitam do Bearer Token no Header.
 */

// [GET] /api/auth/me
// Vital para o AuthContext: valida a sessão e atualiza créditos/stats silenciosamente.
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;