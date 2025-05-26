import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useLocation } from "wouter";
import { loginWithEmail } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  const { user, loading } = useAuth();
  const { toast } = useToast();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    setLocation("/dashboard");
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
      await loginWithEmail(data.email, data.password);
      toast({
        title: "Success",
        description: "Login successful! Welcome to RMU System.",
      });
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
