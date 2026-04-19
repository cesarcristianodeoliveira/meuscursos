const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * --- ROTAS PÚBLICAS ---
 * Acessíveis sem token para Landing Pages e SEO.
 */

// Busca detalhes do curso para quem ainda não logou
router.get('/public/:slug', courseController.getCourseBySlug);


/**
 * --- ROTAS PRIVADAS (Requerem Login) ---
 * Todas as rotas abaixo utilizam o authMiddleware.
 */

// Geração de curso via IA e listagem do autor
router.post('/generate', authMiddleware, courseController.createCourse);
router.get('/my-courses', authMiddleware, courseController.getUserCourses);

// Detalhes completos do curso para o ambiente de estudo
router.get('/:id', authMiddleware, courseController.getCourseById);

/**
 * --- PERSISTÊNCIA DE PROGRESSO E GAMIFICAÇÃO ---
 */

// Busca o progresso (Aulas concluídas, notas e status)
router.get('/:id/progress', authMiddleware, courseController.getProgress);

// Salva a conclusão de uma aula individual
router.post('/:id/progress', authMiddleware, courseController.saveProgress);

/**
 * ADICIONADO: Persistência do Quiz
 * Salva a nota final e pode marcar o curso como concluído no Sanity
 */
router.post('/:id/quiz-result', authMiddleware, courseController.saveQuizProgress);


module.exports = router;