import axios from 'axios';

const api = axios.create({
  // Prioriza a variável de ambiente do deploy (Vercel/Netlify)
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 45000, // Aumentado para 45s para dar margem à geração de imagens da IA
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * INTERCEPTOR DE REQUISIÇÃO
 */
api.interceptors.request.use((config) => {
  // Migração: Se ainda existir o token com nome antigo, removemos para evitar lixo no storage
  if (localStorage.getItem('@IAcademy:token')) {
    localStorage.removeItem('@IAcademy:token');
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * INTERCEPTOR DE RESPOSTA
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, code } = error;

    // 1. Sessão Expirada ou Token Inválido (401)
    if (response && response.status === 401) {
      localStorage.removeItem('token');
      
      // Evita loops: Só redireciona se já não estiver na página de login
      const currentPath = window.location.pathname;
      if (currentPath !== '/entrar' && currentPath !== '/cadastro') {
        // Armazena a rota atual para redirecionar o usuário de volta após o login
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/entrar?session=expired&return=${returnUrl}`;
      }
    }

    // 2. Erro de Timeout (IA demorou demais)
    if (code === 'ECONNABORTED') {
      error.message = "A geração do conteúdo está demorando mais que o esperado. Verifique sua conexão ou tente um tema mais simples.";
    }

    // 3. Erros Críticos de Servidor (500+)
    if (response && response.status >= 500) {
      console.error("🔥 Erro crítico no servidor:", response.data);
    }

    // 4. Falha de Conexão (Servidor Offline ou Sem Internet)
    if (!response) {
      console.error("🌐 Falha de comunicação com a API");
      error.message = error.message || "Não foi possível conectar ao servidor. Verifique sua internet.";
    }

    return Promise.reject(error);
  }
);

export default api;