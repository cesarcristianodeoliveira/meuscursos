const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * --- ROTAS PÚBLICAS ---
 */

// Vitrine principal (Home)
router.get('/all', courseController.getAllCourses);

// Página de detalhes (Antes da matrícula/login)
router.get('/public/:slug', courseController.getCourseBySlug);

/**
 * --- ROTAS PRIVADAS ---
 */

// Geração de curso com o Motor LXD v3.0.0
router.post('/generate', authMiddleware, courseController.createCourse);

// Dashboard do Aluno/Autor
router.get('/my-courses', authMiddleware, courseController.getUserCourses);

// Ambiente de estudo (Conteúdo protegido)
router.get('/study/:slug', authMiddleware, courseController.getCourseBySlug);

/**
 * --- PROGRESSO E GAMIFICAÇÃO ---
 */

// Gerenciamento de progresso por ID de documento
router.get('/:id/progress', authMiddleware, courseController.getProgress);
router.post('/:id/progress', authMiddleware, courseController.saveProgress);

// Registro de prova final e gatilho de XP
router.post('/:id/quiz-result', authMiddleware, courseController.saveQuizProgress);

module.exports = router;