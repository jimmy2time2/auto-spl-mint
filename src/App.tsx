import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./components/WalletProvider";
import Scanlines from "./components/Scanlines";
import Dashboard from "./pages/Dashboard";
import Explorer from "./pages/Explorer";
import TokenDetail from "./pages/TokenDetail";
import Leaderboard from "./pages/Leaderboard";
import Wallet from "./pages/Wallet";
import Logbook from "./pages/Logbook";
import Trade from "./pages/Trade";
import DAO from "./pages/DAO";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <TooltipProvider>
        <Scanlines />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/token/:id" element={<TokenDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/logbook" element={<Logbook />} />
            <Route path="/dao" element={<DAO />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
