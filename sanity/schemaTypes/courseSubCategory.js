// D:\meuscursos\sanity\schemas\courseSubCategory.js
export default {
  name: 'courseSubCategory',
  title: 'Course Subcategory',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Subcategory Title',
      type: 'string',
      description: 'The main title of the course subcategory (e.g., "Web Development", "Data Science").',
      validation: Rule => Rule.required().min(3).max(80) // Reabilitado e adicionado min/max para consistência
    },
    {
      name: 'slug',
      title: 'Subcategory Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      description: 'A unique, URL-friendly identifier for the course subcategory.',
      validation: Rule => Rule.required().unique() // Adicionado required e unique
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'A brief description of what courses this subcategory includes.',
    },
    {
      name: 'parentCategory', // Campo de referência para a categoria "pai"
      title: 'Parent Category',
      type: 'reference',
      to: [{ type: 'courseCategory' }], // Aponta para o schema 'courseCategory'
      validation: Rule => Rule.required(), // IMPORTANTE: Reabilitado - Uma subcategoria DEVE ter uma categoria pai
      description: 'The main category this subcategory belongs to.'
    }
  ],
  preview: {
    select: {
      title: 'title',
      parentCategoryTitle: 'parentCategory.title', // Mostra o título da categoria pai
      subtitle: 'description',
    },
    prepare(selection) {
      const { title, parentCategoryTitle, subtitle } = selection;
      return {
        title: title || 'New Course Subcategory',
        subtitle: parentCategoryTitle ? `${parentCategoryTitle} - ${subtitle ? subtitle.substring(0, 50) + '...' : 'No description'}` : (subtitle ? subtitle.substring(0, 50) + '...' : 'No description'),
      };
    },
  },
};
