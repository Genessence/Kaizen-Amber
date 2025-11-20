/**
 * Layout Component
 * Provides common layout structure (header, navigation) for authenticated pages
 */

import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import { Building2, Shield, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-accent/30 to-secondary/5">
      {/* Header */}
      <div className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center">
                <img 
                  src="/images/amberlogo.png" 
                  alt="Amber Logo" 
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Amber Enterprises India Limited
                </h1>
                <p className="text-sm text-muted-foreground">Amber Best Practice & Benchmarking Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>{user.role === "plant" ? "Plant User" : "HQ Admin"}</span>
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogIn className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[calc(100vh-5rem)]">
        <div className="space-y-6">
          <Navigation />
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;

