import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Menu, 
  Search, 
  Sun, 
  Moon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoPath from "@assets/Republic_of_kenya_logo.jpeg";
import { useEffect, useState } from "react";

interface HeaderProps {
  title: string;
  onSidebarToggle: () => void;
}

export default function Header({ title, onSidebarToggle }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateStatus = () => {
      // Try to fetch a lightweight resource to confirm actual connectivity
      fetch("/favicon.ico", { method: "HEAD", cache: "no-store" })
        .then(() => setIsOnline(true))
        .catch(() => setIsOnline(false));
    };
    updateStatus();
    const interval = setInterval(updateStatus, 2000); // check every 2 seconds
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </Button>
            
            <div className="hidden lg:flex items-center space-x-3">
              <img 
                src={logoPath} 
                alt="Kenya Logo" 
                className="h-8 w-8 rounded-full shadow-sm"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  State Department of Industry
                </p>
              </div>
            </div>

            <h1 className="lg:hidden text-lg font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h1>
          </div>
          
          {/* Center Section - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search documents, letters, or users..."
                className="pl-10 pr-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 transition-colors"
              />
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Button>

            {/* Connection Status Indicator */}
            <div
              className={`w-4 h-4 rounded-full border-2 ${isOnline ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600'} flex items-center justify-center transition-colors`}
              title={isOnline ? 'Online' : 'Offline'}
              aria-label={isOnline ? 'Online' : 'Offline'}
              style={{ marginRight: '0.5rem' }}
            />
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={`p-2.5 rounded-full border transition-all duration-200 shadow-sm hover:shadow-md 
                ${isDark ? 'bg-white hover:bg-slate-100 border-slate-200 dark:border-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-transparent'}`}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-white" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}