import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function LoginSelection() {
  const { isDark, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-university text-white text-2xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">RMU Government System</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Department of Industry</p>
          
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleTheme}
            className="mt-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          <a 
            href="/login/admin"
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          >
            <i className="fas fa-shield-alt mr-3"></i>
            Administrator Login
          </a>
          
          <a 
            href="/login/registry"
            className="group relative w-full flex justify-center py-4 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          >
            <i className="fas fa-user-tie mr-3"></i>
            Registry Officer Login
          </a>
          
          <a 
            href="/login/officer"
            className="group relative w-full flex justify-center py-4 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          >
            <i className="fas fa-user mr-3"></i>
            Officer Login
          </a>
        </div>
      </div>
    </div>
  );
}
