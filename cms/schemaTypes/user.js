export default {
  name: 'user',
  title: 'Usuários',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Nome Completo',
      type: 'string',
    },
    {
      name: 'email',
      title: 'E-mail',
      type: 'string',
      validation: Rule => Rule.required().email(),
    },
    {
      name: 'password', // Armazenar sempre como HASH no backend
      title: 'Senha (Hash)',
      type: 'string',
      hidden: true, 
      description: 'Senha criptografada do usuário.'
    },
    // --- FUNÇÕES E PERMISSÕES ---
    {
      name: 'role',
      title: 'Papel (Role)',
      type: 'string',
      options: {
        list: [
          { title: 'Administrador', value: 'admin' },
          { title: 'Moderador', value: 'moderator' },
          { title: 'Usuário Padrão', value: 'user' },
        ],
        layout: 'radio',
      },
      initialValue: 'user',
      description: 'Define o nível de acesso do usuário ao sistema.'
    },
    // --- AVATAR (HÍBRIDO) ---
    {
      name: 'avatar',
      title: 'Avatar (Upload)',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'avatarURL',
      title: 'URL do Avatar Externo',
      type: 'url',
    },
    
    // --- MONETIZAÇÃO E CRÉDITOS ---
    {
      name: 'plan',
      title: 'Plano Atual',
      type: 'string',
      options: {
        list: [
          { title: 'Grátis (Free)', value: 'free' },
          { title: 'Premium (Pro)', value: 'pro' },
        ],
        layout: 'radio',
      },
      initialValue: 'free',
    },
    {
      name: 'credits',
      title: 'Créditos de Geração',
      type: 'number',
      initialValue: 3,
      validation: Rule => Rule.min(0)
    },

    // --- REDES SOCIAIS ---
    {
      name: 'socialLinks',
      title: 'Redes Sociais',
      type: 'object',
      fields: [
        { name: 'linkedin', title: 'LinkedIn', type: 'url' },
        { name: 'github', title: 'GitHub', type: 'url' },
        { name: 'twitter', title: 'Twitter/X', type: 'url' },
        { name: 'website', title: 'Site Pessoal', type: 'url' },
      ]
    },

    // --- CONQUISTAS E GAMIFICAÇÃO ---
    {
      name: 'achievements',
      title: 'Conquistas / Medalhas',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Nome da Conquista', type: 'string' },
            { name: 'icon', title: 'Ícone (Emoji ou Lucide)', type: 'string' },
            { name: 'unlockedAt', title: 'Desbloqueado em', type: 'datetime' },
            { name: 'description', title: 'Como foi ganho', type: 'string' }
          ]
        }
      ]
    },

    // --- CURSOS E PROGRESSO ---
    {
      name: 'enrolledCourses',
      title: 'Cursos Inscritos',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'course' }] }],
    },
    {
      name: 'completedCourses',
      title: 'Cursos Concluídos',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'course' }] }],
    },

    // --- BIO E IDENTIFICAÇÃO ---
    {
      name: 'bio',
      title: 'Biografia',
      type: 'text',
    },
    {
      name: 'externalId',
      title: 'ID Externo (Auth Provedores)',
      type: 'string',
    },

    // --- MÉTRICAS ---
    {
      name: 'stats',
      title: 'Estatísticas do Usuário',
      type: 'object',
      fields: [
        { name: 'totalXp', title: 'XP', type: 'number', initialValue: 0 },
        { name: 'coursesCreated', title: 'Cursos Criados', type: 'number', initialValue: 0 },
        { name: 'level', title: 'Nível', type: 'number', initialValue: 1 },
        { name: 'lastLogin', title: 'Último Login', type: 'datetime' },
      ]
    },

    {
      name: 'isActive',
      title: 'Conta Ativa',
      type: 'boolean',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'avatar',
    },
  },
};