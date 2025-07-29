// schemas/courseThumbnail.js
export default {
  name: 'courseThumbnail',
  title: 'Miniatura do Curso', // Traduzido
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Título da Miniatura', // Traduzido
      type: 'string',
      description: 'Um título descritivo para a miniatura (uso interno).' // Traduzido
    },
    {
      name: 'image',
      title: 'Imagem da Miniatura', // Traduzido
      type: 'image',
      options: {
        hotspot: true, // Permite selecionar o ponto focal para cortes de imagem
      },
      description: 'A imagem em si para a miniatura do curso.' // Traduzido
    },
    {
      name: 'altText',
      title: 'Texto Alternativo', // Traduzido
      type: 'string',
      description: 'Texto descritivo para acessibilidade da imagem.' // Traduzido
    },
    // Você pode adicionar outros campos aqui se precisar, como 'size', 'format', etc.
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
    prepare(selection) {
      const { title, media } = selection;
      return {
        title: title || 'Miniatura Sem Título', // Traduzido
        media: media,
      };
    },
  },
};
