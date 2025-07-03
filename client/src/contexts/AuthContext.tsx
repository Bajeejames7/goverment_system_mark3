import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as DatabaseUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: DatabaseUser | null;
  userRole: string | null;
  loading: boolean;
  isAdmin: boolean;
  isRegistry: boolean;
  isOfficer: boolean;
  canAddUsers: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  isAdmin: false,
  isRegistry: false,
  isOfficer: false,
  canAddUsers: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<DatabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing JWT token and fetch user data
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      console.debug('AuthContext token:', token);
      if (token) {
        try {
          const response = await apiRequest('GET', '/api/me');
          const data = await response.json();
          console.debug('AuthContext /api/me response:', data);
          if (data.success && data.user) {
            setUser(data.user);
            setUserRole(data.user.position || 'user');
          } else {
            setUser(null);
            setUserRole(null);
          }
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('token');
          setUser(null);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Derive role-based permissions
  const isAdmin = userRole === 'admin' || userRole === 'ict_admin';
  const isRegistry = userRole === 'registry' || userRole === 'registry_admin';
  const isOfficer = userRole === 'officer' || userRole === 'secretary';
  const canAddUsers = isAdmin || isRegistry;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let lastActivity = Date.now();

    const resetTimer = () => {
      lastActivity = Date.now();
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (Date.now() - lastActivity >= 10 * 60 * 1000) { // 10 minutes
          import("@/lib/auth").then(mod => mod.logout());
          window.location.href = "/login";
        }
      }, 10 * 60 * 1000);
    };

    const activityEvents = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    activityEvents.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeout) clearTimeout(timeout);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        isAdmin,
        isRegistry,
        isOfficer,
        canAddUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};