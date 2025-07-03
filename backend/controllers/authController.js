// D:\meuscursos\backend\controllers\authController.js

import bcrypt from 'bcryptjs'; // Usamos 'bcryptjs' para compatibilidade se não houver um ambiente Node nativo
import jwt from 'jsonwebtoken';
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs e slugs únicos

dotenv.config(); // Carrega variáveis de ambiente do .env

// Configuração do Sanity Client para este controlador
const sanityClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12', // Data da API Sanity que você está usando
    useCdn: false, // O backend sempre acessa a API diretamente, não o CDN
    token: process.env.SANITY_TOKEN, // Token com permissões de escrita (criação/atualização de documentos)
});

// Chave secreta para JWT (JSON Web Tokens)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    // Erro crítico se a chave secreta não estiver definida
    console.error("Erro: Variável de ambiente JWT_SECRET não definida. O servidor será encerrado.");
    process.exit(1); 
}

// --- Função auxiliar para gerar slug amigável para URLs e único ---
const generateSlug = (text) => {
  // Normaliza o texto para remover acentos e caracteres diacríticos
  const normalizedText = text
    .normalize("NFD") // Decompõe caracteres acentuados (ex: 'é' -> 'e', '´')
    .replace(/[\u0300-\u036f]/g, ""); // Remove os diacríticos resultantes

  // Converte para minúsculas, remove caracteres especiais e formata hífens
  const baseSlug = normalizedText
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove tudo que não é letra (a-z), número (0-9), espaço ou hífen
    .replace(/\s+/g, '-')        // Substitui múltiplos espaços por um único hífen
    .replace(/-+/g, '-');        // Substitui múltiplos hífens por um único hífen
  
  // Adiciona um sufixo UUID curto para garantir unicidade
  return `${baseSlug}-${uuidv4().substring(0, 8)}`; 
};

// --- Rota de Registro de Usuário ---
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    // 1. Validação básica das informações de entrada
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Por favor, preencha nome, email e senha.' });
    }

    // --- VALIDAÇÃO DE SENHA: EXATAMENTE 6 DÍGITOS NUMÉRICOS ---
    const passwordRegex = /^\d{6}$/; // Regex para exatamente 6 dígitos numéricos
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: 'A senha deve conter exatamente 6 dígitos numéricos.' });
    }
    // --- FIM DA VALIDAÇÃO ---

    try {
        // 2. Verificar se o email já está sendo usado por outro membro no Sanity
        const existingMember = await sanityClient.fetch(
            `*[_type == "member" && email == $email][0]`, // Consulta GROQ para buscar membro por email
            { email }
        );

        if (existingMember) {
            // Se o email já existe, retorna um erro de conflito
            return res.status(409).json({ message: 'Este email já está cadastrado.' });
        }

        // 3. Hashear (criptografar) a senha antes de salvar
        const salt = await bcrypt.genSalt(10); // Gera um "sal" aleatório para segurança
        const hashedPassword = await bcrypt.hash(password, salt); // Hashea a senha com o sal gerado

        // 4. Criar um novo documento 'member' no Sanity com os dados fornecidos e padrões
        const newMember = {
            _type: 'member', // Define o tipo de documento no Sanity
            name,
            slug: { current: generateSlug(name) }, // Gera um slug único e amigável
            email,
            password: hashedPassword, // Armazena o hash da senha
            isAdmin: false, // Padrão: novo usuário não é administrador
            plan: 'free',   // Padrão: plano gratuito
            credits: 1, // Ajustado: 1 crédito inicial para IA
            memberLevel: 1,   // Ajustado: Nível inicial do membro
            experiencePoints: 0, // Ajustado: Pontos de experiência iniciais
            
            // CORREÇÃO AQUI: Inicializa uiSettings com themeMode: 'system'
            uiSettings: { 
                themeMode: 'system' 
            }, 
            notificationSettings: {}, // Inicializa o objeto de configurações de notificação

            // Sanity gera _createdAt e _updatedAt automaticamente. Não os defina manualmente aqui.
            // createdAt: new Date().toISOString(), // REMOVIDO: Sanity gerencia _createdAt
            // updatedAt: new Date().toISOString(), // REMOVIDO: Sanity gerencia _updatedAt
        };

        const createdMember = await sanityClient.create(newMember); // Salva o novo membro no Sanity

        // 5. Gerar JSON Web Token (JWT) para o usuário recém-registrado
        const token = jwt.sign(
            { 
                id: createdMember._id, 
                isAdmin: createdMember.isAdmin, 
                plan: createdMember.plan 
            },
            JWT_SECRET, // Usa a chave secreta do ambiente
            { expiresIn: '1h' } // Token expira em 1 hora para segurança
        );

        // 6. Enviar resposta de sucesso para o frontend
        // Inclui os dados do usuário para que o frontend possa armazená-los no contexto/localStorage
        res.status(201).json({
            message: 'Usuário registrado com sucesso!',
            token, // Token JWT para futuras requisições autenticadas
            user: { // Dados do usuário para o frontend (sem a senha)
                id: createdMember._id,
                name: createdMember.name,
                email: createdMember.email,
                isAdmin: createdMember.isAdmin,
                plan: createdMember.plan,
                // Inclui uiSettings e notificationSettings para que o frontend tenha acesso
                uiSettings: createdMember.uiSettings,
                notificationSettings: createdMember.notificationSettings,
                memberLevel: createdMember.memberLevel,
                experiencePoints: createdMember.experiencePoints,
                credits: createdMember.credits,
            },
        });

    } catch (error) {
        console.error('Erro no registro do usuário:', error); // Log detalhado do erro no servidor
        res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.' });
    }
};

// --- Rota de Login de Usuário ---
export const login = async (req, res) => {
    const { email, password } = req.body;

    // 1. Validação básica das informações de entrada
    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, preencha email e senha.' });
    }

    try {
        // 2. Buscar o membro pelo email no Sanity
        // Busca todos os campos do membro, incluindo a senha para a comparação.
        // O campo 'password' será excluído antes de enviar a resposta ao frontend.
        const member = await sanityClient.fetch(
            `*[_type == "member" && email == $email][0]{_id, name, email, password, isAdmin, plan, memberLevel, experiencePoints, credits, uiSettings, notificationSettings}`, 
            { email }
        );

        if (!member) {
            // Se o membro não for encontrado, credenciais inválidas
            return res.status(400).json({ message: 'Credenciais inválidas (email não encontrado).' });
        }

        // 3. Comparar a senha fornecida com o hash de senha armazenado
        const isMatch = await bcrypt.compare(password, member.password);

        if (!isMatch) {
            // Se as senhas não coincidem, credenciais inválidas
            return res.status(400).json({ message: 'Credenciais inválidas (senha incorreta).' });
        }

        // 4. Gerar JSON Web Token (JWT) para o usuário logado
        const token = jwt.sign(
            { 
                id: member._id, 
                isAdmin: member.isAdmin, 
                plan: member.plan 
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 5. Opcional: Atualizar o campo 'lastLogin' no Sanity
        // Usamos patch para atualizar apenas campos específicos de um documento existente
        await sanityClient
          .patch(member._id) // Pega o documento do membro pelo ID
          .set({ lastLogin: new Date().toISOString() }) // Define a data/hora do último login
          .commit(); // Salva a mudança no Sanity

        // 6. Enviar resposta de sucesso para o frontend
        // Desestrutura o objeto 'member' para excluir o campo 'password' antes de enviar ao frontend
        const { password: _, ...userWithoutPassword } = member; 
        
        res.status(200).json({
            message: 'Login realizado com sucesso!',
            token, // Token JWT
            user: userWithoutPassword, // Agora o objeto 'user' não contém a senha
        });

    } catch (error) {
        console.error('Erro no login do usuário:', error); // Log detalhado do erro no servidor
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.' });
    }
};