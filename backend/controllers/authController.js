const client = require('../config/sanity');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { formatSlug } = require('../utils/formatter');

/**
 * FUNÇÃO AUXILIAR: Verifica e reseta créditos baseada no tempo.
 * Regra: Se plano 'free' e 0 créditos, recupera 1 crédito após 1 hora.
 */
const checkAndResetCredits = async (user) => {
  // Se o usuário já tem créditos ou é Pro, não precisamos resetar por tempo
  if (user.credits > 0 || user.plan === 'pro') return user;

  const lastGen = new Date(user.stats?.lastGenerationAt || 0);
  const now = new Date();
  const diffInHours = (now - lastGen) / (1000 * 60 * 60);

  if (diffInHours >= 1) {
    console.log(`♻️ Resetando crédito por tempo para o usuário: ${user.email}`);
    const updatedUser = await client
      .patch(user._id)
      .set({ credits: 1 })
      .commit();
    return updatedUser;
  }
  return user;
};

/**
 * Gera um slug único para o usuário, evitando colisões de nomes iguais.
 */
const generateUniqueSlug = async (name) => {
  const baseSlug = formatSlug(name);
  let uniqueSlug = baseSlug;
  let counter = 1;
  let exists = true;

  while (exists) {
    const user = await client.fetch(`*[_type == "user" && slug.current == $slug][0]`, { slug: uniqueSlug });
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
      return res.status(400).json({ success: false, error: "Preencha todos os campos obrigatórios." });
    }

    const userExists = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });
    if (userExists) {
      return res.status(400).json({ success: false, error: "Este e-mail já está cadastrado." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const finalSlug = await generateUniqueSlug(name);

    // Documento do Usuário (Sincronizado com User Schema)
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
        // Truque: define 1h atrás para permitir gerar curso imediatamente
        lastGenerationAt: new Date(Date.now() - 3600000).toISOString() 
      }
    };

    const userCreated = await client.create(newUser);

    // Registro na Newsletter (Opcional/Silencioso)
    if (newsletter) {
      client.create({
        _type: 'newsletter',
        user: { _type: 'reference', _ref: userCreated._id },
        email: userCreated.email,
        subscribedAt: new Date().toISOString()
      }).catch(err => console.error("Erro ao registrar newsletter:", err.message));
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
        stats: userCreated.stats,
        slug: userCreated.slug?.current
      }
    });

  } catch (error) {
    console.error("❌ Erro no Registro:", error);
    return res.status(500).json({ success: false, error: "Falha ao criar conta no banco de dados." });
  }
};

/**
 * LOGIN
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });
    if (!user) return res.status(401).json({ success: false, error: "Credenciais inválidas." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, error: "Credenciais inválidas." });

    // Sincroniza créditos e atualiza último login
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
        slug: user.slug?.current,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error("❌ Erro no Login:", error);
    return res.status(500).json({ success: false, error: "Erro interno ao processar login." });
  }
};

/**
 * GET ME (Validação de Sessão)
 */
const getMe = async (req, res) => {
  try {
    let user = await client.fetch(`*[_id == $id][0]`, { id: req.userId });
    if (!user) return res.status(404).json({ success: false, error: "Usuário não encontrado." });

    // Verifica se ganhou crédito novo enquanto estava navegando
    user = await checkAndResetCredits(user);

    return res.status(200).json({
      success: true,
      user: { 
        _id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        stats: user.stats,
        slug: user.slug?.current,
        plan: user.plan
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Erro ao validar sessão." });
  }
};

module.exports = { register, login, getMe };