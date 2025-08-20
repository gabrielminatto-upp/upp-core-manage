import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { Suspense, lazy, useEffect } from "react";
import { PageLoadingSkeleton } from "@/components/loading/PageLoadingSkeleton";
import { useRoutePreloader } from "@/hooks/use-route-preloader";

// Configuração otimizada do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});

// Substituir imports estáticos por lazy loading
const Index = lazy(() => import("./pages/Index"));
const Uppchannel = lazy(() => import("./pages/Uppchannel"));
const Upphone = lazy(() => import("./pages/Upphone"));
const Zapi = lazy(() => import("./pages/Zapi"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const WorkflowCallback = lazy(() => import("./pages/WorkflowCallback"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));

// Componente interno para usar o hook de preload
function AppContent() {
  const { preloadCommonRoutes } = useRoutePreloader();

  useEffect(() => {
    // Preload das rotas mais comuns após o carregamento inicial
    preloadCommonRoutes();
  }, [preloadCommonRoutes]);

  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Index />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/uppchannel"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Uppchannel />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upphone"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Upphone />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/zapi"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Zapi />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <MainLayout>
                        <Admin />
                      </MainLayout>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api/workflow-callback/:executionId"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <WorkflowCallback />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RoleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </RoleProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
