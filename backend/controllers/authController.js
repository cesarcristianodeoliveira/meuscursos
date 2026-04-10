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
  const { name, email, password, newsletter } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Preencha todos os campos corretamente." });
    }

    // 1. Verificar se e-mail já existe
    const userExists = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });
    if (userExists) {
      return res.status(400).json({ success: false, error: "Este e-mail já está em uso." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const finalSlug = await generateUniqueSlug(name);

    // 2. Criar Objeto do Usuário
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

    // 3. CRIAÇÃO DA NEWSLETTER (Com Try/Catch isolado)
    if (newsletter && result._id) {
      try {
        await client.create({
          _type: 'newsletter',
          user: {
            _type: 'reference',
            _ref: result._id
          },
          email: result.email,
          subscribedAt: new Date().toISOString()
        });
      } catch (newsErr) {
        // Se falhar a newsletter, apenas logamos, mas não barramos o registro do user
        console.error("⚠️ Falha ao registrar na newsletter:", newsErr.message);
      }
    }

    // 4. Geração do Token
    const token = jwt.sign(
      { id: result._id, role: result.role, plan: result.plan },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 5. Resposta Sucesso
    return res.status(201).json({
      success: true,
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
    return res.status(500).json({ success: false, error: "Erro interno ao criar conta." });
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
      return res.status(401).json({ success: false, error: "E-mail ou senha inválidos." });
    }

    if (user.authProvider !== 'credentials' && !user.password) {
      return res.status(401).json({ success: false, error: `Conta via ${user.authProvider}. Entre por lá.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "E-mail ou senha inválidos." });
    }

    await client.patch(user._id).set({ "stats.lastLogin": new Date().toISOString() }).commit();

    const token = jwt.sign(
      { id: user._id, role: user.role, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      success: true,
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
    return res.status(500).json({ success: false, error: "Erro interno no servidor." });
  }
};

/**
 * ROTA /ME
 */
const getMe = async (req, res) => {
  try {
    const user = await client.fetch(`*[_id == $id][0]`, { id: req.userId });
    if (!user) return res.status(404).json({ success: false, error: "Usuário não encontrado." });

    return res.status(200).json({
      success: true,
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
    return res.status(500).json({ success: false, error: "Erro ao validar sessão." });
  }
};

module.exports = { register, login, getMe };