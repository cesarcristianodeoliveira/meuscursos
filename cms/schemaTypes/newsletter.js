export default {
  name: 'newsletter',
  title: 'Boletim Informativo',
  type: 'document',
  fields: [
    {
      name: 'user',
      title: 'Usuário',
      type: 'reference',
      to: [{ type: 'user' }],
      description: 'Vínculo com o cadastro do usuário'
    },
    {
      name: 'email',
      title: 'E-mail de Inscrição',
      type: 'string',
    },
    {
      name: 'subscribedAt',
      title: 'Data da Inscrição',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    }
  ],
  preview: {
    select: {
      title: 'user.name',
      subtitle: 'email'
    }
  }
}