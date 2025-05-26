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
              className="p-3 rounded-full bg-gray-800 dark:bg-white shadow-lg border border-gray-800 dark:border-white text-white dark:text-gray-800 hover:bg-gray-700 dark:hover:bg-gray-100 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
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
