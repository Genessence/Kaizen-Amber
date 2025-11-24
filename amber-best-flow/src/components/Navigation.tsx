import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  Users,
  BarChart3
} from "lucide-react";
import { User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { usePrefetchPractices, usePrefetchCategories, usePrefetchPlants, usePrefetchBenchmarkedPractices, usePrefetchDashboard } from "@/hooks/usePrefetch";

const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Prefetch hooks
  const prefetchPractices = usePrefetchPractices();
  const prefetchCategories = usePrefetchCategories();
  const prefetchPlants = usePrefetchPlants();
  const prefetchBenchmarkedPractices = usePrefetchBenchmarkedPractices();
  const prefetchDashboard = usePrefetchDashboard();

  if (!user) {
    return null;
  }

  const userRole = user.role;

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  // Prefetch common data when hovering over practices link
  const handlePracticesHover = () => {
    prefetchPractices({
      limit: 100,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    prefetchCategories();
    prefetchPlants(true);
  };

  // Prefetch benchmarked practices when hovering over approvals/benchmark link
  const handleBenchmarkHover = () => {
    prefetchBenchmarkedPractices({ limit: 100 });
    prefetchCategories();
  };

  // Prefetch dashboard data when hovering over dashboard link
  const handleDashboardHover = () => {
    prefetchDashboard();
  };

  return (
    <div className="bg-card border rounded-xl p-4 shadow-soft backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/dashboard" onMouseEnter={handleDashboardHover}>
            <Button
              variant={isActive("/dashboard") ? "default" : "ghost"}
              size="sm"
              className="text-sm font-medium transition-smooth h-9 px-4"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>

          {userRole === "plant" && (
            <Link to="/practices/add">
              <Button
                variant={isActive("/practices/add") ? "default" : "ghost"}
                size="sm"
                className="text-sm font-medium transition-smooth h-9 px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Best Practice
              </Button>
            </Link>
          )}

          <Link to="/practices" onMouseEnter={handlePracticesHover}>
            <Button
              variant={isActive("/practices") && !location.pathname.includes("/practices/add") ? "default" : "ghost"}
              size="sm"
              className="text-sm font-medium transition-smooth h-9 px-4"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Best Practices
            </Button>
          </Link>

          {userRole === "plant" && (
            <Link to="/benchmark" onMouseEnter={handleBenchmarkHover}>
              <Button
                variant={isActive("/benchmark") ? "default" : "ghost"}
                size="sm"
                className="text-sm font-medium transition-smooth h-9 px-4"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Benchmark
              </Button>
            </Link>
          )}

          {userRole === "hq" && (
            <Link to="/approvals" onMouseEnter={handleBenchmarkHover}>
              <Button
                variant={isActive("/approvals") ? "default" : "ghost"}
                size="sm"
                className="text-sm font-medium transition-smooth h-9 px-4"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Benchmark BP's
              </Button>
            </Link>
          )}

          {userRole === "hq" && (
            <Link to="/analytics">
              <Button
                variant={isActive("/analytics") ? "default" : "ghost"}
                size="sm"
                className="text-sm font-medium transition-smooth h-9 px-4"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-3">
        </div>
      </div>
    </div>
  );
};

export default Navigation;