export default {
  name: 'video',
  title: 'Vídeo',
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
      name: 'file',
      title: 'Arquivo de Vídeo',
      type: 'file',
      options: { accept: 'video/mp4' }
    }
  ]
}
