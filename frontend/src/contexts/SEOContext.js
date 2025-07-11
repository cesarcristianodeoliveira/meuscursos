import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 1. Criação do Contexto
const SEOContext = createContext();

// Valores padrão para o SEO de todo o site
const defaultSEO = {
  title: "Meus Cursos Online",
  description: "Aprenda e desenvolva suas habilidades com nossos cursos online de alta qualidade. Plataforma completa para seu desenvolvimento profissional e pessoal.",
  keywords: "cursos, online, educação, desenvolvimento, programação, tecnologia, aulas",
  ogTitle: "Meus Cursos Online: Plataforma de Aprendizagem e Desenvolvimento",
  ogDescription: "Descubra cursos online de alta qualidade e acelere seu desenvolvimento em diversas áreas.",
  ogImage: "https://seusite.com.br/imagens/social-share-default.jpg", // SUBSTITUA PELA SUA IMAGEM PADRÃO
  ogUrl: "https://seusite.com.br", // SUBSTITUA PELA URL BASE DO SEU SITE
  canonicalUrl: "https://seusite.com.br", // SUBSTITUA PELA URL CANÔNICA BASE DO SEU SITE
  twitterCard: "summary_large_image",
  // twitterSite: "@seuarroba", // Opcional: seu handle do Twitter
  // twitterCreator: "@seuarrobadocriador", // Opcional: handle do criador do conteúdo
};

// 2. Provedor do Contexto
export const SEOProvider = ({ children }) => {
  const [seoState, setSeoState] = useState(defaultSEO);

  // Função para atualizar as propriedades de SEO
  const updateSEO = useCallback((newSEOProps) => {
    setSeoState(prevState => ({
      ...prevState, // Mantém os valores atuais (padrão ou os já definidos)
      ...newSEOProps, // Sobrescreve com os novos valores
    }));
  }, []);

  // Reseta o SEO para os padrões ao *montar* o provedor (garante um estado limpo inicial)
  // O reset específico de uma página é feito pelo `updateSEO` da próxima página
  useEffect(() => {
    setSeoState(defaultSEO);
  }, []); // Executa apenas na montagem inicial do provedor

  return (
    <SEOContext.Provider value={{ seo: seoState, updateSEO }}>
      {children}
    </SEOContext.Provider>
  );
};

// 3. Hook Personalizado para Consumir o Contexto
export const useSEO = (pageSEOProps = {}) => {
  const context = useContext(SEOContext);
  if (!context) {
    throw new Error('useSEO must be used within an SEOProvider');
  }

  const { seo, updateSEO } = context;

  // Usa useEffect para atualizar o SEO do contexto quando as props da página mudarem
  // ou quando o componente da página for montado.
  useEffect(() => {
    updateSEO(pageSEOProps);
    // Limpeza: Ao desmontar o componente da página, se desejarmos que o SEO volte
    // para o padrão global, poderíamos chamar updateSEO com um objeto vazio ou
    // com os defaults. No entanto, o fluxo de navegação do React Router DOM
    // garante que o próximo componente de página (que também usará useSEO)
    // sobrescreva o SEO imediatamente. O reset no provedor garante o início limpo.
    return () => {
      // Opcional: Para ter certeza absoluta de que não fica um "rastro" de SEO de uma página
      // em páginas que não usam useSEO, você pode fazer:
      // updateSEO({}); // Isso mesclaria com os defaults novamente
    };
  }, [pageSEOProps, updateSEO]);

  return seo; // Retorna o estado atual do SEO (mesclado)
};