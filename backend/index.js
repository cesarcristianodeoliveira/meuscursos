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
app.use('/auth', authRoutes);         // Login, Registro, /Me
app.use('/courses', courseRoutes);    // Geração, Listagem, Detalhes
app.use('/status', statusRoutes);      // Gamificação e Estatísticas

// Health Check
app.get('/', (req, res) => res.send('API MeusCursos v1.3 - Online 🚀'));

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