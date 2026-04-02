export default {
  name: 'course',
  title: 'Cursos',
  type: 'document',
  fields: [
    { name: 'title', title: 'Título', type: 'string' },
    { 
      name: 'slug', 
      title: 'Slug', 
      type: 'slug', 
      options: { source: 'title', maxLength: 96 },
      validation: Rule => Rule.required()
    },
    { name: 'author', title: 'Autor', type: 'reference', to: [{ type: 'user' }] },
    { name: 'category', title: 'Categoria', type: 'reference', to: [{ type: 'category' }] },
    { name: 'thumbnail', title: 'Capa', type: 'image', options: { hotspot: true } },
    { name: 'description', title: 'Descrição', type: 'text' },
    { name: 'estimatedTime', title: 'Tempo Estimado (min)', type: 'number' },
    { name: 'xpReward', title: 'Recompensa de XP', type: 'number' },
    { 
      name: 'level', 
      title: 'Nível', 
      type: 'string', 
      options: { list: ['iniciante', 'intermediario', 'avancado'] } 
    },
    { name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] },
    { name: 'isPublished', title: 'Publicado', type: 'boolean', initialValue: true },
    
    // Conteúdo Estruturado
    {
      name: 'modules',
      title: 'Módulos',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'title', type: 'string' },
          { name: 'content', type: 'text', description: 'Suporta Markdown' },
          {
            name: 'exercises',
            type: 'array',
            of: [{
              type: 'object',
              fields: [
                { name: 'question', type: 'string' },
                { name: 'options', type: 'array', of: [{ type: 'string' }] },
                { name: 'correctAnswer', type: 'string' }
              ]
            }]
          }
        ]
      }]
    },
    {
      name: 'finalExam',
      title: 'Exame Final',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'question', type: 'string' },
          { name: 'options', type: 'array', of: [{ type: 'string' }] },
          { name: 'correctAnswer', type: 'string' }
        ]
      }]
    },

    // Metadados da IA
    {
      name: 'aiMetadata',
      title: 'Dados da IA',
      type: 'object',
      fields: [
        { name: 'provider', type: 'string' },
        { name: 'model', type: 'string' },
        { name: 'totalTokens', type: 'number' },
        { name: 'generatedAt', type: 'datetime' },
        { name: 'externalImageId', type: 'string' }
      ]
    }
  ]
}