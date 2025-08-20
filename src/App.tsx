import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Suspense, lazy } from "react";

const queryClient = new QueryClient();

// Substituir imports estáticos por lazy loading
const Index = lazy(() => import("./pages/Index"));
const Uppchannel = lazy(() => import("./pages/Uppchannel"));
const Upphone = lazy(() => import("./pages/Upphone"));
const Zapi = lazy(() => import("./pages/Zapi"));
const NotFound = lazy(() => import("./pages/NotFound"));
const WorkflowCallback = lazy(() => import("./pages/WorkflowCallback"));
const Auth = lazy(() => import("./pages/Auth"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div>Carregando página...</div>}>
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
