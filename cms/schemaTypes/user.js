export default {
  name: 'user',
  title: 'Usuários',
  type: 'document',
  groups: [
    { name: 'profile', title: 'Perfil' },
    { name: 'gamification', title: 'Gamificação & Progresso' },
    { name: 'settings', title: 'Configurações & Admin' },
  ],
  fields: [
    // --- INFORMAÇÕES BÁSICAS ---
    {
      name: 'name',
      title: 'Nome Completo',
      type: 'string',
      group: 'profile',
    },
    {
      name: 'email',
      title: 'E-mail',
      type: 'string',
      group: 'profile',
      validation: Rule => Rule.required().email(),
    },
    {
      name: 'password',
      title: 'Senha (Hash)',
      type: 'string',
      hidden: true,
      description: 'Armazenada via hash seguro.',
    },
    {
      name: 'bio',
      title: 'Biografia',
      type: 'text',
      group: 'profile',
    },

    // --- AVATAR ---
    {
      name: 'avatar',
      title: 'Avatar (Upload)',
      type: 'image',
      group: 'profile',
      options: { hotspot: true },
    },
    {
      name: 'avatarURL',
      title: 'URL do Avatar Externo',
      type: 'url',
      group: 'profile',
    },

    // --- PERMISSÕES E PLANOS ---
    {
      name: 'role',
      title: 'Papel (Role)',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          { title: 'Administrador', value: 'admin' },
          { title: 'Moderador', value: 'moderator' },
          { title: 'Usuário', value: 'user' },
        ],
        layout: 'radio',
      },
      initialValue: 'user',
    },
    {
      name: 'plan',
      title: 'Plano Atual',
      type: 'string',
      group: 'settings',
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
      group: 'settings',
      initialValue: 1,
      validation: Rule => Rule.min(0),
    },

    // --- PROGRESSO E CURSOS ---
    {
      name: 'enrolledCourses',
      title: 'Cursos Inscritos',
      type: 'array',
      group: 'gamification',
      of: [{ type: 'reference', to: [{ type: 'course' }] }],
      description: 'Cursos que o usuário iniciou.'
    },
    {
      name: 'completedCourses',
      title: 'Cursos Concluídos',
      type: 'array',
      group: 'gamification',
      of: [{ type: 'reference', to: [{ type: 'course' }] }],
      description: 'Cursos que o usuário finalizou 100%.'
    },

    // --- GAMIFICAÇÃO (STATS) ---
    {
      name: 'stats',
      title: 'Estatísticas de Gamificação',
      type: 'object',
      group: 'gamification',
      fields: [
        { name: 'totalXp', title: 'XP Acumulado', type: 'number', initialValue: 0 },
        { name: 'level', title: 'Nível Atual', type: 'number', initialValue: 1 },
        { name: 'coursesCreated', title: 'Cursos Gerados por IA', type: 'number', initialValue: 0 },
        { name: 'lastLogin', title: 'Última Atividade', type: 'datetime' },
      ]
    },
    {
      name: 'achievements',
      title: 'Conquistas Desbloqueadas',
      type: 'array',
      group: 'gamification',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Título', type: 'string' },
            { name: 'icon', title: 'Ícone', type: 'string' },
            { name: 'unlockedAt', title: 'Data', type: 'datetime' },
          ]
        }
      ]
    },

    // --- INTEGRAÇÃO E STATUS ---
    {
      name: 'externalId',
      title: 'ID de Autenticação Externa',
      type: 'string',
      group: 'settings',
    },
    {
      name: 'isActive',
      title: 'Conta Ativa',
      type: 'boolean',
      group: 'settings',
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