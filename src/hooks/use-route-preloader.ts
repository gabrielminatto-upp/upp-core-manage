import { lazy } from 'react';

// Preload das páginas mais visitadas
const routePreloaders = {
  '/': () => import('../pages/Index'),
  '/uppchannel': () => import('../pages/Uppchannel'),
  '/zapi': () => import('../pages/Zapi'),
  '/comercial': () => import('../pages/Comercial'),
  '/profile': () => import('../pages/Profile'),
  '/admin': () => import('../pages/Admin'),
  '/upphone': () => import('../pages/Upphone'),
};

export function useRoutePreloader() {
  const preloadRoute = (path: keyof typeof routePreloaders) => {
    if (routePreloaders[path]) {
      // Preload silenciosamente em background
      routePreloaders[path]().catch(() => {
        // Ignorar erros de preload
      });
    }
  };

  const preloadCommonRoutes = () => {
    // Preload das rotas mais comuns após um pequeno delay
    setTimeout(() => {
      preloadRoute('/');
      preloadRoute('/uppchannel');
      preloadRoute('/zapi');
      preloadRoute('/comercial');
    }, 1000);
  };

  return { preloadRoute, preloadCommonRoutes };
}