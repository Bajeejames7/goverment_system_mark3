import { useAuth } from "@/contexts/SimpleAuthContext";
import { useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      logout();
      navigate("/simple-login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigationItems = [
    { id: "overview", label: "Dashboard", icon: "fas fa-tachometer-alt", path: "/dashboard" },
    { id: "folders", label: "Document Folders", icon: "fas fa-folder", path: "/dashboard/folders" },
    { id: "letters", label: "Letters Management", icon: "fas fa-envelope", path: "/dashboard/letters" },
    ...(isAdmin ? [{ id: "users", label: "User Management", icon: "fas fa-users", path: "/dashboard/users" }] : []),
    { id: "verification", label: "Verification", icon: "fas fa-shield-check", path: "/dashboard/verification" },
    { id: "reports", label: "Reports", icon: "fas fa-chart-bar", path: "/dashboard/reports" },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 bg-blue-600">
          <div className="flex items-center">
            <i className="fas fa-university text-white text-xl mr-3"></i>
            <span className="text-white font-semibold">RMU System</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 lg:hidden"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <nav className="mt-8 px-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                location === item.path
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <i className={`${item.icon} mr-3`}></i>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userRole}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="mt-3 w-full text-left text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
