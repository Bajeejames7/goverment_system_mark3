import { useState } from "react";
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="lg:pl-64">
        <Header 
          title={getPageTitle(location)}
          onSidebarToggle={() => setSidebarOpen(true)}
        />
        
        <main className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
      
      <ChatBot />
    </div>
  );
}
