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
      if (token) {
        try {
          const response = await apiRequest('/api/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.success && response.user) {
            setUser(response.user);
            setUserRole(response.user.position || 'user');
          }
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('token');
        }
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