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
      validation: Rule => Rule.required().min(3).max(80) 
    },
    {
      name: 'slug',
      title: 'Subcategory Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        // CORREÇÃO AQUI: isUnique deve ser uma função que chama context.defaultIsUnique
        isUnique: (value, context) => context.defaultIsUnique(value, context), 
      },
      description: 'A unique, URL-friendly identifier for the course subcategory.',
      validation: Rule => Rule.required() // Removido .unique() daqui
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'A brief description of what courses this subcategory includes.',
    },
    {
      name: 'parentCategory', 
      title: 'Parent Category',
      type: 'reference',
      to: [{ type: 'courseCategory' }], 
      validation: Rule => Rule.required(), 
      description: 'The main category this subcategory belongs to.'
    }
  ],
  preview: {
    select: {
      title: 'title',
      parentCategoryTitle: 'parentCategory.title', 
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
