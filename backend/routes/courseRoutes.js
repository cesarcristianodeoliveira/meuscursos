const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * --- ROTAS PÚBLICAS ---
 * Focadas em SEO e Landing Pages de cursos.
 */

// Busca detalhes do curso pelo slug (Acessível sem token)
router.get('/public/:slug', courseController.getCourseBySlug);

/**
 * --- ROTAS PRIVADAS (Requerem Autenticação) ---
 * O authMiddleware injeta o 'userId' no objeto 'req' para uso no Controller.
 */

// Geração de novo curso via IA
// Protegido por cota no Service e Token no Middleware
router.post('/generate', authMiddleware, courseController.createCourse);

// Lista os cursos do usuário logado (Painel / Dashboard)
router.get('/my-courses', authMiddleware, courseController.getUserCourses);

// Ambiente de estudo (Busca dados completos para o aluno logado)
router.get('/study/:slug', authMiddleware, courseController.getCourseBySlug);

/**
 * --- PROGRESSO E GAMIFICAÇÃO ---
 * Gerenciamento de Matrículas e Conquistas de XP.
 */

// Busca o progresso (Aulas concluídas, notas e status)
router.get('/:id/progress', authMiddleware, courseController.getProgress);

// Salva progresso de leitura (Marcar/Desmarcar conclusão)
router.post('/:id/progress', authMiddleware, courseController.saveProgress);

// Registra resultado de Quiz e Exame Final (Gatilha ganho de XP)
router.post('/:id/quiz-result', authMiddleware, courseController.saveQuizProgress);

module.exports = router;