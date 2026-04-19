export default {
  name: 'course',
  title: 'Cursos',
  type: 'document',
  // Organizamos os campos em grupos para facilitar a edição no Sanity Studio
  fieldsets: [
    { name: 'media', title: 'Identidade Visual', options: { collapsible: true, collapsed: false } },
    { name: 'gamification', title: 'Recompensas e Nível', options: { columns: 2 } },
    { name: 'config', title: 'Configurações de Publicação', options: { columns: 2 } }
  ],
  fields: [
    { 
      name: 'title', 
      title: 'Título do Curso', 
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

    // --- SEÇÃO DE MÍDIA ---
    { 
      name: 'thumbnail', 
      title: 'Capa do Curso', 
      type: 'image', 
      fieldset: 'media',
      options: { hotspot: true } 
    },
    { 
      name: 'externalImageId', 
      title: 'ID da Imagem (Pixabay)', 
      type: 'string',
      fieldset: 'media',
      readOnly: true, // Evita alteração manual de IDs de integração
      description: 'Identificador único da imagem no provedor externo.'
    },
    {
      name: 'imageSearchPrompt',
      title: 'Prompt de Busca da IA',
      type: 'string',
      fieldset: 'media',
      description: 'Termos em inglês usados para localizar esta imagem.'
    },

    { 
      name: 'description', 
      title: 'Descrição', 
      type: 'text', 
      rows: 3,
      validation: Rule => Rule.required().min(20).max(500)
    },
    
    // --- GAMIFICAÇÃO ---
    { 
      name: 'level', 
      title: 'Nível de Dificuldade', 
      type: 'string', 
      fieldset: 'gamification',
      options: { 
        list: [
          { title: 'Iniciante', value: 'iniciante' },
          { title: 'Intermediário', value: 'intermediario' },
          { title: 'Avançado', value: 'avancado' }
        ] 
      },
      initialValue: 'iniciante'
    },
    { 
      name: 'xpReward', 
      title: 'XP ao Concluir', 
      type: 'number', 
      fieldset: 'gamification',
      initialValue: 100 
    },
    { 
      name: 'estimatedTime', 
      title: 'Duração Total (min)', 
      type: 'number',
      fieldset: 'gamification' 
    },
    { 
      name: 'tags', 
      title: 'Tags / Palavras-chave', 
      type: 'array', 
      of: [{ type: 'string' }],
      options: { layout: 'tags' }
    },

    { 
      name: 'isPublished', 
      title: 'Publicado e Visível', 
      type: 'boolean', 
      fieldset: 'config',
      initialValue: true 
    },

    // --- CONTEÚDO ESTRUTURADO ---
    {
      name: 'modules',
      title: 'Grade Curricular (Módulos)',
      type: 'array',
      validation: Rule => Rule.required().min(1).error('O curso precisa de pelo menos um módulo.'),
      of: [{
        type: 'object',
        name: 'courseModule',
        fields: [
          { name: 'title', title: 'Nome do Módulo', type: 'string' },
          {
            name: 'lessons',
            title: 'Aulas do Módulo',
            type: 'array',
            of: [{
              type: 'object',
              name: 'lesson',
              fields: [
                { name: 'title', title: 'Título da Aula', type: 'string' },
                { name: 'content', title: 'Conteúdo Markdown', type: 'text' },
                { name: 'duration', title: 'Duração (min)', type: 'number' }
              ]
            }]
          },
          {
            name: 'exercises',
            title: 'Quiz Prático (Módulo)',
            type: 'array',
            description: 'Questões para fixação rápida.',
            of: [{
              type: 'object',
              name: 'exercise',
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

    {
      name: 'finalExam',
      title: 'Exame de Certificação (Final)',
      description: 'Avaliação final necessária para a conclusão do curso.',
      type: 'array',
      validation: Rule => Rule.min(1).warning('Cursos sem exame final não podem ser concluídos pelos alunos.'),
      of: [{
        type: 'object',
        name: 'examQuestion',
        fields: [
          { name: 'question', title: 'Pergunta', type: 'string' },
          { name: 'options', title: 'Opções de Resposta', type: 'array', of: [{ type: 'string' }] },
          { name: 'correctAnswer', title: 'Resposta Correta', type: 'string' }
        ]
      }]
    },

    // --- AUDITORIA IA ---
    {
      name: 'aiMetadata',
      title: 'Dados de Geração (IA)',
      type: 'object',
      readOnly: true, // Histórico de IA não deve ser editado manualmente
      fields: [
        { name: 'provider', title: 'Provedor', type: 'string' },
        { name: 'model', title: 'Modelo', type: 'string' },
        { name: 'totalTokens', title: 'Tokens Usados', type: 'number' },
        { name: 'generatedAt', title: 'Data da Geração', type: 'datetime' }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'thumbnail',
      level: 'level'
    },
    prepare({ title, author, media, level }) {
      return {
        title,
        subtitle: `${level.toUpperCase()} | Por: ${author || 'Sistema'}`,
        media
      }
    }
  }
}