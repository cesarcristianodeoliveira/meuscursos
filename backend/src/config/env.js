require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID,
  SANITY_DATASET: process.env.SANITY_DATASET || 'production',
  SANITY_API_VERSION: process.env.SANITY_API_VERSION,
  SANITY_TOKEN: process.env.SANITY_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PIXABAY_API_KEY: process.env.PIXABAY_KEY
};
