import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getCurrentUserRole } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  isAdmin: boolean;
  isRegistry: boolean;
  isOfficer: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  isAdmin: false,
  isRegistry: false,
  isOfficer: false,
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
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        const role = await getCurrentUserRole();
        setUserRole(role || null);
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userRole,
    loading,
    isAdmin: userRole === 'admin',
    isRegistry: userRole === 'registry',
    isOfficer: userRole === 'officer',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
