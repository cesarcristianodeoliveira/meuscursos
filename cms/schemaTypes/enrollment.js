export default {
  name: 'enrollment',
  title: 'Matrículas e Progresso',
  type: 'document',
  fields: [
    { 
      name: 'user',
      title: 'Usuário', 
      type: 'reference', 
      to: [{ type: 'user' }] 
    },
    { 
      name: 'course', 
      title: 'Curso', 
      type: 'reference', 
      to: [{ type: 'course' }] 
    },
    { 
      name: 'completedLessons',
      title: 'Aulas Concluídas', 
      type: 'array', 
      of: [{ type: 'string' }] 
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
      type: 'datetime' 
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
  ]
}