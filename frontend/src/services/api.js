import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 30000, 
});

// Injeta o token se ele existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * INTERCEPTOR DE RESPOSTA
 * Se o token expirar (401), apenas limpamos o storage.
 * O AuthContext (que é um observer) fará o resto.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Apenas limpamos o token. 
      // Como o seu AuthContext usa esse estado para o "signed",
      // a interface vai reagir sozinha sem refresh.
      localStorage.removeItem('token');
      
      // Se você quiser ser muito rigoroso, pode disparar um evento customizado:
      // window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);

export default api;