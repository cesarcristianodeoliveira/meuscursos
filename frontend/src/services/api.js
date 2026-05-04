import axios from 'axios';

const api = axios.create({
  // Prioriza a variável de ambiente do deploy (Vercel/Netlify)
  // Certifique-se de configurar REACT_APP_API_URL no seu painel de controle do deploy
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 45000, // 45s para suportar gerações de IA
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * INTERCEPTOR DE REQUISIÇÃO
 * Garante que toda chamada leve o token mais atual do localStorage
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@IAcademy:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * INTERCEPTOR DE RESPOSTA
 * Centraliza o tratamento de erros globais
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, code } = error;

    // 1. Sessão Expirada ou Token Inválido (401)
    if (response && response.status === 401) {
      localStorage.removeItem('@IAcademy:token');
      
      // Em vez de forçar o redirecionamento aqui, deixamos o AuthContext 
      // ou os componentes de rota reagirem à falta do token/usuário.
      // Isso evita refreshs desnecessários na página.
      if (window.location.pathname !== '/entrar') {
         console.warn("Sessão expirada. Redirecionamento sugerido.");
      }
    }

    // 2. Erro de Timeout
    if (code === 'ECONNABORTED') {
      error.message = "A requisição demorou demais. Tente novamente em instantes.";
    }

    // 3. Falha de Conexão (Servidor Offline ou Sem Internet)
    if (!response) {
      error.message = "Não foi possível conectar ao servidor. Verifique sua conexão.";
    }

    return Promise.reject(error);
  }
);

export default api;