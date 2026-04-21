const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * --- ROTAS PÚBLICAS ---
 * Acessíveis para SEO, compartilhamento e visualização pré-venda.
 */

// Busca detalhes do curso pelo slug (independente de login)
router.get('/public/:slug', courseController.getCourseBySlug);

/**
 * --- ROTAS PRIVADAS (Requerem Login) ---
 * O authMiddleware garante que o req.userId esteja disponível no Controller.
 */

// Geração de novo curso via IA
router.post('/generate', authMiddleware, courseController.createCourse);

// Lista os cursos gerados pelo próprio usuário logado
router.get('/my-courses', authMiddleware, courseController.getUserCourses);

// Busca detalhes do curso para o ambiente de estudo (usando slug para consistência de URL)
router.get('/study/:slug', authMiddleware, courseController.getCourseBySlug);

/**
 * --- PROGRESSO E GAMIFICAÇÃO ---
 */

// Busca o progresso do usuário no curso (aulas concluídas e notas)
// Aqui usamos o ID do documento do Sanity para facilitar a query de matrícula
router.get('/:id/progress', authMiddleware, courseController.getProgress);

// Salva o progresso de uma aula (marcar como concluída ou desmarcar)
router.post('/:id/progress', authMiddleware, courseController.saveProgress);

// Salva o resultado de quizzes (módulos ou exame final)
router.post('/:id/quiz-result', authMiddleware, courseController.saveQuizProgress);

module.exports = router;