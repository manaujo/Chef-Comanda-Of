import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import LoginFuncionario from "./pages/LoginFuncionario";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Mesas from "./pages/Mesas";
import MesaDetalhes from "./pages/MesaDetalhes";
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
import ProtectedRouteFuncionario from "./components/ProtectedRouteFuncionario";

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
          <Route path="/login-funcionario" element={<LoginFuncionario />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/acesso-negado" element={<AcessoNegado />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRouteFuncionario allowedRoles={['administrador', 'garcom', 'caixa', 'estoque', 'cozinha']}>
                <Dashboard />
              </ProtectedRouteFuncionario>
            }
          />
          <Route
            path="/mesas"
            element={
              <ProtectedRouteFuncionario allowedRoles={['administrador', 'garcom']}>
                <Mesas />
              </ProtectedRouteFuncionario>
            }
          />
          <Route
            path="/mesa/:id"
            element={
              <ProtectedRouteFuncionario allowedRoles={['administrador', 'garcom']}>
                <MesaDetalhes />
              </ProtectedRouteFuncionario>
            }
          />
          <Route
            path="/comandas"
            element={
              <ProtectedRouteFuncionario allowedRoles={['administrador', 'garcom', 'caixa']}>
                <Comandas />
              </ProtectedRouteFuncionario>
            }
          />
          <Route
            path="/cozinha"
            element={
              <ProtectedRouteFuncionario allowedRoles={['administrador', 'cozinha']}>
                <Cozinha />
              </ProtectedRouteFuncionario>
            }
          />
          <Route
            path="/pdv"
            element={
              <ProtectedRouteFuncionario allowedRoles={['administrador', 'caixa']}>
                <PDV />
              </ProtectedRouteFuncionario>
            }
          />
          <Route
            path="/produtos"
            element={
              <ProtectedRouteFuncionario allowedRoles={['administrador', 'estoque']}>
                <Produtos />
              </ProtectedRouteFuncionario>
            }
          />
          <Route
            path="/estoque"
            element={
              <ProtectedRouteFuncionario allowedRoles={['administrador', 'estoque']}>
                <Estoque />
              </ProtectedRouteFuncionario>
            }
          />
          <Route
            path="/turnos"
            element={
              <ProtectedRouteFuncionario allowedRoles={['administrador', 'caixa']}>
                <Turnos />
              </ProtectedRouteFuncionario>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRouteFuncionario allowedRoles={['administrador', 'caixa', 'estoque']}>
                <Relatorios />
              </ProtectedRouteFuncionario>
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
              <ProtectedRouteFuncionario allowedRoles={['administrador']}>
                <GerenciarFuncionarios />
              </ProtectedRouteFuncionario>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRouteFuncionario allowedRoles={['administrador']}>
                <Configuracoes />
              </ProtectedRouteFuncionario>
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
