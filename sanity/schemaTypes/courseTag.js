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
      validation: Rule => Rule.required().min(2).max(50).unique() // Adicionei .unique() aqui para garantir nomes únicos
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
      validation: Rule => Rule.required().unique() // Também garanta que o slug seja único
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
      // REMOVIDA A VALIDAÇÃO Rule.required().min(1) para permitir tags sem categoria inicial
      // Você pode adicionar de volta se quiser que TODAS as tags (incluindo as criadas manualmente)
      // tenham pelo menos uma categoria. Mas para as geradas por IA, pode ser um problema.
    },
  ],
  preview: {
    select: {
      title: 'name',
      categories: 'categories',
      subtitle: 'description',
    },
    prepare(selection) {
      const { title, categories, subtitle } = selection;
      // Para mostrar nomes de categorias na preview, você precisaria de um `deep query`
      // ou ter os nomes disponíveis. Por enquanto, mostrar IDs é ok para depuração.
      const categoryRefs = categories ? categories.map(cat => cat._ref).join(', ') : 'No categories';
      return {
        title: title || 'New Course Tag',
        subtitle: subtitle ? `${subtitle.substring(0, 50)}... (Categories: ${categoryRefs})` : `No description (Categories: ${categoryRefs})`,
      };
    },
  },
};