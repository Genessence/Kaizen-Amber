import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PracticesPage from "./pages/PracticesPage";
import PracticeDetailPage from "./pages/PracticeDetailPage";
import AddPracticePage from "./pages/AddPracticePage";
import BenchmarkPage from "./pages/BenchmarkPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Login page - redirect to dashboard if authenticated */}
            <Route path="/" element={<LoginPage />} />
            
            {/* Protected routes with Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              
              <Route path="/practices" element={<PracticesPage />} />
              
              <Route path="/practices/:id" element={<PracticeDetailPage />} />
              
              {/* Plant user only routes */}
              <Route
                path="/practices/add"
                element={
                  <RoleBasedRoute allowedRoles={["plant"]}>
                    <AddPracticePage />
                  </RoleBasedRoute>
                }
              />
              
              <Route
                path="/benchmark"
                element={
                  <RoleBasedRoute allowedRoles={["plant"]}>
                    <BenchmarkPage />
                  </RoleBasedRoute>
                }
              />
              
              {/* HQ admin only routes */}
              <Route
                path="/approvals"
                element={
                  <RoleBasedRoute allowedRoles={["hq"]}>
                    <ApprovalsPage />
                  </RoleBasedRoute>
                }
              />
              
              <Route
                path="/analytics"
                element={
                  <RoleBasedRoute allowedRoles={["hq"]}>
                    <AnalyticsPage />
                  </RoleBasedRoute>
                }
              />
            </Route>
            
            {/* 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
