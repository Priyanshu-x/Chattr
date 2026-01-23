import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { useSnow } from '../../context/SnowContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserJoin from '../ui/UserJoin';
import { Users, Sun, Moon, Settings, X, CloudSnow } from 'lucide-react';

const ChatRoom = () => {
  const { user, connected, onlineUsers } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const { isSnowing, toggleSnow } = useSnow();

  const [showUserJoin, setShowUserJoin] = useState(!user);
  const [showSidebar, setShowSidebar] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    if (user) {
      setShowUserJoin(false);
    }
  }, [user]);

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Connecting to chat server...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Make sure the backend is running on port 5000</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-gray-50 dark:bg-gray-900">
      {/* User Join Modal */}
      {showUserJoin && (
        <UserJoin onClose={() => setShowUserJoin(false)} />
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10 relative">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Chattr
          </h1>
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{onlineUsers.length} online</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Snow Toggle */}
          <button
            onClick={toggleSnow}
            className={`p-2 rounded-lg transition-colors ${isSnowing
              ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            title={isSnowing ? "Stop Snowing" : "Let it Snow"}
          >
            <CloudSnow className={`h-5 w-5 ${isSnowing ? 'animate-pulse' : ''}`} />
          </button>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Users className="h-5 w-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 rounded-full">
              <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full" />
              <span className="text-sm font-medium">{user.username}</span>
            </div>
          )}
        </div>
      </header>

      {/* Online Users Sidebar */}
      {showSidebar && (
        <div className={`fixed inset-y-0 right-0 w-64 sm:w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-50 flex flex-col transform ${showSidebar ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Online Users ({onlineUsers.length})</h3>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {onlineUsers.map((user, index) => (
              <div key={user.id || index} className="flex items-center space-x-3">
                <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Online now</p>
                </div>
              </div>
            ))}
            {onlineUsers.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No users online</p>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageList onReply={setReplyingTo} />
        <MessageInput replyingTo={replyingTo} setReplyingTo={setReplyingTo} />
      </div>

      {/* Click outside to close sidebar */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}
    </div>
  );
};

export default ChatRoom;