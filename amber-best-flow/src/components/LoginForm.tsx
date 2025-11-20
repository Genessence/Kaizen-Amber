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
      
      // Get user data from auth context
      const userData = await login(email, password, rememberMe);
      
      // Call onLogin with role to update UI
      toast.success("Login successful!");
      
      // The AuthContext will have the user data
      // We'll get the role from there in the parent component
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Desktop-only small headline */}
      <div className="hidden md:block mb-8">
        <h3 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">Welcome to InnoSphere</h3>
        <p className="text-sm md:text-base text-muted-foreground mt-2 leading-relaxed">A sphere of innovation, sharing, benchmarking, and cross-learning.</p>
      </div>

      {/* Email Input */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground sr-only">
          Email / Employee ID
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email / Employee ID"
            className="w-full h-11 pl-10 pr-4 bg-white/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 outline-none"
            aria-label="Email or Employee ID"
            required
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground sr-only">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full h-11 pl-10 pr-4 bg-white/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 outline-none"
            aria-label="Password"
            required
          />
        </div>
      </div>

      {/* Remember Me & Forgot Password Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label
            htmlFor="remember"
            className="text-sm text-muted-foreground cursor-pointer select-none"
          >
            Remember me
          </Label>
        </div>
        <a
          href="#"
          className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 rounded px-1"
          onClick={(e) => {
            e.preventDefault();
            // Handle forgot password
          }}
        >
          Forgot password?
        </a>
      </div>

      {/* Primary CTA Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-gradient-primary hover:bg-gradient-primary/90 text-base font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In to Portal"
        )}
      </Button>

      {/* Secondary Link */}
      <div className="text-center">
        <a
          href="#"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 rounded px-2 py-1"
          onClick={(e) => {
            e.preventDefault();
            // Handle secondary action
          }}
        >
          Need help? Contact IT Support
        </a>
      </div>
    </form>
  );
};

export default LoginForm;