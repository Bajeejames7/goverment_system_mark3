import { ReactNode } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, requiredRole, adminOnly }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated || !user) {
    setLocation("/simple-login");
    return null;
  }

  if (adminOnly && user.role !== 'ICT Administrator') {
    setLocation("/dashboard");
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    setLocation("/dashboard");
    return null;
  }

  return <>{children}</>;
}
