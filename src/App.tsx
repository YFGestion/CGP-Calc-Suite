import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from 'react-i18next';
import i18n from './app/i18n';
import { ThemeProvider } from './app/theme';
import { AppLayout } from './app/AppLayout';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AboutPage from "./pages/About";
import BrutNetPage from "./modules/brutNet/Index";
import EndettementPage from "./modules/endettement/Index";
import EpargnePage from "./modules/epargne/Index";
import CreditPage from "./modules/credit/Index";
import ImmoPage from "./modules/immo/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Index />} />
                <Route path="brut-net" element={<BrutNetPage />} />
                <Route path="endettement" element={<EndettementPage />} />
                <Route path="epargne" element={<EpargnePage />} />
                <Route path="credit" element={<CreditPage />} />
                <Route path="immo" element={<ImmoPage />} />
                <Route path="about" element={<AboutPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

export default App;