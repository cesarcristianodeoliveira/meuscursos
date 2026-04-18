import axios from 'axios';

const api = axios.create({
  // Garante que a URL termine sem barra para evitar problemas de concatenação
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * INTERCEPTOR DE REQUISIÇÃO
 * Injeta o token mais recente do localStorage antes de cada chamada.
 */
api.interceptors.request.use((config) => {
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
 * Centraliza o tratamento de erros globais (401, 500, etc).
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Tratamento de Expiração de Sessão (401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      
      // Se não estivermos na página de login, redirecionamos ou forçamos reload
      // Isso ajuda o AuthContext a resetar o estado 'signed' instantaneamente
      if (!window.location.pathname.includes('/entrar')) {
        window.location.href = '/entrar?reason=session_expired';
      }
    }

    // 2. Tratamento de Erro de Conexão / Timeout
    if (!error.response) {
      console.error("🌐 Erro de rede ou servidor offline");
      // Você pode injetar uma mensagem amigável para o catch do componente
      error.message = "Não foi possível conectar ao servidor. Verifique sua internet.";
    }

    return Promise.reject(error);
  }
);

export default api;