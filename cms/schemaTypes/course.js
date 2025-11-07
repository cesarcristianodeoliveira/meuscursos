export default {
  name: 'course',
  title: 'Curso',
  type: 'document',
  fields: [
    { name: 'title', title: 'Título', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 } },
    { name: 'description', title: 'Descrição', type: 'text' },

    {
      name: 'category',
      title: 'Categoria',
      type: 'reference',
      to: [{ type: 'category' }]
    },
    {
      name: 'subcategory',
      title: 'Subcategoria',
      type: 'reference',
      to: [{ type: 'subcategory' }]
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }]
    },

    {
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'reference',
      to: [{ type: 'thumbnail' }]
    },

    {
      name: 'video',
      title: 'Vídeo do Curso',
      type: 'reference',
      to: [{ type: 'video' }]
    },

    {
      name: 'modules',
      title: 'Módulos',
      type: 'array',
      of: [{
        type: 'object',
        title: 'Módulo',
        fields: [
          { name: 'title', title: 'Título', type: 'string' },
          { name: 'description', title: 'Descrição', type: 'text' },
          {
            name: 'lessons',
            title: 'Lições',
            type: 'array',
            of: [{
              type: 'object',
              title: 'Lição',
              fields: [
                { name: 'title', title: 'Título da Lição', type: 'string' },
                { name: 'content', title: 'Conteúdo', type: 'text' },
                { name: 'tips', title: 'Dicas', type: 'array', of: [{ type: 'text' }] },
                {
                  name: 'exercises',
                  title: 'Exercícios',
                  type: 'array',
                  of: [{
                    type: 'object',
                    title: 'Exercício',
                    fields: [
                      { name: 'question', title: 'Pergunta', type: 'text' },
                      { name: 'answer', title: 'Resposta', type: 'text' },
                      { name: 'options', title: 'Opções', type: 'array', of: [{ type: 'string' }] }
                    ]
                  }]
                }
              ]
            }]
          }
        ]
      }]
    },

    { name: 'duration', title: 'Duração (em minutos)', type: 'number' },

    {
      name: 'certificate',
      title: 'Certificado (JSON - Fabric.js ou Canvas)',
      type: 'text'
    },

    {
      name: 'audioMasculino',
      title: 'Áudio Masculino (mp3)',
      type: 'file',
      options: { accept: 'audio/mpeg' }
    },
    {
      name: 'audioFeminino',
      title: 'Áudio Feminino (mp3)',
      type: 'file',
      options: { accept: 'audio/mpeg' }
    },

    { name: 'provider', title: 'Provider (API usada)', type: 'string' },

    {
      name: 'level',
      title: 'Nível',
      type: 'string',
      options: {
        list: [
          { title: 'Iniciante', value: 'beginner' },
          { title: 'Intermediário', value: 'intermediate' },
          { title: 'Avançado', value: 'advanced' }
        ]
      }
    },

    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Rascunho', value: 'draft' },
          { title: 'Publicado', value: 'published' },
          { title: 'Arquivado', value: 'archived' }
        ]
      },
      initialValue: 'published'
    }
  ]
}
