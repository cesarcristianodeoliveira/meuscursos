const express = require('express');
const cors = require('cors');
const { generateCourse } = require('./controllers/courseController');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN
}));
app.use(express.json());

// Rotas
app.post('/generate-course', generateCourse);

// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Motor de Cursos Master rodando em modo modularizado na porta ${PORT}`);
});