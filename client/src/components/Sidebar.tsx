import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/auth";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Mail, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  LogOut, 
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import logoPath from "@assets/Republic_of_kenya_logo.jpeg";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, userRole, isAdmin, loading } = useAuth();
  // Debug: Log user object to help diagnose 'Unknown User' issue
  console.debug('Sidebar user:', user);
  if (!loading && !user) {
    console.error('Sidebar: No user loaded. User is not authenticated or failed to load.');
  }
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigationItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", color: "text-blue-600" },
    { id: "folders", label: "Document Folders", icon: FolderOpen, path: "/dashboard/folders", color: "text-amber-600" },
    { id: "letters", label: "Letters Management", icon: Mail, path: "/dashboard/letters", color: "text-green-600" },
    ...(isAdmin ? [{ id: "users", label: "User Management", icon: Users, path: "/dashboard/users", color: "text-purple-600" }] : []),
    { id: "verification", label: "Verification", icon: ShieldCheck, path: "/dashboard/verification", color: "text-red-600" },
    { id: "reports", label: "Reports", icon: BarChart3, path: "/dashboard/reports", color: "text-indigo-600" },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      ps: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      secretary: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      registry: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      officer: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    };
    return colors[role as keyof typeof colors] || colors.officer;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <div className="flex items-center space-x-3">
            <img 
              src={logoPath} 
              alt="Kenya Logo" 
              className="h-10 w-10 rounded-full shadow-lg ring-2 ring-white/20"
            />
            <div>
              <h2 className="text-white font-bold text-lg">RMU System</h2>
              <p className="text-blue-100 text-xs">Records Management</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden text-white hover:bg-white/20 rounded-full p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-6 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {getInitials(user?.name || 'User')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {loading ? 'Loading...' : user?.name ? user.name : 'Not logged in'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {loading ? 'Loading...' : user?.email ? user.email : 'Not logged in'}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={`text-xs px-2 py-1 ${getRoleBadgeColor(userRole || 'user')}`}>
                  {userRole?.toUpperCase()}
                </Badge>
                {user?.department && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    {user.department}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator className="mx-6" />

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start h-12 px-4 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-r-4 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? item.color : 'text-gray-500'}`} />
                <span className="font-medium">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        <Separator className="mx-6" />

        {/* Footer Actions */}
        <div className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </Button>
        </div>
      </div>
    </>
  );
}