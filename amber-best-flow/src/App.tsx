import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";

// Critical routes - loaded immediately
import LoginPage from "./pages/LoginPage";

// Lazy-loaded routes - code splitting for better performance
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PracticesPage = lazy(() => import("./pages/PracticesPage"));
const PracticeDetailPage = lazy(() => import("./pages/PracticeDetailPage"));
const AddPracticePage = lazy(() => import("./pages/AddPracticePage"));
const BenchmarkPage = lazy(() => import("./pages/BenchmarkPage"));
const ApprovalsPage = lazy(() => import("./pages/ApprovalsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <SocketProvider>
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
);

export default App;
