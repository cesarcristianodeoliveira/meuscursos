// D:\meuscursos\frontend\src\utils\slugify.js

import slugifyLib from 'slugify';

export const slugify = (text) => {
  if (!text) return '';
  return slugifyLib(text, {
    lower: true,
    strict: true,
    locale: 'pt'
  });
};
