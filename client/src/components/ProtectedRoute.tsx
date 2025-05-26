import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, requiredRole, adminOnly }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login-selection");
    return null;
  }

  if (adminOnly && userRole !== 'admin') {
    setLocation("/dashboard");
    return null;
  }

  if (requiredRole && userRole !== requiredRole) {
    setLocation("/dashboard");
    return null;
  }

  return <>{children}</>;
}
