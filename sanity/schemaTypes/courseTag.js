// schemas/courseTag.js
export default {
  name: 'courseTag', // Nome interno do schema
  title: 'Course Tag', // Título exibido no Sanity Studio
  type: 'document',
  fields: [
    {
      name: 'name', // Usamos 'name' para o texto da tag
      title: 'Tag Name',
      type: 'string',
      description: 'The display name of the course tag (e.g., "JavaScript", "SEO", "Cloud Computing").',
      // validation: Rule => Rule.required().min(2).max(50) // Validação básica para o nome
    },
    {
      name: 'slug',
      title: 'Tag Slug',
      type: 'slug',
      options: {
        source: 'name', // Gerar slug a partir do 'name' da tag
        // maxLength: 96,
        isUnique: true,
      },
      description: 'A unique, URL-friendly identifier for the course tag.'
    },
    {
      name: 'description',
      title: 'Description (Optional)',
      type: 'text',
      description: 'An optional brief description for the tag, if needed for context or SEO.',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
    },
    prepare(selection) {
      const { title, subtitle } = selection;
      return {
        title: title || 'New Course Tag',
        subtitle: subtitle ? `${subtitle.substring(0, 50)}...` : 'No description',
      };
    },
  },
};