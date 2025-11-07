// src/services/pixabayService.js
const axios = require('axios');

const PIXABAY_KEY = process.env.PIXABAY_KEY;

async function searchImages(query, page = 1, per_page = 20) {
  if (!PIXABAY_KEY) throw new Error('PIXABAY_KEY não configurada no .env');

  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(
    query
  )}&image_type=photo&per_page=${per_page}&page=${page}`;

  const { data } = await axios.get(url);
  return data.hits;
}

module.exports = { searchImages };
