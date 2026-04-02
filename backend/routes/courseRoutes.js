const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * ROTA DE GERAÇÃO DE CURSO
 * POST /courses/generate
 * Protegida: Apenas usuários logados podem gastar créditos e gerar cursos.
 */
router.post('/generate', authMiddleware, courseController.createCourse);

module.exports = router;