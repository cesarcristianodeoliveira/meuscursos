// D:\meuscursos\backend\routes\aiModelRoutes.js

import express from 'express';
import { getAvailableAIModels } from '../controllers/aiModelController.js';
import { protect } from '../middleware/authMiddleware.js'; // Assumindo que você tem um middleware de autenticação

const router = express.Router();

// Rota para obter os modelos de IA disponíveis
// Protegida pelo middleware de autenticação 'protect'
router.get('/', protect, getAvailableAIModels);

export default router;
