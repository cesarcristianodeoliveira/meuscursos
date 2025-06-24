// schemas/group.js
export default {
  name: 'group',
  title: 'Group',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Group Name',
      type: 'string',
      description: 'The official name of the group (e.g., "AI Enthusiasts", "Web Dev Masters").',
      // validation: Rule => Rule.required().min(3).max(100)
    },
    {
      name: 'slug',
      title: 'Group Slug',
      type: 'slug',
      options: {
        source: 'name',
        // maxLength: 96,
        isUnique: true,
      },
      description: 'A unique, URL-friendly identifier for the group.'
    },
    {
      name: 'description',
      title: 'Short Description',
      type: 'text',
      description: 'A brief overview of the group\'s purpose and focus.',
      // validation: Rule => Rule.max(300) // Limite para uma descrição concisa
    },
    {
      name: 'fullDescription', // Campo para descrição mais longa com Portable Text
      title: 'Full Description',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image' },
        // Pode adicionar outros tipos, como 'codeBlock' se for um grupo técnico
      ],
      description: 'A comprehensive description of the group, its rules, and activities.'
    },
    {
      name: 'image',
      title: 'Group Image/Banner',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'A compelling image or banner representing the group.'
    },
    {
      name: 'groupType', // Para diferenciar tipos de grupos (ex: público, privado, curso-específico)
      title: 'Group Type',
      type: 'string',
      options: {
        list: [
          { title: 'Public', value: 'public' },
          { title: 'Private', value: 'private' },
          { title: 'Exclusive (Pro Members)', value: 'exclusive' },
          { title: 'Course Specific', value: 'courseSpecific' },
        ],
        layout: 'radio',
      },
      initialValue: 'public',
      // validation: Rule => Rule.required(),
      description: 'Determines who can view and join the group.'
    },
    {
      name: 'moderators',
      title: 'Group Moderators',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'member' }] }],
      description: 'Members responsible for moderating this group.'
    },
    {
      name: 'members',
      title: 'Group Members',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'member' }] }],
      readOnly: true, // Geralmente preenchido por lógica de backend/frontend
      description: 'List of members belonging to this group (managed programmatically).'
    },
    {
      name: 'associatedCourses',
      title: 'Associated Courses',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'course' }] }],
      description: 'Courses directly associated with this group (e.g., a study group for specific courses).'
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        calendarTodayLabel: 'Today'
      },
      readOnly: true,
      initialValue: (new Date()).toISOString(),
      description: 'The date and time the group was created.'
    },
    {
      name: 'status', // Semelhante aos cursos e lições
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' }, // Para grupos em uso
          { title: 'Archived', value: 'archived' }, // Para grupos antigos/inativos
          { title: 'Private', value: 'private' }, // Para grupos que existem mas não são visíveis publicamente
          { title: 'Pending', value: 'pending' }, // Se grupos puderem ser propostos por usuários
        ],
        layout: 'radio',
      },
      initialValue: 'active',
      description: 'Current operational status of the group.'
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'groupType',
      media: 'image',
      memberCount: 'members.length',
      status: 'status',
    },
    prepare(selection) {
      const { title, subtitle, media, memberCount, status } = selection;
      return {
        title: title || 'New Group (Name Pending)',
        subtitle: `${subtitle ? subtitle : 'N/A'} ${memberCount ? `(${memberCount} members)` : ''} - ${status}`,
        media: media,
      };
    },
  },
};