import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { User as DatabaseUser } from "@shared/schema";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: DatabaseUser | null;
  userRole: string | null;
  loading: boolean;
  isAdmin: boolean;
  isRegistry: boolean;
  isOfficer: boolean;
  canAddUsers: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<DatabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get the ID token for authentication
          const token = await firebaseUser.getIdToken();
          
          // Store token in localStorage for API calls
          localStorage.setItem('authToken', token);
          
          // Fetch user data from database
          const response = await fetch('/api/user/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setUserRole(userData.role);
          } else {
            setUser(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
          setUserRole(null);
        }
      } else {
        // Clear token when user logs out
        localStorage.removeItem('authToken');
        setUser(null);
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Check if user can add new users (only ICT admin and Registry management head)
  const canAddUsers = user && (
    (user.department === 'ICT' && user.role === 'admin') ||
    (user.department === 'Registry' && user.position === 'management_head')
  );

  const value = {
    firebaseUser,
    user,
    userRole,
    loading,
    isAdmin: userRole === 'admin',
    isRegistry: userRole === 'registry',
    isOfficer: userRole === 'officer',
    canAddUsers: Boolean(canAddUsers),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
