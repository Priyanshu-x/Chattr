// frontend/src/components/layout/Header.jsx
import React from 'react';
import { useSocket } from '../../context/SocketContext';
import ThemeToggle from '../ui/ThemeToggle';
import { Menu, Users, Pin, Settings } from 'lucide-react';

const Header = ({ onToggleSidebar, onTogglePinned }) => {
  const { onlineUsers } = useSocket();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 py-2 sm:px-4 sm:py-3 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex items-center">
          <img src="/Chattr Logo.png" alt="Chattr Logo" className="h-7 w-7 sm:h-8 sm:w-8 mr-2" />
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Chattr
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              Welcome to the community
            </p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Online users count */}
        <div className="flex items-center space-x-2 px-2 py-1 sm:px-3 sm:py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">{onlineUsers.length} online</span>
        </div>

        {/* Pinned messages toggle */}
        <button
          onClick={onTogglePinned}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Toggle pinned messages"
        >
          <Pin className="h-5 w-5" />
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Settings */}
        <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;