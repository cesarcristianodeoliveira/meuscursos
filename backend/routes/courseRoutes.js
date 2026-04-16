const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * ROTA DE GERAÇÃO DE CURSO
 * POST /courses/generate
 */
router.post('/generate', authMiddleware, courseController.createCourse);

/**
 * ROTA DE LISTAGEM (Meus Cursos)
 * GET /courses/my-courses
 */
router.get('/my-courses', authMiddleware, courseController.getUserCourses);

/**
 * ROTA DE PROGRESSO (Aulas concluídas)
 * GET /courses/:id/progress -> Busca o progresso atual
 * POST /courses/:id/progress -> Marca/Desmarca aula como concluída
 */
router.get('/:id/progress', authMiddleware, courseController.getProgress);
router.post('/:id/progress', authMiddleware, courseController.saveProgress);

/**
 * ROTA DE DETALHES
 * GET /courses/:id
 * Nota: Certifique-se de que getCourseById existe no Controller 
 * ou use getProgress se o objetivo for apenas carregar dados do curso.
 */
router.get('/:id', authMiddleware, courseController.getProgress);

module.exports = router;