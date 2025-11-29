import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LoginFormProps {
  onLogin: (role: "plant" | "hq") => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);

    try {
      // Call API to login
      await login(email, password, rememberMe);

      // Login successful - toast is handled by AuthContext
      toast.success("Login successful!");

      // The AuthContext will have the user data
      // Navigation is handled by LoginPage useEffect
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amber Logo and Header - Enhanced */}
      <div className="mb-7 text-center">
        <div className="flex justify-center mb-6 animate-fade-in">
          <img
            src="/images/amberlogo.png"
            alt="Amber Logo"
            className="h-16 w-auto object-contain login-logo drop-shadow-lg"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl md:text-[2.75rem] font-extrabold text-gray-900 leading-tight tracking-tight">
            Welcome to InnoSphere
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 font-medium">
            <span className="w-7 h-[2px] bg-gradient-to-r from-transparent to-gray-400"></span>
            <p className="px-2">
              Innovation • Sharing • Benchmarking • Cross-learning
            </p>
            <span className="w-7 h-[2px] bg-gradient-to-l from-transparent to-gray-400"></span>
          </div>
        </div>
      </div>

      {/* Input Fields Container */}
      <div className="space-y-4">
        {/* Email Input - Enhanced Glass Morphism */}
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-xs font-semibold text-gray-700 uppercase tracking-wider ml-1"
          >
            Email / Employee ID
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 group-focus-within:bg-gray-200 transition-all duration-300 z-10 pointer-events-none">
              <User className="h-[1.1rem] w-[1.1rem] text-gray-600 group-focus-within:text-gray-900 transition-colors" />
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or employee ID"
              className="w-full h-[3.25rem] pl-14 pr-4 rounded-xl text-gray-800 placeholder:text-gray-400 border-0 transition-all duration-300 outline-none focus:outline-none glass-input-light text-[0.9rem] font-medium shadow-sm hover:shadow-md focus:shadow-lg relative"
              aria-label="Email or Employee ID"
              required
            />
          </div>
        </div>

        {/* Password Input - Enhanced Glass Morphism */}
        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-xs font-semibold text-gray-700 uppercase tracking-wider ml-1"
          >
            Password
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 group-focus-within:bg-gray-200 transition-all duration-300 z-10 pointer-events-none">
              <Lock className="h-[1.1rem] w-[1.1rem] text-gray-600 group-focus-within:text-gray-900 transition-colors" />
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-[3.25rem] pl-14 pr-4 rounded-xl text-gray-800 placeholder:text-gray-400 border-0 transition-all duration-300 outline-none focus:outline-none glass-input-light text-[0.9rem] font-medium shadow-sm hover:shadow-md focus:shadow-lg relative"
              aria-label="Password"
              required
            />
          </div>
        </div>
      </div>

      {/* Remember Me - Enhanced */}
      <div className="flex items-center pt-1">
        <div className="flex items-center space-x-2.5 px-1">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            className="h-[1.1rem] w-[1.1rem] rounded-md border-2 border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900 data-[state=checked]:shadow-lg data-[state=checked]:shadow-gray-900/20 transition-all duration-200"
            style={{
              background: rememberMe ? undefined : "rgba(255, 255, 255, 0.7)",
            }}
          />
          <Label
            htmlFor="remember"
            className="text-[0.8rem] text-gray-700 cursor-pointer select-none font-medium hover:text-gray-900 transition-colors"
          >
            Keep me signed in
          </Label>
        </div>
      </div>

      {/* Primary CTA Button - Enhanced Gradient with Hover Animations */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[3.25rem] rounded-xl text-[0.95rem] font-bold text-white border-0 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-300/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl hover:shadow-2xl bg-gray-900 hover:bg-gray-800 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In to Portal
              <svg
                className="ml-2 h-[1.1rem] w-[1.1rem] inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
