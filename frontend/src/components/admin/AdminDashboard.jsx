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
  Trash2,
  Activity,
  Cpu
} from 'lucide-react';
import api from '../../utils/api';
import DOMPurify from 'dompurify'; // Import DOMPurify

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [adminUser, setAdminUser] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');
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
        type: announcementType
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
    { id: 'system', name: 'System', icon: Activity },
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
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  Welcome back, {DOMPurify.sanitize(adminUser.username)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex-1 md:flex-none px-4 py-2 text-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm"
              >
                View Chat
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 md:px-6 overflow-x-auto hide-scrollbar">
          <div className="flex space-x-6 md:space-x-8 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
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
      <main className="p-4 md:p-6">
        {/* Quick Actions */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notice Content
                </label>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="Type your announcement here..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="w-full md:w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notice Type
                </label>
                <select
                  value={announcementType}
                  onChange={(e) => setAnnouncementType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="danger">Danger (Red)</option>
                </select>
              </div>
              <button
                onClick={sendAnnouncement}
                disabled={!announcement.trim() || loading}
                className="w-full md:w-auto h-[42px] flex items-center justify-center space-x-2 px-6 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>{loading ? 'Broadcasting...' : 'Broadcast Announcement'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {activeTab === 'stats' && <AdminStats />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'messages' && <MessageManagement />}
          {activeTab === 'ipblocks' && <IpBlockManagement />}
          {activeTab === 'system' && <AdminDiagnostics />}
          {activeTab === 'settings' && <AdminSettings />}
        </div>
      </main>
    </div>
  );
};

const MessageManagement = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMessages = messages.filter(msg =>
    msg.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.user?.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      setSelectedIds(prev => prev.filter(id => id !== messageId));
    } catch (error) {
      alert('Failed to delete message');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} messages?`)) return;

    setIsBulkDeleting(true);
    try {
      await api.post('/api/admin/messages/bulk-delete', { messageIds: selectedIds });
      setMessages(prev => prev.filter(msg => !selectedIds.includes(msg._id)));
      setSelectedIds([]);
      alert(`${selectedIds.length} messages deleted successfully`);
    } catch (error) {
      alert('Failed to delete messages');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const togglePin = async (messageId, isPinned) => {
    try {
      await api.patch(`/api/admin/messages/${messageId}/pin`);
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, isPinned: !isPinned } : msg
      ));
    } catch (error) {
      alert('Failed to update message');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === messages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(messages.map(m => m._id));
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Messages ({filteredMessages.length})
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedIds.length} messages selected
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Filter messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
          <button
            onClick={toggleSelectAll}
            className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {selectedIds.length === messages.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0 || isBulkDeleting}
            className="whitespace-nowrap flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isBulkDeleting ? 'Delete' : 'Delete Selected'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
        {filteredMessages.map((message) => {
          if (!message.user) return null;
          const isSelected = selectedIds.includes(message._id);
          return (
            <div
              key={message._id}
              className={`border rounded-lg p-4 transition-colors ${isSelected
                ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              onClick={() => toggleSelect(message._id)}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5 mr-4 mt-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(message._id)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                </div>
                <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3 truncate">
                      <img
                        src={DOMPurify.sanitize(message.user.avatar)}
                        alt={DOMPurify.sanitize(message.user.username)}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className="truncate">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {DOMPurify.sanitize(message.user.username)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {message.isPinned && (
                        <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0">
                          Pinned
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(message._id, message.isPinned);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${message.isPinned
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        title={message.isPinned ? 'Unpin message' : 'Pin message'}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMessage(message._id);
                        }}
                        className="p-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 break-words text-sm ml-11">
                    {DOMPurify.sanitize(message.content || `[${message.type} message]`)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Admin Diagnostics Component
const AdminDiagnostics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const res = await api.get('/api/admin/system/diagnostics');
        console.log('AdminDiagnostics Data:', res.data);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch diagnostics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Scanning system...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Failed to load system data.</div>;

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0d 0h 0m';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">System Health & AI Diagnostics</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Server metrics */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="text-primary-500 h-5 w-5" />
            <h4 className="font-medium">Server Status</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Uptime</span>
              <span className="font-mono text-sm">{formatUptime(data?.uptime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Memory (RSS)</span>
              <span className="font-mono text-sm">{formatBytes(data?.memory?.rss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Heap Used</span>
              <span className="font-mono text-sm">{formatBytes(data?.memory?.heapUsed)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Node Version</span>
              <span>{data?.ai?.nodeVersion || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* AI Metrics */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center space-x-3 mb-4">
            <Cpu className="text-green-500 h-5 w-5" />
            <h4 className="font-medium">Kira AI (Brain)</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${data?.ai?.kiraEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {data?.ai?.kiraEnabled ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">OpenRouter (Primary)</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${data?.ai?.openRouterKeySet ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {data?.ai?.openRouterKeySet ? 'CONFIGURED' : 'NOT SET'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Gemini SDK (Backup)</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${data?.ai?.geminiKeySet ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {data?.ai?.geminiKeySet ? 'CONFIGURED' : 'NOT SET'}
              </span>
            </div>
          </div>
        </div>
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/api/admin/settings');
        // Merge fetched settings with default structure to ensure all keys exist
        setSettings(prev => ({ ...prev, ...response.data }));
      } catch (error) {
        console.error('Failed to load settings', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await api.put('/api/admin/settings', settings);
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

