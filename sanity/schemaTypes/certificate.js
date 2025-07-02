// schemas/certificate.js
export default {
  name: 'certificate',
  title: 'Certificate',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Certificate Name',
      type: 'string',
      description: 'The title of the certificate (e.g., "Certificate of Completion: JavaScript Basics").',
      // validation: Rule => Rule.required().min(5).max(120)
    },
    {
      name: 'slug',
      title: 'Certificate Slug',
      type: 'slug',
      options: {
        source: 'name',
        // maxLength: 96,
      },
      description: 'A unique, URL-friendly identifier for the certificate.'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'A brief description of what this certificate represents.',
      // validation: Rule => Rule.max(300)
    },
    {
      name: 'associatedCourse',
      title: 'Associated Course',
      type: 'reference',
      to: [{ type: 'course' }],
      // validation: Rule => Rule.required(), // Um certificado deve estar ligado a um curso ou a um conjunto de cursos/trilha
      description: 'The course for which this certificate is awarded.'
    },
    {
      name: 'issuedTo',
      title: 'Issued To',
      type: 'reference',
      to: [{ type: 'member' }],
      readOnly: true, // Geralmente preenchido por lógica de backend após a conclusão do curso
      description: 'The member to whom this certificate was issued.'
    },
    {
      name: 'issueDate',
      title: 'Issue Date',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        calendarTodayLabel: 'Today'
      },
      readOnly: true, // Data de emissão é gerada quando o certificado é concedido
      initialValue: (new Date()).toISOString(),
      description: 'The date and time this certificate was issued.'
    },
    {
      name: 'uniqueId',
      title: 'Unique Certificate ID',
      type: 'string',
      readOnly: true, // ID gerado automaticamente para verificação
      description: 'A unique identifier for this specific certificate instance (for verification purposes).'
    },
    {
      name: 'templatePreview',
      title: 'Certificate Template Preview',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'An image preview of the certificate design template.',
    },
    {
      name: 'completionProgressRequired',
      title: 'Completion Progress Required (%)',
      type: 'number',
      description: 'The percentage of course completion required to earn this certificate (e.g., 100).',
      initialValue: 100,
      // validation: Rule => Rule.required().min(0).max(100).precision(0)
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' }, // Certificado que pode ser emitido
          { title: 'Deprecated', value: 'deprecated' }, // Versões antigas que não são mais emitidas
        ],
        layout: 'radio',
      },
      initialValue: 'active',
      description: 'Current status of the certificate template.'
    },
  ],
  preview: {
    select: {
      title: 'name',
      courseTitle: 'associatedCourse.title',
      issuedToName: 'issuedTo.name',
      issueDate: 'issueDate',
      status: 'status',
    },
    prepare(selection) {
      const { title, courseTitle, issuedToName, issueDate, status } = selection;
      const subtitleParts = [];
      if (courseTitle) subtitleParts.push(`Course: ${courseTitle}`);
      if (issuedToName) subtitleParts.push(`Issued To: ${issuedToName}`);
      if (issueDate) subtitleParts.push(`On: ${new Date(issueDate).toLocaleDateString()}`);
      if (status) subtitleParts.push(`(${status})`);

      return {
        title: title || 'New Certificate',
        subtitle: subtitleParts.join(' - '),
      };
    },
  },
};