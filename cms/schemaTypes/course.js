export default {
  name: 'course',
  title: 'Cursos',
  type: 'document',
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
      readOnly: true,
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
      validation: Rule => Rule.required().min(20).max(800)
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
      initialValue: 100,
      validation: Rule => Rule.min(0)
    },
    { 
      name: 'estimatedTime', 
      title: 'Duração Total (min)', 
      type: 'number',
      fieldset: 'gamification',
      validation: Rule => Rule.min(1)
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
                { name: 'duration', title: 'Duração (min)', type: 'number', initialValue: 5 }
              ],
              preview: {
                select: { title: 'title', dur: 'duration' },
                prepare({ title, dur }) {
                  return { title: `${title}`, subtitle: `${dur || 5} min` }
                }
              }
            }]
          },
          {
            name: 'exercises',
            title: 'Quiz do Módulo',
            type: 'array',
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
        ],
        preview: {
          select: { title: 'title', lessons: 'lessons' },
          prepare({ title, lessons }) {
            return {
              title: title,
              subtitle: `${lessons?.length || 0} aulas neste módulo`
            }
          }
        }
      }]
    },

    {
      name: 'finalExam',
      title: 'Exame de Certificação (Final)',
      type: 'array',
      of: [{
        type: 'object',
        name: 'examQuestion',
        fields: [
          { name: 'question', title: 'Pergunta', type: 'string' },
          { name: 'options', title: 'Opções', type: 'array', of: [{ type: 'string' }] },
          { name: 'correctAnswer', title: 'Resposta Correta', type: 'string' }
        ]
      }]
    },

    // --- AUDITORIA IA ---
    {
      name: 'aiMetadata',
      title: 'Dados de Geração (IA)',
      type: 'object',
      readOnly: true,
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
        subtitle: `${(level || 'iniciante').toUpperCase()} | Por: ${author || 'Sistema'}`,
        media
      }
    }
  }
}