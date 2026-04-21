export default {
  name: 'user',
  title: 'Usuários',
  type: 'document',
  fieldsets: [
    { name: 'profile', title: 'Informações de Perfil', options: { columns: 2 } },
    { name: 'auth', title: 'Segurança e Acesso', options: { collapsible: true, collapsed: true } },
    { name: 'subscription', title: 'Plano e Créditos', options: { columns: 2 } },
    { name: 'gamification', title: 'Gamificação' }
  ],
  fields: [
    { 
      name: 'name', 
      title: 'Nome', 
      type: 'string',
      fieldset: 'profile',
      validation: Rule => Rule.required()
    },
    { 
      name: 'slug', 
      title: 'Slug', 
      type: 'slug', 
      fieldset: 'profile',
      options: { source: 'name', maxLength: 96 },
      validation: Rule => Rule.required()
    },
    { 
      name: 'email', 
      title: 'Email', 
      type: 'string', 
      fieldset: 'profile',
      validation: Rule => Rule.required().email() 
    },
    { 
      name: 'avatar', 
      title: 'Avatar (Foto de Perfil)', 
      type: 'image', 
      fieldset: 'profile',
      options: { hotspot: true } 
    },

    // --- SEGURANÇA E ACESSO ---
    { 
      name: 'password', 
      title: 'Senha (Hash)', 
      type: 'string', 
      fieldset: 'auth',
      hidden: true,
      description: 'Armazena o hash da senha para logins via credenciais.'
    },
    {
      name: 'authProvider',
      title: 'Provedor de Autenticação',
      type: 'string',
      fieldset: 'auth',
      options: {
        list: [
          { title: 'E-mail/Senha', value: 'credentials' },
          { title: 'Google', value: 'google' },
          { title: 'GitHub', value: 'github' }
        ]
      },
      initialValue: 'credentials'
    },
    {
      name: 'externalId',
      title: 'ID Externo (OAuth)',
      type: 'string',
      fieldset: 'auth',
      description: 'ID único do provedor social.'
    },

    // --- PLANO E CRÉDITOS ---
    { 
      name: 'role', 
      title: 'Cargo/Permissão', 
      type: 'string', 
      fieldset: 'subscription',
      options: { 
        list: [
          { title: 'Administrador', value: 'admin' },
          { title: 'Usuário', value: 'user' }
        ] 
      }, 
      initialValue: 'user' 
    },
    { 
      name: 'plan', 
      title: 'Plano Atual', 
      type: 'string', 
      fieldset: 'subscription',
      options: { 
        list: [
          { title: 'Grátis', value: 'free' },
          { title: 'Pro', value: 'pro' }
        ] 
      }, 
      initialValue: 'free' 
    },
    { 
      name: 'credits', 
      title: 'Créditos Disponíveis', 
      type: 'number', 
      fieldset: 'subscription',
      initialValue: 1,
      validation: Rule => Rule.min(0)
    },
    {
      name: 'newsletter',
      title: 'Assina Newsletter',
      type: 'boolean',
      fieldset: 'subscription',
      initialValue: false
    },

    // --- GAMIFICAÇÃO E PROGRESSO ---
    { 
      name: 'stats', 
      title: 'Estatísticas e Performance',
      type: 'object', 
      fieldset: 'gamification',
      fields: [
        { name: 'totalXp', title: 'Total de XP', type: 'number', initialValue: 0 },
        { name: 'level', title: 'Nível Atual', type: 'number', initialValue: 1 },
        { name: 'coursesCreated', title: 'Cursos Gerados', type: 'number', initialValue: 0 },
        { name: 'coursesCompleted', title: 'Cursos Concluídos', type: 'number', initialValue: 0 },
        { name: 'lastLogin', title: 'Último Acesso', type: 'datetime' },
        { 
          name: 'lastGenerationAt', 
          title: 'Última Geração de Curso', 
          type: 'datetime',
          description: 'Usado para controlar a recarga de 1 hora do Plano Free.'
        }
      ]
    },
    { 
      name: 'achievements', 
      title: 'Conquistas (Badges)', 
      type: 'array', 
      fieldset: 'gamification',
      of: [{ type: 'reference', to: [{ type: 'badge' }] }] 
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'avatar',
      plan: 'plan',
      xp: 'stats.totalXp'
    },
    prepare({ title, subtitle, media, plan, xp }) {
      return {
        title: title || 'Usuário Sem Nome',
        subtitle: `[${(plan || 'free').toUpperCase()}] ${xp || 0} XP - ${subtitle}`,
        media
      }
    }
  }
}