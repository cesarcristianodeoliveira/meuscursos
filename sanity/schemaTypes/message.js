// schemas/message.js
export default {
  name: 'message',
  title: 'Message',
  type: 'document',
  fields: [
    {
      name: 'subject',
      title: 'Subject',
      type: 'string',
      description: 'The subject line of the message.',
      // validation: Rule => Rule.required().min(5).max(200)
    },
    {
      name: 'sender',
      title: 'Sender',
      type: 'reference',
      to: [{ type: 'member' }],
      // validation: Rule => Rule.required(),
      description: 'The member who sent this message.'
    },
    {
      name: 'recipients', // Pode ser um ou vários destinatários
      title: 'Recipients',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'member' }] }],
      // validation: Rule => Rule.required().min(1),
      description: 'The member(s) who received this message.'
    },
    {
      name: 'content',
      title: 'Message Content',
      type: 'array',
      of: [
        { type: 'block' }, // Permite rich text para o corpo da mensagem
      ],
      description: 'The main body of the message.',
      // validation: Rule => Rule.required().min(10)
    },
    {
      name: 'sentAt',
      title: 'Sent At',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        calendarTodayLabel: 'Today'
      },
      readOnly: true, // Data de envio é definida pelo sistema
      initialValue: (new Date()).toISOString(),
      description: 'The date and time the message was sent.'
    },
    {
      name: 'readBy', // Para rastrear quem já leu a mensagem (para múltiplos destinatários)
      title: 'Read By',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'member' }] }],
      readOnly: true, // Gerenciado por lógica de backend/frontend
      description: 'List of members who have read this message.'
    },
    {
      name: 'messageType', // Para categorizar mensagens (ex: suporte, notificação, privado)
      title: 'Message Type',
      type: 'string',
      options: {
        list: [
          { title: 'Direct Message', value: 'direct' },
          { title: 'Notification', value: 'notification' },
          { title: 'Support Ticket', value: 'support' },
          { title: 'Announcement', value: 'announcement' },
        ],
        layout: 'radio',
      },
      initialValue: 'direct',
      description: 'The category or purpose of this message.'
    },
    {
      name: 'status', // Para rastrear o status da mensagem (ex: enviada, rascunho, lida, arquivada)
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Sent', value: 'sent' },
          { title: 'Draft', value: 'draft' },
          { title: 'Archived', value: 'archived' },
          // Não teremos 'read' aqui porque 'readBy' já faz isso para múltiplos
        ],
        layout: 'radio',
      },
      initialValue: 'sent',
      description: 'Current status of the message.'
    },
    {
      name: 'inReplyTo', // Para encadeamento de conversas
      title: 'In Reply To (Message ID)',
      type: 'reference',
      to: [{ type: 'message' }],
      description: 'If this message is a reply, link to the original message.',
    },
  ],
  preview: {
    select: {
      title: 'subject',
      senderName: 'sender.name',
      recipientNames: 'recipients', // Seleciona o array para processamento
      sentAt: 'sentAt',
      messageType: 'messageType',
      status: 'status',
      readByCount: 'readBy.length', // Para indicar quantos leram
    },
    prepare(selection) {
      const { title, senderName, recipientNames, sentAt, messageType, status, readByCount } = selection;
      // Para exibir os nomes dos destinatários no preview
      const recipientList = recipientNames ? recipientNames.map(rec => rec._ref).join(', ') : 'No Recipients'; // Isso mostrará IDs, idealmente buscaríamos nomes no frontend
      const previewTitle = `${title || 'No Subject'} (${messageType})`;
      const previewSubtitle = `From: ${senderName || 'N/A'} | To: ${recipientNames?.length || 0} recipient(s) | Sent: ${new Date(sentAt).toLocaleDateString()} | Status: ${status} | Read by: ${readByCount || 0}`;

      return {
        title: previewTitle,
        subtitle: previewSubtitle,
        // media: 'icon' // Se houver um ícone para o tipo de mensagem
      };
    },
  },
};