const CACHE_NAME = 'meus-cursos-cache-v1'; // Nome do cache para controle de versão
const urlsToCache = [
  '/', // A raiz do seu site
  '/index.html', // O arquivo HTML principal
  // Adicione aqui outros assets que seu aplicativo precisa para funcionar offline
  // Por exemplo, seus ícones:
  '/logo192.png',
  '/logo512.png',
  // Se você tiver um CSS principal ou JS que sempre carrega:
  // '/static/css/main.css',
  // '/static/js/bundle.js',
  // AVISO: Caminhos como '/static/js/bundle.js' são específicos de como o seu build os nomeia.
  // Você pode precisar verificar as URLs dos seus assets após o build para adicioná-los aqui.
  // Para começar, apenas os HTML e ícones já são um bom ponto de partida.
];

// O evento 'install' é disparado quando o Service Worker é instalado pela primeira vez.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  // waitUntil garante que o Service Worker não será instalado até que todas as promessas sejam resolvidas.
  event.waitUntil(
    caches.open(CACHE_NAME) // Abre um cache com o nome definido
      .then((cache) => {
        console.log('[Service Worker] Cache aberto. Adicionando URLs ao cache.');
        return cache.addAll(urlsToCache); // Adiciona todas as URLs definidas ao cache
      })
      .catch((error) => {
        console.error('[Service Worker] Falha ao adicionar URLs ao cache:', error);
      })
  );
});

// O evento 'fetch' é disparado toda vez que o navegador tenta buscar um recurso.
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são HTTP(S) (ex: chrome-extension://)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request) // Tenta encontrar a requisição no cache
      .then((response) => {
        // Se a requisição for encontrada no cache, retorna a resposta em cache.
        if (response) {
          console.log('[Service Worker] Recurso encontrado no cache:', event.request.url);
          return response;
        }

        // Caso contrário, busca a requisição na rede.
        console.log('[Service Worker] Recurso não encontrado no cache. Buscando na rede:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Se a busca na rede for bem-sucedida, clona a resposta e a adiciona ao cache.
            // Isso é útil para cachear novos recursos dinamicamente.
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Falha na busca de rede:', error);
            // Aqui você pode adicionar uma página offline fallback se quiser
            // return caches.match('/offline.html');
          });
      })
  );
});

// O evento 'activate' é disparado quando o Service Worker é ativado.
// Isso é um bom lugar para limpar caches antigos.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  const cacheWhitelist = [CACHE_NAME]; // Apenas o cache atual que queremos manter

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName); // Deleta caches que não estão na lista branca
          }
        })
      );
    })
  );
  // Garante que o Service Worker assume o controle da página imediatamente após a ativação.
  event.waitUntil(self.clients.claim());
});