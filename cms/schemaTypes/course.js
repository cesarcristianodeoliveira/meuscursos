export default {
  name: 'course',
  title: 'Cursos',
  type: 'document',
  groups: [
    { name: 'content', title: 'Conteúdo Principal' },
    { name: 'media', title: 'Multimídia' },
    { name: 'stats', title: 'Métricas e Alunos' },
    { name: 'ai', title: 'Dados da IA' },
  ],
  fields: [
    {
      name: 'title',
      title: 'Título do Curso',
      type: 'string',
      group: 'content',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
    },
    {
      name: 'author',
      title: 'Autor/Criador',
      type: 'reference',
      to: [{ type: 'user' }],
      group: 'content',
      description: 'Usuário que gerou ou é dono deste curso.'
    },

    // --- CATEGORIZAÇÃO E STATUS ---
    {
      name: 'category',
      title: 'Categoria',
      type: 'object',
      group: 'content',
      fields: [
        { name: 'name', title: 'Nome da Categoria', type: 'string' },
        { name: 'slug', title: 'Slug da Categoria', type: 'string' },
      ]
    },
    {
      name: 'level',
      title: 'Nível',
      type: 'string',
      group: 'content',
      options: { 
        list: [
          { title: 'Iniciante', value: 'iniciante' },
          { title: 'Intermediário', value: 'intermediario' },
          { title: 'Avançado', value: 'avancado' }
        ],
        layout: 'radio' 
      },
      initialValue: 'iniciante'
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'content',
      of: [{ type: 'string' }],
      options: { layout: 'tags' }
    },
    {
      name: 'description',
      title: 'Descrição',
      type: 'text',
      group: 'content',
    },

    // --- MULTIMÍDIA ---
    {
      name: 'thumbnail',
      title: 'Miniatura (Capa)',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
    },
    { 
      name: 'externalImageId', 
      title: 'ID da Imagem de Capa (API)', 
      type: 'string',
      group: 'media',
    },
    {
      name: 'videoUrl',
      title: 'URL de Vídeo Externo (YouTube/Vimeo)',
      type: 'url',
      group: 'media',
    },
    {
      name: 'videoFile',
      title: 'Arquivo de Vídeo do Curso (Upload)',
      type: 'file',
      group: 'media',
      options: { accept: 'video/*' }
    },
    {
      name: 'audioFile',
      title: 'Arquivo de Áudio do Curso (Upload)',
      type: 'file',
      group: 'media',
      options: { accept: 'audio/*' },
    },

    // --- MÓDULOS (AULAS) ---
    {
      name: 'modules',
      title: 'Módulos/Aulas',
      type: 'array',
      group: 'content',
      of: [
        { 
          type: 'object',
          name: 'module',
          fields: [
            { name: 'title', type: 'string', title: 'Título da Aula' },
            { name: 'content', type: 'text', title: 'Conteúdo (Markdown)' },
            { name: 'moduleImage', title: 'Imagem da Aula', type: 'image', options: { hotspot: true } },
            { name: 'externalImageId', title: 'ID da Imagem da Aula (API)', type: 'string' },
            { name: 'exercises', title: 'Exercícios de Fixação', type: 'array', of: [
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

    // --- EXAME FINAL ---
    {
      name: 'finalExam',
      title: 'Prova/Avaliação Final',
      type: 'array',
      group: 'content',
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

    // --- MÉTRICAS E ALUNOS (CORREÇÃO DOS WARNINGS) ---
    {
      name: 'enrolledStudents',
      title: 'Alunos Inscritos (Referências)',
      type: 'array',
      group: 'stats',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],
    },
    {
      name: 'completedStudents',
      title: 'Alunos que Concluíram (Referências)',
      type: 'array',
      group: 'stats',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],
    },
    {
      name: 'enrolledCount',
      title: 'Contador de Inscritos',
      type: 'number',
      group: 'stats',
      initialValue: 0,
    },
    {
      name: 'completedCount',
      title: 'Contador de Concluídos',
      type: 'number',
      group: 'stats',
      initialValue: 0,
    },
    {
      name: 'estimatedTime',
      title: 'Tempo Estimado (horas)',
      type: 'number',
      group: 'stats',
    },
    {
      name: 'rating',
      title: 'Avaliação (Rating)',
      type: 'number',
      group: 'stats',
    },

    // --- DADOS DA IA ---
    {
      name: 'aiProvider',
      title: 'Provedor da IA',
      type: 'string',
      group: 'ai',
    },
    {
      name: 'aiModel',
      title: 'Modelo da IA',
      type: 'string',
      group: 'ai',
    },
    {
      name: 'stats',
      title: 'Métricas de Geração',
      type: 'object',
      group: 'ai',
      fields: [
        { name: 'totalTokens', title: 'Total de Tokens', type: 'number' },
        { name: 'promptTokens', title: 'Tokens de Entrada', type: 'number' },
        { name: 'completionTokens', title: 'Tokens de Saída', type: 'number' },
        { name: 'generatedAt', title: 'Data de Geração', type: 'datetime' },
      ]
    },
    {
      name: 'isPublished',
      title: 'Publicado',
      type: 'boolean',
      group: 'ai',
      initialValue: true
    },
  ],
};