const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * --- ROTAS PÚBLICAS ---
 * Acessíveis por visitantes e indexadores de busca.
 */

// Lista todos os cursos para a vitrine (Home)
// Adicionada para evitar erros de referência e alimentar a página principal
router.get('/all', courseController.getAllCourses);

// Busca detalhes do curso pelo slug para a página de vendas/detalhes
router.get('/public/:slug', courseController.getCourseBySlug);

/**
 * --- ROTAS PRIVADAS (Requerem Autenticação) ---
 */

// Geração de novo curso via IA
router.post('/generate', authMiddleware, courseController.createCourse);

// Lista os cursos que o próprio usuário criou/está vinculado
router.get('/my-courses', authMiddleware, courseController.getUserCourses);

// Ambiente de estudo (Busca dados completos do curso para o aluno)
router.get('/study/:slug', authMiddleware, courseController.getCourseBySlug);

/**
 * --- PROGRESSO E GAMIFICAÇÃO ---
 */

// Busca o progresso (Aulas concluídas, notas e status)
router.get('/:id/progress', authMiddleware, courseController.getProgress);

// Salva progresso de leitura (Marcar/Desmarcar aula como concluída)
router.post('/:id/progress', authMiddleware, courseController.saveProgress);

// Registra resultado de Quiz e Exame Final (Gatilha ganho de XP e Certificado)
router.post('/:id/quiz-result', authMiddleware, courseController.saveQuizProgress);

module.exports = router;