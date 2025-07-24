// D:\meuscursos\sanity\schemas\courseTag.js
export default {
  name: 'courseTag',
  title: 'Course Tag',
  type: 'document',
  fields: [
    {
      name: 'title', 
      title: 'Tag Title', 
      type: 'string',
      description: 'The display name of the course tag (e.g., "JavaScript", "SEO", "Cloud Computing").',
      validation: Rule => Rule.required().min(3).max(50) 
    },
    {
      name: 'slug',
      title: 'Tag Slug',
      type: 'slug',
      options: {
        source: 'title', 
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      description: 'A unique, URL-friendly identifier for the course tag.',
      validation: Rule => Rule.required() 
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
          // CORREÇÃO AQUI: Agora aceita referências para ambos os tipos
          to: [{ type: 'courseCategory' }, { type: 'courseSubCategory' }], 
        },
      ],
      // Atualizado a mensagem de validação para refletir que pode ser categoria OU subcategoria
      description: 'The categories and/or subcategories this tag is primarily associated with.',
      validation: Rule => Rule.required().min(1).error('Every tag must be associated with at least one category or subcategory.'),
    },
  ],
  preview: {
    select: {
      title: 'title', 
      description: 'description', 
      categories: 'categories', 
    },
    prepare(selection) {
      const { title, description, categories } = selection;
      const categoryCount = categories ? categories.length : 0;
      
      let subtitleText = description ? `${description.substring(0, 40)}${description.length > 40 ? '...' : ''}` : 'No description';
      // Alterado para ser mais genérico, já que agora associa subcategorias também
      subtitleText += ` (${categoryCount} associations)`; 

      return {
        title: title || 'New Course Tag',
        subtitle: subtitleText,
      };
    },
  },
};
