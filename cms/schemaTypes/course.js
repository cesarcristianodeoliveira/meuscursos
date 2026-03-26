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
      options: { source: 'title', maxLength: 96 },
    },
    // --- CONTROLE DE IMAGEM E VÍDEO PRINCIPAL ---
    { 
      name: 'externalImageId', 
      title: 'ID da Imagem de Capa (API)', 
      type: 'string',
      description: 'ID original da imagem na API externa para evitar duplicidade.' 
    },
    {
      name: 'thumbnail',
      title: 'Miniatura (Capa)',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'videoFile',
      title: 'Arquivo de Vídeo do Curso (Upload)',
      type: 'file',
      options: { accept: 'video/*' }
    },
    {
      name: 'videoUrl',
      title: 'URL de Vídeo Externo (YouTube/Vimeo)',
      type: 'url',
    },
    // --- CATEGORIZAÇÃO E STATUS ---
    {
      name: 'category',
      title: 'Categoria',
      type: 'object',
      fields: [
        { name: 'name', title: 'Nome da Categoria', type: 'string' },
        { name: 'slug', title: 'Slug da Categoria', type: 'string' },
      ]
    },
    {
      name: 'level',
      title: 'Nível',
      type: 'string',
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
      of: [{ type: 'string' }],
      options: { layout: 'tags' }
    },
    {
      name: 'isPublished',
      title: 'Publicado',
      type: 'boolean',
      initialValue: true
    },
    // --- DESCRIÇÃO E MÉTRICAS DE ALUNOS ---
    {
      name: 'description',
      title: 'Descrição',
      type: 'text',
    },
    {
      name: 'enrolledCount',
      title: 'Alunos Inscritos',
      type: 'number',
      initialValue: 0,
    },
    {
      name: 'completedCount',
      title: 'Alunos que Concluíram',
      type: 'number',
      initialValue: 0,
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
    // --- DADOS DA IA ---
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
    // --- MÓDULOS (COM IMAGEM E VÍDEO POR AULA) ---
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
            // Multimídia por Aula
            { 
              name: 'moduleImage', 
              title: 'Imagem da Aula', 
              type: 'image', 
              options: { hotspot: true } 
            },
            { 
              name: 'externalImageId', 
              title: 'ID da Imagem da Aula (API)', 
              type: 'string' 
            },
            { 
              name: 'moduleVideo', 
              title: 'Vídeo da Aula (Upload)', 
              type: 'file', 
              options: { accept: 'video/*' } 
            },
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
    // --- EXAME FINAL ---
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