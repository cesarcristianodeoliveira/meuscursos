// schemas/courseRating.js
export default {
  name: 'courseRating',
  title: 'Course Rating',
  type: 'document',
  fields: [
    {
      name: 'member',
      title: 'Member',
      type: 'reference',
      to: [{ type: 'member' }],
      // validation: Rule => Rule.required(),
      description: 'The member who provided this rating.'
    },
    {
      name: 'course',
      title: 'Course',
      type: 'reference',
      to: [{ type: 'course' }],
      // validation: Rule => Rule.required(),
      description: 'The course that received this rating.',
    },
    {
      name: 'stars',
      title: 'Stars',
      type: 'number',
      // validation: Rule => Rule.required().min(1).max(5).integer(),
      description: 'The rating given to the course (1 to 5 stars).'
    },
    {
      name: 'comment',
      title: 'Comment',
      type: 'text',
      description: 'Optional textual feedback from the member.',
    },
    {
      name: 'createdAt',
      title: 'Rated At',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        calendarTodayLabel: 'Today'
      },
      readOnly: true,
      initialValue: (new Date()).toISOString(), // Define a data/hora atual por padrão
      description: 'The date and time the rating was submitted.'
    },
    {
      name: 'status', // Para moderação de reviews
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Approved', value: 'approved' },
          { title: 'Pending', value: 'pending' },
          { title: 'Rejected', value: 'rejected' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending', // Novas avaliações podem precisar de aprovação
      description: 'Status of the rating (e.g., pending moderation, approved).'
    }
  ],
  preview: {
    select: {
      title: 'course.title',
      subtitle: 'member.name',
      stars: 'stars',
      status: 'status',
    },
    prepare(selection) {
      const { title, subtitle, stars, status } = selection;
      return {
        title: `${stars} Stars for ${title || 'Unknown Course'}`,
        subtitle: `By ${subtitle || 'Anonymous Member'} (${status})`,
      };
    },
  },
};