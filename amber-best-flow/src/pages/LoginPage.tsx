/**
 * Login Page Component
 * Handles user authentication
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = (role: "plant" | "hq") => {
    // Login is handled by LoginForm component via AuthContext
    // After successful login, useEffect will redirect to dashboard
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Full Page Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src="/images/login.png" 
          alt="Login background" 
          className="w-full h-full object-cover"
        />
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
      </div>
      
      {/* Subtle professional background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02]">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-300 rounded-full blur-3xl"></div>
        </div>
      </div>
      
      <div className="w-full max-w-2xl mx-auto relative z-10">
        {/* Professional Card Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white/95 backdrop-blur-md border border-gray-200/50">
          {/* Full Page Login Form */}
          <div className="p-8 md:p-12 lg:p-16 flex items-center justify-center min-h-[600px]">
            <div className="w-full max-w-md">
              <LoginForm onLogin={handleLogin} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;

