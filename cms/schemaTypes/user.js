export default {
  name: 'user',
  title: 'Usuários',
  type: 'document',
  fields: [
    { name: 'name', title: 'Nome', type: 'string' },
    { 
      name: 'slug', 
      title: 'Slug', 
      type: 'slug', 
      options: { source: 'name', maxLength: 96 },
      validation: Rule => Rule.required()
    },
    { name: 'email', title: 'Email', type: 'string', validation: Rule => Rule.required() },
    { name: 'password', title: 'Senha (Hash)', type: 'string', hidden: true },
    { name: 'role', title: 'Cargo', type: 'string', options: { list: ['admin', 'user'] }, initialValue: 'user' },
    { name: 'credits', title: 'Créditos', type: 'number', initialValue: 1 },
    
    // Gamificação e Progresso
    { 
      name: 'stats', 
      type: 'object', 
      fields: [
        { name: 'totalXp', type: 'number', initialValue: 0 },
        { name: 'level', type: 'number', initialValue: 1 },
        { name: 'coursesCreated', type: 'number', initialValue: 0 },
        { name: 'coursesCompleted', type: 'number', initialValue: 0 },
        { name: 'lastLogin', type: 'datetime' }
      ]
    },
    { 
      name: 'achievements', 
      title: 'Conquistas', 
      type: 'array', 
      of: [{ type: 'reference', to: [{ type: 'badge' }] }] 
    }
  ]
}