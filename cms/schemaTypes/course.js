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
      type: 'string',
    },
    {
      name: 'thumbnail',
      title: 'Miniatura',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'description',
      title: 'Descrição',
      type: 'text',
    },
    {
      name: 'modules',
      title: 'Módulos/Aulas',
      type: 'array',
      of: [
        { 
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Título da Aula' },
            { 
              name: 'content', 
              type: 'text',
              title: 'Conteúdo (Markdown)'
            }
          ]
        }
      ],
    },
  ],
};