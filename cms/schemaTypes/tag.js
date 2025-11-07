export default {
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    { name: 'title', title: 'Título', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 } },
    {
      name: 'subcategory',
      title: 'Subcategoria',
      type: 'reference',
      to: [{ type: 'subcategory' }]
    }
  ]
}
