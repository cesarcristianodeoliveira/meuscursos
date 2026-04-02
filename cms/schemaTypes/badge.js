export default {
  name: 'badge',
  title: 'Conquistas (Badges)',
  type: 'document',
  fields: [
    { name: 'title', title: 'Título', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'description', title: 'Descrição', type: 'text' },
    { name: 'icon', title: 'Ícone (URL ou Image)', type: 'image', options: { hotspot: true } },
    { name: 'xpValue', title: 'XP de Bônus', type: 'number', initialValue: 50 },
    { 
      name: 'criteria', 
      title: 'Critério Interno', 
      type: 'string', 
      description: 'Código para o backend validar (ex: first_course, level_10)' 
    }
  ]
}