import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useLocation } from "wouter";
import { signInWithEmail } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { type } = useParams() as { type: string };
  const { supabaseUser, loading } = useAuth();
  const { toast } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Use useEffect to handle navigation to prevent state update during render
  useEffect(() => {
    if (supabaseUser) {
      setLocation("/dashboard");
    }
  }, [supabaseUser, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (supabaseUser) {
    return null;
  }

  const getLoginConfig = (type: string) => {
    const configs = {
      admin: { title: 'Administrator Login', icon: 'fa-shield-alt' },
      registry: { title: 'Registry Officer Login', icon: 'fa-user-tie' },
      officer: { title: 'Officer Login', icon: 'fa-user' },
    };
    return configs[type as keyof typeof configs] || configs.officer;
  };

  const config = getLoginConfig(type);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Direct Supabase authentication for ICT Admin
      const { signInWithEmail } = await import('@/lib/supabase');
      
      const result = await signInWithEmail(data.email, data.password);
      
      if (result.user) {
        // Store the token for API calls
        localStorage.setItem('authToken', result.session?.access_token || 'ict-admin-token');
        
        toast({
          title: "Success",
          description: `Welcome! ICT Administrator access granted.`,
        });
        
        // Redirect to dashboard
        setLocation("/dashboard");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 z-50"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>
      
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <a 
            href="/login-selection"
            className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>Back to Login Selection
          </a>
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <i className={`fas ${config.icon} text-white text-xl`}></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{config.title}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enter your credentials to access the system</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className="mt-1"
                placeholder="Enter your email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  className="pr-10"
                  placeholder="Enter your password"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400 hover:text-gray-600 dark:hover:text-gray-300`}></i>
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember-me"
                checked={form.watch("rememberMe")}
                onCheckedChange={(checked) => form.setValue("rememberMe", !!checked)}
              />
              <Label htmlFor="remember-me" className="text-sm">Remember me</Label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-700">Forgot password?</a>
            </div>
          </div>

          <div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Signing In...
                </>
              ) : (
                <>
                  <i className="fas fa-lock mr-2"></i>
                  Sign In
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need an account? Contact your administrator for registration.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
