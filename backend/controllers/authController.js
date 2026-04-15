const client = require('../config/sanity');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { formatSlug } = require('../utils/formatter');

/**
 * FUNÇÃO AUXILIAR: Verifica e reseta créditos baseada no tempo (v1.3)
 * Regra: Se o crédito for 0 e já passou 1 hora desde a última geração, devolve 1 crédito.
 */
const checkAndResetCredits = async (user) => {
  if (user.credits > 0) return user;

  const lastGen = new Date(user.stats?.lastGenerationAt);
  const now = new Date();
  const diffInHours = (now - lastGen) / (1000 * 60 * 60);

  if (diffInHours >= 1) {
    // Atualiza no Sanity e retorna o usuário atualizado
    const updatedUser = await client
      .patch(user._id)
      .set({ credits: 1 })
      .commit();
    console.log(`✅ Crédito resetado para o usuário: ${user.email}`);
    return updatedUser;
  }

  return user;
};

const generateUniqueSlug = async (name) => {
  const baseSlug = formatSlug(name);
  let uniqueSlug = baseSlug;
  let counter = 1;
  let exists = true;

  while (exists) {
    const query = `*[_type == "user" && slug.current == $slug][0]`;
    const user = await client.fetch(query, { slug: uniqueSlug });
    if (!user) {
      exists = false;
    } else {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }
  }
  return uniqueSlug;
};

/**
 * REGISTRO
 */
const register = async (req, res) => {
  const { name, email, password, newsletter } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Preencha todos os campos." });
    }

    const userExists = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });
    if (userExists) {
      return res.status(400).json({ success: false, error: "Este e-mail já está em uso." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const finalSlug = await generateUniqueSlug(name);

    const newUser = {
      _type: 'user',
      name,
      email,
      password: hashedPassword,
      slug: { _type: 'slug', current: finalSlug },
      authProvider: 'credentials',
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
        lastGenerationAt: new Date(Date.now() - 3600000).toISOString() // Registra como "usado há 1 hora" para já começar podendo usar
      }
    };

    const result = await client.create(newUser);

    const token = jwt.sign(
      { id: result._id, role: result.role, plan: result.plan },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: result._id, // Usamos _id para bater com o que o Sanity espera
        name: result.name,
        email: result.email,
        credits: result.credits,
        stats: result.stats
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: "Erro ao criar conta." });
  }
};

/**
 * LOGIN
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });

    if (!user) {
      return res.status(401).json({ success: false, error: "E-mail ou senha inválidos." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "E-mail ou senha inválidos." });
    }

    // Tenta resetar os créditos no login
    user = await checkAndResetCredits(user);

    await client.patch(user._id).set({ "stats.lastLogin": new Date().toISOString() }).commit();

    const token = jwt.sign(
      { id: user._id, role: user.role, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        stats: user.stats,
        slug: user.slug?.current
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: "Erro interno no servidor." });
  }
};

/**
 * GET ME (Validação de sessão e Refresh de Créditos)
 */
const getMe = async (req, res) => {
  try {
    let user = await client.fetch(`*[_id == $id][0]`, { id: req.userId });
    if (!user) return res.status(404).json({ success: false, error: "Usuário não encontrado." });

    // Tenta resetar os créditos toda vez que o app abre/valida a sessão
    user = await checkAndResetCredits(user);

    return res.status(200).json({
      success: true,
      user: { 
        _id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        stats: user.stats,
        slug: user.slug?.current
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Erro ao validar sessão." });
  }
};

module.exports = { register, login, getMe };