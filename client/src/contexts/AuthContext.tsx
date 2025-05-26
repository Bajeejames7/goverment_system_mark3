import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as DatabaseUser } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthContextType {
  supabaseUser: SupabaseUser | null;
  user: DatabaseUser | null;
  userRole: string | null;
  loading: boolean;
  isAdmin: boolean;
  isRegistry: boolean;
  isOfficer: boolean;
  canAddUsers: boolean;
}

const AuthContext = createContext<AuthContextType>({
  supabaseUser: null,
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
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<DatabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        localStorage.setItem('authToken', session.access_token);
        fetchUserData(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        localStorage.setItem('authToken', session.access_token);
        await fetchUserData(session.user);
      } else {
        localStorage.removeItem('authToken');
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (authUser: SupabaseUser) => {
    try {
      // For ICT admin, create user data from Supabase auth
      const userData = {
        id: 1,
        firebaseUid: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email || 'User',
        role: 'admin', // Default role for testing
        department: 'Industry',
        position: 'management_head',
        level: 0,
        canAssignLetters: true,
        isActive: true,
        createdAt: new Date(),
        createdBy: null,
      };
      
      setUser(userData);
      setUserRole(userData.role);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
      setUserRole(null);
    }
  };

  // Check if user can add new users (only ICT admin and Registry management head)
  const canAddUsers = user && (
    (user.department === 'ICT' && user.role === 'admin') ||
    (user.department === 'Registry' && user.position === 'management_head') ||
    (user.department === 'Industry' && user.role === 'admin') // Add Industry admin access
  );

  const value = {
    supabaseUser,
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
