const client = require('../config/sanity');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { formatSlug } = require('../utils/formatter');

/**
 * REGISTRO DE USUÁRIO
 * Cria o perfil com suporte a Gamificação e Slugs únicos.
 */
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Preencha todos os campos corretamente." });
    }

    // Verifica se o e-mail já existe
    const userExists = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });
    if (userExists) {
      return res.status(400).json({ error: "Este e-mail já está em uso." });
    }

    // Criptografia e Slug único (Nome + sufixo aleatório para evitar duplicatas)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userSlug = `${formatSlug(name)}-${Math.random().toString(36).substring(2, 6)}`;

    // Montagem do documento seguindo o Schema v1.3
    const newUser = {
      _type: 'user',
      name,
      email,
      password: hashedPassword,
      slug: { _type: 'slug', current: userSlug },
      role: 'user', 
      credits: 1, // Crédito inicial para o primeiro curso
      stats: {
        totalXp: 0,
        level: 1,
        coursesCreated: 0,
        coursesCompleted: 0,
        lastLogin: new Date().toISOString()
      },
      achievements: []
    };

    const result = await client.create(newUser);

    const token = jwt.sign(
      { id: result._id, role: result.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result._id,
        name: result.name,
        email: result.email,
        role: result.role,
        slug: result.slug.current,
        stats: result.stats
      }
    });

  } catch (error) {
    console.error("❌ Erro no Registro:", error.message);
    res.status(500).json({ error: "Erro interno ao criar conta." });
  }
};

/**
 * LOGIN DE USUÁRIO
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });

    if (!user) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    // Atualiza o timestamp de login silenciosamente
    await client.patch(user._id).set({ "stats.lastLogin": new Date().toISOString() }).commit();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        slug: user.slug?.current,
        stats: user.stats
      }
    });

  } catch (error) {
    console.error("❌ Erro no Login:", error.message);
    res.status(500).json({ error: "Erro interno ao realizar login." });
  }
};

/**
 * ROTA /ME (Sessão)
 * Essencial para o "Zero Pisca" do Frontend
 */
const getMe = async (req, res) => {
  try {
    const user = await client.fetch(`*[_id == $id][0]`, { id: req.userId });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      slug: user.slug?.current,
      stats: user.stats
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao validar sessão." });
  }
};

module.exports = { register, login, getMe };