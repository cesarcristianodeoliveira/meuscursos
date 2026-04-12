export default {
  name: 'course',
  title: 'Cursos',
  type: 'document',
  fields: [
    { 
      name: 'title', 
      title: 'Título', 
      type: 'string',
      validation: Rule => Rule.required().min(5).max(100)
    },
    { 
      name: 'slug', 
      title: 'Slug', 
      type: 'slug', 
      options: { source: 'title', maxLength: 96 },
      validation: Rule => Rule.required()
    },
    { 
      name: 'author', 
      title: 'Autor', 
      type: 'reference', 
      to: [{ type: 'user' }],
      validation: Rule => Rule.required()
    },
    { 
      name: 'category', 
      title: 'Categoria', 
      type: 'reference', 
      to: [{ type: 'category' }] 
    },

    // Imagens
    { 
      name: 'thumbnail', 
      title: 'Capa (Upload)', 
      type: 'image', 
      options: { hotspot: true } 
    },
    { 
      name: 'externalImageId', 
      title: 'ID da Imagem Externa', 
      type: 'string',
      description: 'URL da imagem gerada por IA'
    },

    { name: 'description', title: 'Descrição Curta', type: 'text', rows: 3 },
    
    // Gamificação e Nível
    { 
      name: 'level', 
      title: 'Nível', 
      type: 'string', 
      options: { 
        list: [
          { title: 'Iniciante', value: 'iniciante' },
          { title: 'Intermediário', value: 'intermediario' },
          { title: 'Avançado', value: 'avancado' }
        ] 
      },
      initialValue: 'iniciante'
    },
    { name: 'estimatedTime', title: 'Tempo Estimado (min)', type: 'number' },
    { name: 'xpReward', title: 'Recompensa de XP', type: 'number', initialValue: 100 },
    
    { name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] },
    { name: 'isPublished', title: 'Publicado', type: 'boolean', initialValue: true },

    // CONTEÚDO ESTRUTURADO (Melhoria: Módulos contêm Aulas)
    {
      name: 'modules',
      title: 'Módulos do Curso',
      type: 'array',
      of: [{
        type: 'object',
        name: 'module',
        fields: [
          { name: 'title', title: 'Título do Módulo', type: 'string' },
          {
            name: 'lessons',
            title: 'Aulas',
            type: 'array',
            of: [{
              type: 'object',
              fields: [
                { name: 'title', title: 'Título da Aula', type: 'string' },
                { name: 'content', title: 'Conteúdo (Markdown)', type: 'text' },
                { name: 'duration', title: 'Duração (min)', type: 'number' }
              ]
            }]
          },
          {
            name: 'exercises',
            title: 'Quiz do Módulo',
            type: 'array',
            of: [{
              type: 'object',
              fields: [
                { name: 'question', title: 'Pergunta', type: 'string' },
                { name: 'options', title: 'Opções', type: 'array', of: [{ type: 'string' }] },
                { name: 'correctAnswer', title: 'Resposta Correta', type: 'string', description: 'Deve ser idêntica a uma das opções' }
              ]
            }]
          }
        ]
      }]
    },

    {
      name: 'finalExam',
      title: 'Exame Final (Certificação)',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'question', title: 'Pergunta', type: 'string' },
          { name: 'options', title: 'Opções', type: 'array', of: [{ type: 'string' }] },
          { name: 'correctAnswer', title: 'Resposta Correta', type: 'string' }
        ]
      }]
    },

    // Metadados da IA (Auditoria)
    {
      name: 'aiMetadata',
      title: 'Metadados da IA',
      type: 'object',
      fields: [
        { name: 'provider', title: 'Provedor', type: 'string' },
        { name: 'model', title: 'Modelo', type: 'string' },
        { name: 'totalTokens', title: 'Total de Tokens', type: 'number' },
        { name: 'generatedAt', title: 'Gerado em', type: 'datetime', initialValue: (new Date()).toISOString() }
      ]
    }
  ]
}