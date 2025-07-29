// D:\meuscursos\backend\routes\authRoutes.js
import express from 'express';
import { register, login } from '../controllers/authController.js'; // Importa as funções do controlador de autenticação

const router = express.Router();

// Rota para registro de usuário
router.post('/register', register);

// Rota para login de usuário
router.post('/login', login);

export default router; // Exporta o router para ser usado no server.js
