// src/routes/pixabay.js
const express = require('express');
const router = express.Router();
const { searchImages } = require('../services/pixabayService');

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || req.query.query || '';
    const page = parseInt(req.query.page || '1', 10);
    const per_page = parseInt(req.query.per_page || '20', 10);
    const results = await searchImages(q, page, per_page);
    res.json({ hits: results });
  } catch (err) {
    console.error('pixabay/search error', err);
    res.status(500).json({ error: 'Erro ao buscar imagens no Pixabay' });
  }
});

module.exports = router;
