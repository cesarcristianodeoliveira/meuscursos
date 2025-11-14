// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Importar rotas
const fetchRoutes = require('./routes/fetch');
const generateRoutes = require('./routes/generate');
const pixabayRoutes = require('./routes/pixabay');
const providersRoutes = require('./routes/providers');

// Usar rotas
app.use('/api/fetch', fetchRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/pixabay', pixabayRoutes);
app.use('/api/providers', providersRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend Meus Cursos rodando na porta ${PORT}`);
});
