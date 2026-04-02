export default {
  name: 'category',
  title: 'Categorias',
  type: 'document',
  fields: [
    { name: 'title', title: 'Título', type: 'string', validation: Rule => Rule.required() },
    { 
      name: 'slug', 
      title: 'Slug', 
      type: 'slug', 
      options: { source: 'title', maxLength: 96 },
      validation: Rule => Rule.required() 
    },
    { name: 'icon', title: 'Ícone (MUI Name)', type: 'string', description: 'Ex: School, Code, Palette' },
    { name: 'description', title: 'Descrição', type: 'text' }
  ]
}