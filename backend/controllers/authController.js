const client = require('../config/sanity');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { formatSlug } = require('../utils/formatter');

/**
 * Função Auxiliar: Gera um slug único de forma sequencial.
 */
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
 * REGISTRO DE USUÁRIO
 */
const register = async (req, res) => {
  // Agora recebemos o 'newsletter' (boolean) em vez do 'plan'
  const { name, email, password, newsletter } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Preencha todos os campos corretamente." });
    }

    const userExists = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });
    if (userExists) {
      return res.status(400).json({ error: "Este e-mail já está em uso." });
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
      plan: 'free',      // Forçado: Todo cadastro começa no Grátis
      credits: 1,       // 1 Crédito inicial padrão
      newsletter: !!newsletter, // Salva se aceitou assinar (true/false)
      stats: {
        _type: 'object',
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
      { id: result._id, role: result.role, plan: result.plan },
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
        plan: result.plan,
        credits: result.credits,
        slug: result.slug.current,
        stats: result.stats,
        newsletter: result.newsletter
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

    if (user.authProvider !== 'credentials' && !user.password) {
      return res.status(401).json({ error: `Esta conta foi criada via ${user.authProvider}. Entre usando esse método.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    // Atualiza o lastLogin
    await client
      .patch(user._id)
      .set({ "stats.lastLogin": new Date().toISOString() })
      .commit();

    const token = jwt.sign(
      { id: user._id, role: user.role, plan: user.plan },
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
        plan: user.plan,
        credits: user.credits,
        slug: user.slug?.current,
        stats: user.stats,
        newsletter: user.newsletter
      }
    });

  } catch (error) {
    console.error("❌ Erro no Login:", error.message);
    res.status(500).json({ error: "Erro interno ao realizar login." });
  }
};

/**
 * ROTA /ME (Sessão)
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
      plan: user.plan,
      credits: user.credits,
      slug: user.slug?.current,
      stats: user.stats,
      avatar: user.avatar,
      newsletter: user.newsletter
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao validar sessão." });
  }
};

module.exports = { register, login, getMe };