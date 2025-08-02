import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Mesas from "./pages/Mesas";
import MesaDetalhes from "./pages/MesaDetalhes";
import ComandaDetalhes from "./pages/ComandaDetalhes";
import Comandas from "./pages/Comandas";
import Cozinha from "./pages/Cozinha";
import PDV from "./pages/PDV";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import Turnos from "./pages/Turnos";
import Relatorios from "./pages/Relatorios";
import Funcionarios from "./pages/Funcionarios";
import GerenciarFuncionarios from "./pages/GerenciarFuncionarios";
import Configuracoes from "./pages/Configuracoes";
import AcessoNegado from "./pages/AcessoNegado";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/acesso-negado" element={<AcessoNegado />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "administrador",
                  "garcom",
                  "caixa",
                  "estoque",
                  "cozinha"
                ]}
              >
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mesas"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "administrador",
                  "garcom"
                ]}
              >
                <Mesas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mesa/:id"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "administrador",
                  "garcom"
                ]}
              >
                <MesaDetalhes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comanda/:id"
            element={
              <ProtectedRoute>
                <ComandaDetalhes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comandas"
            element={
              <ProtectedRoute
                allowedRoles={["administrador", "garcom", "caixa"]}
              >
                <Comandas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cozinha"
            element={
              <ProtectedRoute allowedRoles={["administrador", "cozinha"]}>
                <Cozinha />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pdv"
            element={
              <ProtectedRoute allowedRoles={["administrador", "caixa"]}>
                <PDV />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <ProtectedRoute allowedRoles={["administrador", "estoque"]}>
                <Produtos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estoque"
            element={
              <ProtectedRoute allowedRoles={["administrador", "estoque"]}>
                <Estoque />
              </ProtectedRoute>
            }
          />
          <Route
            path="/turnos"
            element={
              <ProtectedRoute allowedRoles={["administrador", "caixa"]}>
                <Turnos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute
                allowedRoles={["administrador", "caixa", "estoque"]}
              >
                <Relatorios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funcionarios"
            element={
              <ProtectedRoute>
                <Funcionarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gerenciar-funcionarios"
            element={
              <ProtectedRoute requireAdmin={true}>
                <GerenciarFuncionarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Configuracoes />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
