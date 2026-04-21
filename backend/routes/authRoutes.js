const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * ROTAS DE AUTENTICAÇÃO v1.4
 * Gerencia o ciclo de vida do usuário, segurança de sessão e sincronização de créditos.
 */

/**
 * --- ACESSO PÚBLICO ---
 */

// [POST] /api/auth/register
// Cria o documento do usuário no Sanity e inicializa stats/créditos.
router.post('/register', authController.register);

// [POST] /api/auth/login
// Valida credenciais e retorna o JWT (JSON Web Token).
router.post('/login', authController.login);


/**
 * --- ACESSO PROTEGIDO ---
 * Requer Header: Authorization: Bearer <token>
 */

// [GET] /api/auth/me
// Rota fundamental para o Frontend (React AuthContext).
// Além de validar o token, o controller deve sincronizar o progresso e 
// verificar se o tempo de recarga de 1h da cota gratuita já expirou.
router.get('/me', authMiddleware, authController.getMe);

// [PUT] /api/auth/update-profile
// (Opcional) Para atualizar nome, avatar ou preferência de newsletter.
// router.put('/update', authMiddleware, authController.updateProfile);

module.exports = router;