/**
 * Role-Based Route Component
 * Wraps routes that require specific user roles
 * Redirects to dashboard if user doesn't have required role
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/api';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const RoleBasedRoute = ({ children, allowedRoles }: RoleBasedRouteProps) => {
  const { user, isLoading } = useAuth();

  // Show loading state while checking user data
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-accent/30 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  // Render content for authorized role
  return <>{children}</>;
};

export default RoleBasedRoute;

