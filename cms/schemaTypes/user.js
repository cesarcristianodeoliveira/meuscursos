export default {
  name: 'user',
  title: 'Usuários',
  type: 'document',
  fields: [
    { 
      name: 'name', 
      title: 'Nome', 
      type: 'string' 
    },
    { 
      name: 'slug', 
      title: 'Slug', 
      type: 'slug', 
      options: { source: 'name', maxLength: 96 },
      validation: Rule => Rule.required()
    },
    { 
      name: 'email', 
      title: 'Email', 
      type: 'string', 
      validation: Rule => Rule.required() 
    },
    { 
      name: 'avatar', 
      title: 'Avatar (Foto de Perfil)', 
      type: 'image', 
      options: { hotspot: true } 
    },
    { 
      name: 'password', 
      title: 'Senha (Hash)', 
      type: 'string', 
      hidden: true,
      description: 'Pode ser vazio se o login for via rede social'
    },
    {
      name: 'authProvider',
      title: 'Provedor de Autenticação',
      type: 'string',
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
      description: 'ID do usuário no Google ou GitHub'
    },
    { 
      name: 'role', 
      title: 'Cargo', 
      type: 'string', 
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
      initialValue: 1 
    },
    {
      name: 'newsletter',
      title: 'Assina Newsletter',
      type: 'boolean',
      description: 'Define se o usuário aceitou receber e-mails de novidades',
      initialValue: false
    },

    // Gamificação e Progresso
    { 
      name: 'stats', 
      title: 'Estatísticas de Progresso',
      type: 'object', 
      fields: [
        { name: 'totalXp', title: 'Total de XP', type: 'number' },
        { name: 'level', title: 'Nível Atual', type: 'number' },
        { name: 'coursesCreated', title: 'Cursos Gerados', type: 'number' },
        { name: 'coursesCompleted', title: 'Cursos Concluídos', type: 'number' },
        { name: 'lastLogin', title: 'Último Acesso', type: 'datetime' }
      ],
      initialValue: {
        totalXp: 0,
        level: 1,
        coursesCreated: 0,
        coursesCompleted: 0
      }
    },
    { 
      name: 'achievements', 
      title: 'Conquistas (Badges)', 
      type: 'array', 
      of: [{ type: 'reference', to: [{ type: 'badge' }] }] 
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'avatar',
      plan: 'plan',
      news: 'newsletter'
    },
    prepare({ title, subtitle, media, plan, news }) {
      return {
        title,
        subtitle: `[${plan.toUpperCase()}] ${news ? '📧' : ''} - ${subtitle}`,
        media
      }
    }
  }
}