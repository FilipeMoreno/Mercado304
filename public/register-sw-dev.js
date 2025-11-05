// Registrar Service Worker de desenvolvimento
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw-dev.js')
      .then((registration) => {
        console.log('[App] Service Worker registrado com sucesso:', registration.scope);
      })
      .catch((error) => {
        console.log('[App] Falha ao registrar Service Worker:', error);
      });
  });
}
