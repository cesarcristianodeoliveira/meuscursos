export default {
  name: 'enrollment',
  title: 'Matrículas e Progresso',
  type: 'document',
  fields: [
    { 
      name: 'user',
      title: 'Usuário', 
      type: 'reference', 
      to: [{ type: 'user' }],
      validation: Rule => Rule.required()
    },
    { 
      name: 'course', 
      title: 'Curso', 
      type: 'reference', 
      to: [{ type: 'course' }],
      validation: Rule => Rule.required()
    },
    { 
      name: 'completedLessons',
      title: 'Aulas Concluídas', 
      type: 'array', 
      of: [{ type: 'string' }],
      description: 'Armazena os _keys das aulas terminadas'
    },
    { 
      name: 'status',
      title: 'Status', 
      type: 'string',
      options: {
        list: [
          { title: 'Em Andamento', value: 'em_andamento' },
          { title: 'Concluído', value: 'concluido' }
        ]
      },
      initialValue: 'em_andamento'
    },
    { 
      name: 'startDate',
      title: 'Data de Início', 
      type: 'datetime',
      initialValue: (new Date()).toISOString()
    },
    { 
      name: 'finalScore', 
      title: 'Nota no Exame', 
      type: 'number' 
    },
    {
      name: 'completionDate',
      title: 'Data de Conclusão',
      type: 'datetime'
    }
  ],
  preview: {
    select: {
      userTitle: 'user.name',
      userEmail: 'user.email',
      courseTitle: 'course.title',
      completedCount: 'completedLessons.length'
    },
    prepare({ userTitle, userEmail, courseTitle, completedCount }) {
      return {
        title: `${userTitle || 'Usuário'} -> ${courseTitle || 'Sem Curso'}`,
        subtitle: `${userEmail} | ${completedCount || 0} aulas concluídas`,
      };
    }
  }
}