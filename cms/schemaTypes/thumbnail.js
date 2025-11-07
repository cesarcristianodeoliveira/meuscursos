export default {
  name: 'thumbnail',
  title: 'Thumbnail',
  type: 'document',
  fields: [
    { name: 'title', title: 'Título', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 } },
    {
      name: 'course',
      title: 'Curso',
      type: 'reference',
      to: [{ type: 'course' }]
    },
    {
      name: 'image',
      title: 'Imagem',
      type: 'image',
      options: { hotspot: true }
    }
  ]
}
