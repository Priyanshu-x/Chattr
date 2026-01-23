// frontend/src/components/ui/UserJoin.jsx - WORKING VERSION
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import { RefreshCw, User } from 'lucide-react';

const UserJoin = ({ onClose }) => {
  const { joinChat, user } = useSocket(); // Get user from socket context
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Close modal once user is successfully set in context
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  const generateRandomUser = async () => {
    setIsGenerating(true);
    try {
      const [usernameRes, avatarRes] = await Promise.all([
        api.get('/api/user/username'),
        api.get('/api/user/avatar')
      ]);

      console.log('Generated username:', usernameRes.data);
      console.log('Generated avatar:', avatarRes.data);

      setUsername(usernameRes.data.username);
      setAvatar(avatarRes.data.avatar);
    } catch (error) {
      console.error('Failed to generate user data:', error);
      // Fallback
      const randomNum = Math.floor(Math.random() * 10000);
      setUsername(`User${randomNum}`);
      setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${randomNum}`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateRandomUser();
  }, []);

  const handleJoin = () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    if (!avatar) {
      alert('Please wait for avatar to load');
      return;
    }

    console.log('Joining chat with:', { username: username.trim(), avatar });
    joinChat({
      username: username.trim(),
      avatar: avatar
    });

  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary-600 dark:text-gray-200" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Chattr!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose your identity and start chatting
          </p>
        </div>

        {/* Avatar Preview */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt="Your avatar"
                className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-600"
                onError={() => {
                  console.error('Avatar failed to load');
                  setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`);
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 animate-pulse"></div>
            )}
            <button
              onClick={generateRandomUser}
              disabled={isGenerating}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
              title="Generate new avatar"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Username Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Choose your username
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              maxLength={20}
            />
            <button
              onClick={generateRandomUser}
              disabled={isGenerating}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors"
              title="Generate random username"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This is how others will see you in the chat
          </p>
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={!username.trim() || isGenerating || !avatar}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Join Chat'}
        </button>

        {/* Info */}
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700/30 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            💡 Your messages will automatically delete after 24 hours. Stay respectful and have fun!
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserJoin;

