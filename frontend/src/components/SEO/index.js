import React from 'react';
import { Helmet } from 'react-helmet';
import { useSEO } from '../../contexts/SEOContext'; // Importe o hook do seu contexto

const SEO = () => {
  // Consome o estado de SEO atual do contexto
  const seo = useSEO(); 
  // O useSEO já mescla as props da página com os defaults, então 'seo' já contém tudo
  const { 
    title, 
    description, 
    keywords, 
    ogTitle, 
    ogDescription, 
    ogImage, 
    ogUrl, 
    canonicalUrl, 
    twitterCard,
    // Adicione outras propriedades de SEO se tiver, como twitterSite, twitterCreator
  } = seo;

  return (
    <Helmet>
      {/* Título da Página */}
      <title>{title}</title>

      {/* Meta Descrição */}
      <meta name="description" content={description} />

      {/* Meta Palavras-chave */}
      <meta name="keywords" content={keywords} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Meta Tags para Redes Sociais */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content="website" /> {/* Ou "article", etc. */}

      {/* Twitter Cards */}
      <meta name="twitter:card" content={twitterCard} /> 
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={ogImage} />
      {/* Adicione outros metatags de Twitter se tiver no seu seoState, como twitterSite, twitterCreator */}
    </Helmet>
  );
};

export default SEO;