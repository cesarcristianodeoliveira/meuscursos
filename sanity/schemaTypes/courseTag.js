// schemas/courseTag.js
export default {
  name: 'courseTag',
  title: 'Course Tag',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Tag Name',
      type: 'string',
      description: 'The display name of the course tag (e.g., "JavaScript", "SEO", "Cloud Computing").',
      // validation: Rule => Rule.required().min(2).max(50) // Adicionei validação, se quiser
    },
    {
      name: 'slug',
      title: 'Tag Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      description: 'A unique, URL-friendly identifier for the course tag.',
      validation: Rule => Rule.required() // Adicionei validação, se quiser
    },
    {
      name: 'description',
      title: 'Description (Optional)',
      type: 'text',
      description: 'An optional brief description for the tag, if needed for context or SEO.',
    },
    {
      name: 'categories', // Mudei para 'categories' (plural) porque uma tag pode pertencer a múltiplas categorias
      title: 'Associated Categories',
      type: 'array', // Um array para permitir que uma tag seja relevante para várias categorias
      of: [
        {
          type: 'reference',
          to: [{ type: 'courseCategory' }],
        },
      ],
      description: 'The categories this tag is primarily associated with.',
      validation: Rule => Rule.required().min(1).error('Every tag must be associated with at least one category.'), // Requer pelo menos uma categoria
    },
    // Removi a sugestão de subCategory aqui por simplicidade.
    // Se uma tag é tão específica que só se aplica a uma subcategoria, ela provavelmente
    // já será implicada pela categoria pai, ou poderia ser uma tag mais genérica.
    // Você pode readicionar se realmente vir um caso de uso forte para isso no futuro.
  ],
  preview: {
    select: {
      title: 'name',
      categories: 'categories', // Para pré-visualizar as categorias
      subtitle: 'description',
    },
    prepare(selection) {
      const { title, categories, subtitle } = selection;
      const categoryNames = categories ? categories.map(cat => cat._ref).join(', ') : 'No categories'; // Isso mostra IDs, você precisaria de um JOIN para nomes se quisesse mostrar
      return {
        title: title || 'New Course Tag',
        subtitle: subtitle ? `${subtitle.substring(0, 50)}... (Categories: ${categoryNames})` : `No description (Categories: ${categoryNames})`,
      };
    },
  },
};