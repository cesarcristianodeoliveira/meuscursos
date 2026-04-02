export default {
  name: 'review',
  title: 'Avaliações',
  type: 'document',
  fields: [
    { name: 'user', type: 'reference', to: [{ type: 'user' }] },
    { name: 'course', type: 'reference', to: [{ type: 'course' }] },
    { name: 'rating', type: 'number', validation: Rule => Rule.min(1).max(5) },
    { name: 'comment', type: 'text' },
    { name: 'createdAt', type: 'datetime', initialValue: (new Date()).toISOString() }
  ]
}