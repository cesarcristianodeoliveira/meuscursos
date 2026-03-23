export default {
  name: 'course',
  title: 'Cursos',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Título do Curso',
      type: 'string',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { 
        source: 'title', 
        maxLength: 96 
      },
    },
    {
      name: 'category',
      title: 'Categoria',
      type: 'object',
      fields: [
        { name: 'name', title: 'Nome da Categoria', type: 'string' },
        { 
          name: 'slug', 
          title: 'Slug da Categoria', 
          type: 'string', // ALTERADO: De 'slug' para 'string' para evitar erros de validação
        },
      ]
    },
    {
      name: 'thumbnail',
      title: 'Miniatura',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'description',
      title: 'Descrição',
      type: 'text',
    },
    {
      name: 'estimatedTime',
      title: 'Tempo Estimado (horas)',
      type: 'number',
    },
    {
      name: 'rating',
      title: 'Avaliação (Rating)',
      type: 'number',
    },
    {
      name: 'aiProvider',
      title: 'Provedor da IA',
      type: 'string',
    },
    {
      name: 'aiModel',
      title: 'Modelo da IA',
      type: 'string',
    },
    {
      name: 'stats',
      title: 'Métricas de Geração',
      type: 'object',
      fields: [
        { name: 'totalTokens', title: 'Total de Tokens', type: 'number' },
        { name: 'promptTokens', title: 'Tokens de Entrada', type: 'number' },
        { name: 'completionTokens', title: 'Tokens de Saída', type: 'number' },
        { name: 'generatedAt', title: 'Data de Geração', type: 'datetime' },
      ]
    },
    {
      name: 'modules',
      title: 'Módulos/Aulas',
      type: 'array',
      of: [
        { 
          type: 'object',
          name: 'module',
          fields: [
            { name: 'title', type: 'string', title: 'Título da Aula' },
            { name: 'content', type: 'text', title: 'Conteúdo (Markdown)' },
            {
              name: 'exercises',
              title: 'Exercícios de Fixação',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'question', title: 'Pergunta', type: 'string' },
                    { name: 'options', title: 'Opções', type: 'array', of: [{ type: 'string' }] },
                    { name: 'correctAnswer', title: 'Resposta Correta', type: 'string' }
                  ]
                }
              ]
            }
          ]
        }
      ],
    },
    {
      name: 'finalExam',
      title: 'Prova/Avaliação Final',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'question', title: 'Pergunta', type: 'string' },
            { name: 'options', title: 'Opções', type: 'array', of: [{ type: 'string' }] },
            { name: 'correctAnswer', title: 'Resposta Correta', type: 'string' }
          ]
        }
      ]
    },
  ],
};