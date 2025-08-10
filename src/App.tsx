import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Suspense, lazy } from "react";

const queryClient = new QueryClient();

// Substituir imports estáticos por lazy loading
const Index = lazy(() => import("./pages/Index"));
const Uppchannel = lazy(() => import("./pages/Uppchannel"));
const Upphone = lazy(() => import("./pages/Upphone"));
const NotFound = lazy(() => import("./pages/NotFound"));
const WorkflowCallback = lazy(() => import("./pages/WorkflowCallback"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainLayout>
          <Suspense fallback={<div>Carregando página...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/uppchannel" element={<Uppchannel />} />
              <Route path="/upphone" element={<Upphone />} />
              <Route
                path="/api/workflow-callback/:executionId"
                element={<WorkflowCallback />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
