require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importação das Rotas
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const statusRoutes = require('./routes/statusRoutes');

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Definição dos Endpoints
app.use('/auth', authRoutes);         // Publico e Privado (Login, Registro, /Me)
app.use('/courses', courseRoutes);    // Privado (Geração, Listagem)
app.use('/status', statusRoutes);     // Privado (Gamificação e Estatísticas)

// Health Check
app.get('/', (req, res) => res.send('API MeusCursos v1.3 - Online 🚀'));

// Middleware para capturar rotas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.originalUrl} não encontrada.` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ==========================================
    🚀 SERVIDOR RODANDO NA PORTA ${PORT}
    🛠️  SANITY PROJECT: ${process.env.SANITY_PROJECT_ID}
    🧠 AI PROVIDER: Groq (Llama 3.3)
  ==========================================
  `);
});