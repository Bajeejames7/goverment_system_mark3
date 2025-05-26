import { useTheme } from "@/contexts/ThemeContext";

interface HeaderProps {
  title: string;
  onSidebarToggle: () => void;
}

export default function Header({ title, onSidebarToggle }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button 
              onClick={onSidebarToggle}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className="fas fa-bars"></i>
            </button>
            <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-600 focus:border-blue-600"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <i className="fas fa-bell"></i>
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
