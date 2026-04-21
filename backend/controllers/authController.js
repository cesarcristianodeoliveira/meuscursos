const client = require('../config/sanity');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { formatSlug } = require('../utils/formatter');

/**
 * FUNÇÃO AUXILIAR: Verifica e reseta créditos baseada no tempo
 */
const checkAndResetCredits = async (user) => {
  if (user.credits > 0) return user;

  const lastGen = new Date(user.stats?.lastGenerationAt);
  const now = new Date();
  const diffInHours = (now - lastGen) / (1000 * 60 * 60);

  if (diffInHours >= 1) {
    const updatedUser = await client
      .patch(user._id)
      .set({ credits: 1 })
      .commit();
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
 * REGISTRO (Atualizado v1.7 - Com criação de Newsletter separada)
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

    // 1. Criar o documento do Usuário
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
        lastGenerationAt: new Date(Date.now() - 3600000).toISOString() 
      }
    };

    const userCreated = await client.create(newUser);

    // 2. Se selecionou newsletter, cria o documento no schema 'newsletter'
    if (newsletter) {
      try {
        await client.create({
          _type: 'newsletter',
          user: { _type: 'reference', _ref: userCreated._id },
          email: userCreated.email,
          subscribedAt: new Date().toISOString()
        });
        console.log(`📧 Inscrição na newsletter criada para: ${email}`);
      } catch (newsErr) {
        console.error("Erro silencioso ao criar newsletter:", newsErr);
        // Não travamos o registro se a newsletter falhar, apenas logamos.
      }
    }

    const token = jwt.sign(
      { id: userCreated._id, role: userCreated.role, plan: userCreated.plan },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: userCreated._id,
        name: userCreated.name,
        email: userCreated.email,
        credits: userCreated.credits,
        stats: userCreated.stats
      }
    });

  } catch (error) {
    console.error("Erro no registro:", error);
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
    if (!user) return res.status(401).json({ success: false, error: "E-mail ou senha inválidos." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, error: "E-mail ou senha inválidos." });

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
 * GET ME
 */
const getMe = async (req, res) => {
  try {
    let user = await client.fetch(`*[_id == $id][0]`, { id: req.userId });
    if (!user) return res.status(404).json({ success: false, error: "Usuário não encontrado." });

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