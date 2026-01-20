// frontend/src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserManagement from './UserManagement';
import AdminStats from './AdminStats';
import IpBlockManagement from './IpBlockManagement';
import {
  BarChart3,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  Send,
  Pin,
  Trash2
} from 'lucide-react';
import api from '../../utils/api';
import DOMPurify from 'dompurify'; // Import DOMPurify

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [adminUser, setAdminUser] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('adminUser');

    if (!user) {
      navigate('/admin');
      return;
    }

    setAdminUser(JSON.parse(user));
    // No need to set Authorization header, as token is now in HttpOnly cookie and sent automatically with `withCredentials`
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('/api/admin/logout'); // Call backend logout endpoint
      localStorage.removeItem('adminUser');
      navigate('/admin');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear client-side user data
      localStorage.removeItem('adminUser');
      navigate('/admin');
    }
  };

  const sendAnnouncement = async () => {
    if (!announcement.trim()) return;

    setLoading(true);
    try {
      await api.post('/api/admin/announcement', {
        content: announcement,
        type: 'info'
      });
      setAnnouncement('');
      alert('Announcement sent successfully!');
    } catch (error) {
      alert('Failed to send announcement');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'stats', name: 'Statistics', icon: BarChart3 },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'ipblocks', name: 'IP Blocks', icon: Shield },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back, {DOMPurify.sanitize(adminUser.username)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                View Chat
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="p-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send Announcement
                </label>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="Type your announcement here..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
              <button
                onClick={sendAnnouncement}
                disabled={!announcement.trim() || loading}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>{loading ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {activeTab === 'stats' && <AdminStats />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'messages' && <MessageManagement />}
          {activeTab === 'ipblocks' && <IpBlockManagement />}
          {activeTab === 'settings' && <AdminSettings />}
        </div>
      </main>
    </div>
  );
};

// Message Management Component
const MessageManagement = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get('/api/chat/messages?limit=100');
        setMessages(response.data.messages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const deleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await api.delete(`/api/admin/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      alert('Message deleted successfully');
    } catch (error) {
      alert('Failed to delete message');
    }
  };

  const togglePin = async (messageId, isPinned) => {
    try {
      await api.patch(`/api/admin/messages/${messageId}/pin`);
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, isPinned: !isPinned } : msg
      ));
      alert(`Message ${!isPinned ? 'pinned' : 'unpinned'} successfully`);
    } catch (error) {
      alert('Failed to update message');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Messages ({messages.length})
      </h3>
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {messages.map((message) => {
          if (!message.user) return null;
          return (
            <div key={message._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <img
                      src={DOMPurify.sanitize(message.user.avatar)}
                      alt={DOMPurify.sanitize(message.user.username)}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p
                        className="font-medium text-gray-900 dark:text-white"
                      >
                        {DOMPurify.sanitize(message.user.username)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {message.isPinned && (
                      <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-xs font-medium">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p
                    className="text-gray-700 dark:text-gray-300 break-words"
                  >
                    {DOMPurify.sanitize(message.content || `[${message.type} message]`)}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => togglePin(message._id, message.isPinned)}
                    className={`p-2 rounded-lg transition-colors ${message.isPinned
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    title={message.isPinned ? 'Unpin message' : 'Pin message'}
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteMessage(message._id)}
                    className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Admin Settings Component
const AdminSettings = () => {
  const [settings, setSettings] = useState({
    messageExpiry: 24,
    maxFileSize: 10,
    allowImages: true,
    allowVoice: true,
    allowStickers: true,
    maxUsersOnline: 100,
    rateLimitMessages: 10,
    rateLimitWindow: 60
  });

  const [loading, setLoading] = useState(false);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // In a real app, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Chat Settings
      </h3>

      <div className="space-y-6">
        {/* Message Settings */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Message Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message Expiry (hours)
              </label>
              <input
                type="number"
                value={settings.messageExpiry}
                onChange={(e) => handleSettingChange('messageExpiry', parseInt(e.target.value))}
                min="1"
                max="168"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max File Size (MB)
              </label>
              <input
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Enabled Features</h4>
          <div className="space-y-3">
            {[
              { key: 'allowImages', label: 'Allow Image Uploads' },
              { key: 'allowVoice', label: 'Allow Voice Messages' },
              { key: 'allowStickers', label: 'Allow Stickers' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => handleSettingChange(key, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700 dark:text-gray-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rate Limiting */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Rate Limiting</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Messages per Window
              </label>
              <input
                type="number"
                value={settings.rateLimitMessages}
                onChange={(e) => handleSettingChange('rateLimitMessages', parseInt(e.target.value))}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate Limit Window (seconds)
              </label>
              <input
                type="number"
                value={settings.rateLimitWindow}
                onChange={(e) => handleSettingChange('rateLimitWindow', parseInt(e.target.value))}
                min="10"
                max="3600"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* User Limits */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">User Limits</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Users Online
            </label>
            <input
              type="number"
              value={settings.maxUsersOnline}
              onChange={(e) => handleSettingChange('maxUsersOnline', parseInt(e.target.value))}
              min="10"
              max="1000"
              className="w-full md:w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

