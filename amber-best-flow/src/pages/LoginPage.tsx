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
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        {/* Glass Card Container */}
        <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Side - Hero/Illustration */}
            <div className="relative overflow-hidden min-h-[200px] md:min-h-full">
              <img 
                src="/images/login.png" 
                alt="Login illustration" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Side - Login Form */}
            <div className="p-6 md:p-8 lg:p-12">
              <LoginForm onLogin={handleLogin} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

