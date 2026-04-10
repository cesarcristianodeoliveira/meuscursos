export default {
  name: 'course',
  title: 'Cursos',
  type: 'document',
  fields: [
    { 
      name: 'title', 
      title: 'Título', 
      type: 'string',
      validation: Rule => Rule.required()
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
    { name: 'category', title: 'Categoria', type: 'reference', to: [{ type: 'category' }] },
    
    // Imagem do Curso
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
      description: 'ID ou URL da imagem gerada por IA externa'
    },

    { name: 'description', title: 'Descrição', type: 'text' },
    { name: 'estimatedTime', title: 'Tempo Estimado (min)', type: 'number' },
    { name: 'xpReward', title: 'Recompensa de XP', type: 'number', initialValue: 100 },
    { 
      name: 'level', 
      title: 'Nível', 
      type: 'string', 
      options: { list: ['iniciante', 'intermediario', 'avancado'] } 
    },
    { name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] },
    { name: 'isPublished', title: 'Publicado', type: 'boolean', initialValue: true },

    // Conteúdo Estruturado (Módulos e Aulas)
    {
      name: 'modules',
      title: 'Módulos',
      type: 'array',
      of: [{
        type: 'object',
        name: 'module',
        fields: [
          { name: 'title', title: 'Título do Módulo', type: 'string' },
          { name: 'content', title: 'Conteúdo do Módulo', type: 'text', description: 'Suporta Markdown' },
          {
            name: 'exercises',
            title: 'Exercícios do Módulo',
            type: 'array',
            of: [{
              type: 'object',
              fields: [
                { name: 'question', title: 'Pergunta', type: 'string' },
                { name: 'options', title: 'Opções', type: 'array', of: [{ type: 'string' }] },
                { name: 'correctAnswer', title: 'Resposta Correta', type: 'string' }
              ]
            }]
          }
        ]
      }]
    },

    // Exame Final para conclusão do curso
    {
      name: 'finalExam',
      title: 'Exame Final',
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

    // Metadados da IA (Para auditoria e logs)
    {
      name: 'aiMetadata',
      title: 'Metadados da IA',
      type: 'object',
      fields: [
        { name: 'provider', title: 'Provedor', type: 'string' }, // Ex: Groq
        { name: 'model', title: 'Modelo', type: 'string' },    // Ex: Llama 3.3
        { name: 'totalTokens', title: 'Total de Tokens', type: 'number' },
        { name: 'generatedAt', title: 'Gerado em', type: 'datetime' }
      ]
    }
  ]
}