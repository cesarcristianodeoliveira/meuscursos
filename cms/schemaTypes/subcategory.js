export default {
  name: 'subcategory',
  title: 'Subcategoria',
  type: 'document',
  fields: [
    { name: 'title', title: 'Título', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 } },
    { name: 'description', title: 'Descrição', type: 'text' },
    { name: 'icon', title: 'Ícone (Material Icon)', type: 'string' },
    {
      name: 'category',
      title: 'Categoria',
      type: 'reference',
      to: [{ type: 'category' }]
    }
  ]
}
