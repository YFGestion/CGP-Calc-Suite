import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from 'react-i18next';
import i18n from './app/i18n';
import { AppLayout } from './app/AppLayout';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AboutPage from "./pages/About";
import SettingsPage from "./pages/Settings";
import EndettementPage from "./modules/endettement/Index";
import EpargnePage from "./modules/epargne/Index";
import CreditPage from "./modules/credit/Index";
import ImmoPage from "./modules/immo/Index";
import AutresCalculsPage from "./modules/autresCalculs/Index";
import ScenarioHistory from "./components/ScenarioHistory";
import LoginPage from "./pages/Login"; // New import
import DashboardPage from "./pages/Dashboard"; // New import
import { SessionContextProvider } from "./components/SessionContextProvider"; // New import

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider> {/* Wrap the entire app with SessionContextProvider */}
            <Routes>
              <Route path="/login" element={<LoginPage />} /> {/* Login page outside AppLayout */}
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Index />} />
                <Route path="dashboard" element={<DashboardPage />} /> {/* New dashboard route */}
                <Route path="autres-calculs" element={<AutresCalculsPage />} />
                <Route path="endettement" element={<EndettementPage />} />
                <Route path="epargne" element={<EpargnePage />} />
                <Route path="credit" element={<CreditPage />} />
                <Route path="immo" element={<ImmoPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="scenario-history" element={<ScenarioHistory />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

export default App;