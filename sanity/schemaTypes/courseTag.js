// D:\meuscursos\sanity\schemas\courseTag.js
export default {
  name: 'courseTag',
  title: 'Course Tag',
  type: 'document',
  fields: [
    {
      name: 'title', // RENOMEADO de 'name' para 'title' para consistência
      title: 'Tag Title', // Título do campo no Studio
      type: 'string',
      description: 'The display name of the course tag (e.g., "JavaScript", "SEO", "Cloud Computing").',
      validation: Rule => Rule.required().min(2).max(50)
    },
    {
      name: 'slug',
      title: 'Tag Slug',
      type: 'slug',
      options: {
        source: 'title', // ATUALIZADO para usar 'title' como fonte
        maxLength: 96,
      },
      description: 'A unique, URL-friendly identifier for the course tag.',
      validation: Rule => Rule.required().unique()
    },
    {
      name: 'description',
      title: 'Description (Optional)',
      type: 'text',
      description: 'An optional brief description for the tag, if needed for context or SEO.',
    },
    {
      name: 'categories',
      title: 'Associated Categories',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'courseCategory' }],
        },
      ],
      description: 'The categories this tag is primarily associated with.',
      validation: Rule => Rule.required().min(1).error('Every tag must be associated with at least one category.'),
    },
  ],
  preview: {
    select: {
      title: 'title', // ATUALIZADO para usar 'title'
      description: 'description', // Seleciona a descrição
      categories: 'categories', // Seleciona as referências de categoria
    },
    prepare(selection) {
      const { title, description, categories } = selection;
      const categoryCount = categories ? categories.length : 0;
      
      // Simplifica o subtítulo para ser mais conciso na lista do Sanity Studio
      let subtitleText = description ? `${description.substring(0, 40)}${description.length > 40 ? '...' : ''}` : 'No description';
      subtitleText += ` (${categoryCount} categories)`;

      return {
        title: title || 'New Course Tag',
        subtitle: subtitleText,
      };
    },
  },
};
