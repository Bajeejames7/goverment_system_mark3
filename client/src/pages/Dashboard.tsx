import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ChatBot from "@/components/ChatBot";
import Overview from "./dashboard/Overview";
import Folders from "./dashboard/Folders";
import Letters from "./dashboard/Letters";
import UserManagement from "./dashboard/UserManagement";
import Verification from "./dashboard/Verification";
import Reports from "./dashboard/Reports";
import Routing from "./dashboard/Routing";

export default function Dashboard() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitle = (path: string) => {
    const titles: Record<string, string> = {
      "/dashboard": "Dashboard Overview",
      "/dashboard/admin": "Admin Dashboard",
      "/dashboard/ps": "Principal Secretary Dashboard",
      "/dashboard/secretary": "Secretary Dashboard",
      "/dashboard/registry": "Registry Dashboard",
      "/dashboard/department": "Department Dashboard",
      "/dashboard/officer": "Officer Dashboard",
      "/dashboard/folders": "Document Folders",
      "/dashboard/letters": "Letters Management",
      "/dashboard/users": "User Management",
      "/dashboard/verification": "Document Verification",
      "/dashboard/reports": "Reports & Analytics",
    };
    return titles[path] || "Dashboard";
  };

  const renderContent = () => {
    switch (location) {
      case "/dashboard/admin":
      case "/dashboard/ps":
      case "/dashboard/secretary":
      case "/dashboard/registry":
      case "/dashboard/department":
      case "/dashboard/officer":
        return <Overview />;
      case "/dashboard/folders":
        return <Folders />;
      case "/dashboard/letters":
        return <Letters />;
      case "/dashboard/users":
        return <UserManagement />;
      case "/dashboard/verification":
        return <Verification />;
      case "/dashboard/reports":
        return <Reports />;
      default:
        return <Overview />;
    }
  };

  useEffect(() => {
    // Only push dummy state for /dashboard root, don't forcibly redirect subpages
    if (window.location.pathname === '/dashboard') {
      window.history.pushState({ dashboard: true }, '', '/dashboard');
      const hasToken = () =>
        localStorage.getItem('authToken') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token');
      const handlePopState = (event: PopStateEvent) => {
        if (hasToken()) {
          window.history.pushState({ dashboard: true }, '', '/dashboard');
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="lg:pl-80 transition-all duration-300">
        <Header 
          title={getPageTitle(location)}
          onSidebarToggle={() => setSidebarOpen(true)}
        />
        
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
      
      <ChatBot />
    </div>
  );
}
