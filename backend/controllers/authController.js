const client = require('../config/sanity');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { formatSlug } = require('../utils/formatter');

/**
 * Verifica e recupera créditos (1 por hora para usuários Free)
 */
const checkAndResetCredits = async (user) => {
  if (user.plan === 'pro' || (user.credits || 0) > 0) return user;

  const lastGen = new Date(user.stats?.lastGenerationAt || 0);
  const now = new Date();
  const diffInHours = (now - lastGen) / (1000 * 60 * 60);

  if (diffInHours >= 1) {
    // Atualização atômica direto no banco
    const updatedUser = await client
      .patch(user._id)
      .set({ credits: 1 })
      .commit();
    return updatedUser;
  }
  return user;
};

/**
 * Registro de Usuário com inicialização de Stats
 */
const register = async (req, res) => {
  const { name, email, password, newsletter } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    const userExists = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });
    if (userExists) return res.status(400).json({ error: "E-mail já cadastrado." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const baseSlug = formatSlug(name);
    
    const newUser = {
      _type: 'user',
      name,
      email,
      password: hashedPassword,
      slug: { _type: 'slug', current: `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}` },
      role: 'user',
      plan: 'free',
      credits: 1,
      newsletter: !!newsletter,
      stats: {
        totalXp: 0,
        level: 1,
        coursesCreated: 0,
        coursesCompleted: 0,
        lastLogin: new Date().toISOString(),
        lastGenerationAt: new Date(Date.now() - 3600000).toISOString()
      }
    };

    const userCreated = await client.create(newUser);

    const token = jwt.sign(
      { id: userCreated._id, role: userCreated.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: { _id: userCreated._id, name, email, credits: 1, stats: newUser.stats }
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar conta." });
  }
};

/**
 * Login com renovação automática de sessão
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    user = await checkAndResetCredits(user);

    await client.patch(user._id)
      .setIfMissing({ stats: { totalXp: 0, level: 1 } })
      .set({ "stats.lastLogin": new Date().toISOString() })
      .commit();

    const token = jwt.sign(
      { id: user._id, role: user.role, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        stats: user.stats,
        plan: user.plan
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Erro no login." });
  }
};

const getMe = async (req, res) => {
  try {
    let user = await client.fetch(`*[_id == $id][0]`, { id: req.userId });
    if (!user) return res.status(404).json({ error: "Sessão expirada." });

    user = await checkAndResetCredits(user);

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        credits: user.credits,
        stats: user.stats || { totalXp: 0, level: 1 },
        plan: user.plan
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Erro na sessão." });
  }
};

module.exports = { register, login, getMe };