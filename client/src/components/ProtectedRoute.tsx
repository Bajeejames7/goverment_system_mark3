import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  adminOnly?: boolean;
}

interface User {
  id: number;
  email: string;
  name: string;
  roles: string[];
  department?: string;
  position?: string;
}

export default function ProtectedRoute({ children, requiredRoles, adminOnly }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setLocation("/login");
        return;
      }

      try {
        const response = await fetch('/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          setLocation("/login");
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setLocation("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (adminOnly && !user.roles.includes('admin')) {
    setLocation("/dashboard");
    return null;
  }

  if (requiredRoles && !requiredRoles.some(role => user.roles.includes(role))) {
    setLocation("/dashboard");
    return null;
  }

  return <>{children}</>;
}
