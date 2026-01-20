// frontend/src/components/admin/AdminStats.jsx
import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Mic, Image, Pin, TrendingUp } from 'lucide-react';
import api from '../../utils/api';

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-gray-600 dark:text-gray-400">
        Failed to load statistics
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Users,
      color: 'gray',
      description: 'Currently online'
    },
    {
      title: 'Total Messages',
      value: stats.totalMessages,
      icon: MessageSquare,
      color: 'gray',
      description: 'All time'
    },
    {
      title: 'Voice Messages',
      value: stats.voiceMessages,
      icon: Mic,
      color: 'gray',
      description: 'Total sent'
    },
    {
      title: 'Images Shared',
      value: stats.imageMessages,
      icon: Image,
      color: 'gray',
      description: 'Total uploaded'
    },
    {
      title: 'Pinned Messages',
      value: stats.pinnedMessages,
      icon: Pin,
      color: 'gray',
      description: 'Currently pinned'
    },
    {
      title: 'Messages (24h)',
      value: stats.messagesLast24h,
      icon: TrendingUp,
      color: 'gray',
      description: 'Last 24 hours'
    }
  ];

  const colorClasses = {
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white',
    green: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white',
    blue: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white',
    purple: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white',
    orange: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white',
    yellow: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white',
    red: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Statistics Overview
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${colorClasses[stat.color]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          System Status
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Server Uptime:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">N/A</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Message Cleanup:</span>
            <span className="ml-2 text-green-600 dark:text-green-400 font-medium">Active</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Storage Used:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">~0.5 MB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;