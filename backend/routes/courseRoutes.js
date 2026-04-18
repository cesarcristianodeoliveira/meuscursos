const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * --- ROTAS PÚBLICAS ---
 * Visitantes podem ver a lista de cursos e os detalhes básicos (Landing Page)
 */

// GET /api/courses/:slug -> Detalhes públicos do curso pelo Slug
// Note: Não usa authMiddleware para permitir visualização por visitantes
router.get('/public/:slug', courseController.getCourseBySlug);

/**
 * --- ROTAS PRIVADAS (Requerem Login) ---
 */

// POST /api/courses/generate -> Gerar novo curso via IA
router.post('/generate', authMiddleware, courseController.createCourse);

// GET /api/courses/my-courses -> Listagem de cursos do usuário logado
router.get('/my-courses', authMiddleware, courseController.getUserCourses);

/**
 * ROTA DE PROGRESSO E ESTUDO
 * Usamos o ID do curso (ou matrícula) para interações de aluno
 */

// GET /api/courses/:id/progress -> Busca o progresso atual do aluno
router.get('/:id/progress', authMiddleware, courseController.getProgress);

// POST /api/courses/:id/progress -> Marca/Desmarca aula como concluída
router.post('/:id/progress', authMiddleware, courseController.saveProgress);

/**
 * ROTA DE DETALHES COMPLETA (Dashboard)
 * GET /api/courses/:id -> Carrega dados completos para o aluno matriculado
 */
router.get('/:id', authMiddleware, courseController.getCourseById);

module.exports = router;