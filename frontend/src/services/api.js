import axios from 'axios';

const api = axios.create({
  // Prioriza a variável de ambiente do deploy (Vercel/Netlify)
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 segundos (ideal para processos de IA que demoram)
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * INTERCEPTOR DE REQUISIÇÃO
 * Garante que cada chamada à API leve o token mais atualizado.
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
 * Gerencia erros de autenticação e falhas de rede de forma centralizada.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    // 1. Sessão Expirada ou Token Inválido (401)
    if (response && response.status === 401) {
      localStorage.removeItem('token');
      
      // Só redireciona se não estivermos já tentando logar
      if (!window.location.pathname.includes('/entrar')) {
        // O uso do window.location força o reset de todos os estados do React
        // garantindo que não sobrem dados do usuário anterior na memória.
        window.location.href = '/entrar?session=expired';
      }
    }

    // 2. Erros Críticos de Servidor (500+)
    if (response && response.status >= 500) {
      console.error("🔥 Erro crítico no servidor:", response.data);
    }

    // 3. Falha de Conexão (Servidor Offline ou Sem Internet)
    if (!response) {
      console.error("🌐 Falha de comunicação com a API");
      error.message = "Conexão perdida. Verifique se o servidor está online.";
    }

    return Promise.reject(error);
  }
);

export default api;