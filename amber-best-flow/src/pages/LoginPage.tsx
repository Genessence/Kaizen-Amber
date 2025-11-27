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
      {/* Blueish gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-300 via-sky-200 to-blue-100"></div>
      
      {/* Animated background orbs for depth - blueish tones */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-400/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="w-full max-w-6xl mx-auto relative z-10">
        {/* Enhanced Glass Card Container with glow effect */}
        <div className="relative rounded-[32px] overflow-hidden shadow-2xl glass-card">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Side - Hero/Illustration */}
            <div className="relative overflow-hidden min-h-[200px] md:min-h-full bg-gradient-to-br from-blue-300/20 to-sky-200/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-sky-300/30"></div>
              <img 
                src="/images/login.png" 
                alt="Login illustration" 
                className="w-full h-full object-cover opacity-80 mix-blend-overlay"
              />
            </div>

            {/* Right Side - Login Form with enhanced glass effect */}
            <div className="p-6 md:p-8 lg:p-12 glass-form-bg flex items-center justify-center">
              <div className="w-full max-w-md">
                <LoginForm onLogin={handleLogin} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;

