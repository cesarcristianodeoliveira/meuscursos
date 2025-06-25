import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs e slugs únicos

dotenv.config();

// Configuração do Sanity Client para o controlador
const sanityClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-06-25', // Use a data atual ou a versão da sua API Sanity
    useCdn: false, // O backend sempre acessa a API diretamente
    token: process.env.SANITY_TOKEN, // Token com permissões de escrita
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("Erro: Variável de ambiente JWT_SECRET não definida. O servidor será encerrado.");
    process.exit(1); // Encerra a aplicação se a chave JWT não estiver definida
}

// --- Função auxiliar para gerar slug ---
const generateSlug = (text) => {
  const normalizedText = text
    .normalize("NFD") // Normaliza para decompor caracteres acentuados em base + diacrítico
    .replace(/[\u0300-\u036f]/g, ""); // Remove os diacríticos (acentos, til, etc.)

  const baseSlug = normalizedText
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove caracteres inválidos (mantém letras, números, espaço, hífen)
    .replace(/\s+/g, '-')        // Substitui espaços por hífens
    .replace(/-+/g, '-');        // Remove hífens duplicados
  
  return `${baseSlug}-${uuidv4().substring(0, 8)}`; // Adiciona um sufixo único para evitar colisões
};

// --- Rota de Registro de Usuário ---
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    // 1. Validação de entrada
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Por favor, preencha nome, email e senha.' });
    }

    try {
        // 2. Verificar se o email já está em uso
        const existingMember = await sanityClient.fetch(
            `*[_type == "member" && email == $email][0]`,
            { email }
        );

        if (existingMember) {
            return res.status(409).json({ message: 'Este email já está cadastrado.' });
        }

        // 3. Hashear a senha
        const salt = await bcrypt.genSalt(10); // Gera um "sal" aleatório
        const hashedPassword = await bcrypt.hash(password, salt); // Hashea a senha com o sal

        // 4. Criar um novo documento 'member' no Sanity
        const newMember = {
            _type: 'member',
            name,
            slug: { current: generateSlug(name) }, // Gerar slug automaticamente
            email,
            password: hashedPassword, // Armazena o hash da senha
            isAdmin: false, // Padrão: não é admin
            plan: 'free',   // Padrão: plano gratuito
            geminiCredits: 5, // Exemplo: 5 créditos iniciais para IA
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Outros campos do schema 'member' (profileImage, lastLogin, createdCourses, etc.)
            // serão inicializados com seus valores padrão ou como nulos/vazios.
        };

        const createdMember = await sanityClient.create(newMember);

        // 5. Gerar JSON Web Token (JWT)
        const token = jwt.sign(
            { 
                id: createdMember._id, 
                isAdmin: createdMember.isAdmin, 
                plan: createdMember.plan 
            },
            JWT_SECRET,
            { expiresIn: '1h' } // Token expira em 1 hora
        );

        // 6. Enviar resposta de sucesso
        res.status(201).json({
            message: 'Usuário registrado com sucesso!',
            token,
            user: {
                id: createdMember._id,
                name: createdMember.name,
                email: createdMember.email,
                isAdmin: createdMember.isAdmin,
                plan: createdMember.plan,
            },
        });

    } catch (error) {
        console.error('Erro no registro do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.' });
    }
};

// --- Rota de Login de Usuário ---
export const login = async (req, res) => {
    const { email, password } = req.body;

    // 1. Validação de entrada
    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, preencha email e senha.' });
    }

    try {
        // 2. Buscar o membro pelo email
        // Seleciona apenas os campos essenciais para o login e a criação do token
        const member = await sanityClient.fetch(
            `*[_type == "member" && email == $email][0]{_id, name, email, password, isAdmin, plan}`,
            { email }
        );

        if (!member) {
            return res.status(400).json({ message: 'Credenciais inválidas (email não encontrado).' });
        }

        // 3. Comparar a senha fornecida com o hash armazenado
        const isMatch = await bcrypt.compare(password, member.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas (senha incorreta).' });
        }

        // 4. Gerar JSON Web Token (JWT)
        const token = jwt.sign(
            { 
                id: member._id, 
                isAdmin: member.isAdmin, 
                plan: member.plan 
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 5. Atualizar o campo 'lastLogin' no Sanity
        await sanityClient
          .patch(member._id) // Pega o documento do membro pelo ID
          .set({ lastLogin: new Date().toISOString() }) // Define a data/hora do último login
          .commit(); // Salva a mudança no Sanity

        // 6. Enviar resposta de sucesso
        res.status(200).json({
            message: 'Login realizado com sucesso!',
            token,
            user: {
                id: member._id,
                name: member.name,
                email: member.email,
                isAdmin: member.isAdmin,
                plan: member.plan,
            },
        });

    } catch (error) {
        console.error('Erro no login do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.' });
    }
};