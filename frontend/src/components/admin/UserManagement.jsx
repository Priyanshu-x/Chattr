// frontend/src/components/admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { Ban, UserX, MoreVertical, ShieldOff, Shield } from 'lucide-react';
import api from '../../utils/api';
import DOMPurify from 'dompurify'; // Import DOMPurify

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [blockedIps, setBlockedIps] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
  const response = await api.get('/api/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    const fetchBlockedIps = async () => {
      try {
  const response = await api.get('/api/admin/blocked-ips');
        setBlockedIps(response.data.map(ip => ip.ip));
      } catch (error) {
        // ignore
      }
    };
    fetchUsers();
    fetchBlockedIps();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUsers();
      fetchBlockedIps();
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  const blockIp = async (ip) => {
    if (!ip) return alert('No IP found for this user.');
    if (!confirm(`Block IP ${ip}? This will prevent all future logins from this address.`)) return;
    setActionLoading(ip);
    try {
  await api.post('/api/admin/block-ip', { ip });
      setBlockedIps(prev => [...prev, ip]);
      alert('IP blocked successfully');
    } catch (error) {
      alert('Failed to block IP');
    } finally {
      setActionLoading(null);
    }
  };

  const unblockIp = async (ip) => {
    if (!ip) return alert('No IP found for this user.');
    if (!confirm(`Unblock IP ${ip}?`)) return;
    setActionLoading(ip);
    try {
  await api.delete(`/api/admin/block-ip/${ip}`);
      setBlockedIps(prev => prev.filter(bip => bip !== ip));
      alert('IP unblocked successfully');
    } catch (error) {
      alert('Failed to unblock IP');
    } finally {
      setActionLoading(null);
    }
  };

  const kickUser = async (userId) => {
    if (!confirm('Are you sure you want to kick this user?')) return;
    
    setActionLoading(userId);
    try {
  await api.post(`/api/admin/users/${userId}/kick`);
      setUsers(prev => prev.filter(user => user._id !== userId));
      alert('User kicked successfully');
    } catch (error) {
      alert('Failed to kick user');
    } finally {
      setActionLoading(null);
    }
  };

  const banUser = async (userId, duration = 24) => {
    if (!confirm(`Are you sure you want to ban this user for ${duration} hours?`)) return;
    
    setActionLoading(userId);
    try {
  await api.post(`/api/admin/users/${userId}/ban`, { duration });
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isBanned: true } : user
      ));
      alert(`User banned for ${duration} hours`);
    } catch (error) {
      alert('Failed to ban user');
    } finally {
      setActionLoading(null);
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
        Active Users ({users.length})
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">IP</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3">Messages</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4">
                <td className="px-6 py-4">
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {user.ip || 'N/A'}
                  </span>
                  {user.ip && blockedIps.includes(user.ip) && (
                    <span className="ml-2 text-xs text-red-500">Blocked</span>
                  )}
                </td>
                  <div className="flex items-center space-x-3">
                    <img
                      src={DOMPurify.sanitize(user.avatar)}
                      alt={DOMPurify.sanitize(user.username)}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p
                        className="font-medium text-gray-900 dark:text-white"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.username) }}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {DOMPurify.sanitize(user._id.slice(-8))}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p>{new Date(user.joinedAt).toLocaleDateString()}</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {new Date(user.joinedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                    {user.messageCount || 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.isBanned ? (
                    <span className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs font-medium">
                      Banned
                    </span>
                  ) : (
                    <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                      Online
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => user.ip && (blockedIps.includes(user.ip) ? unblockIp(user.ip) : blockIp(user.ip))}
                      disabled={actionLoading === user.ip}
                      className={`p-2 ${blockedIps.includes(user.ip) ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'} rounded-lg transition-colors disabled:opacity-50`}
                      title={blockedIps.includes(user.ip) ? 'Unblock IP' : 'Block IP'}
                    >
                      {blockedIps.includes(user.ip) ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => kickUser(user._id)}
                      disabled={actionLoading === user._id || user.isBanned}
                      className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Kick user"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => banUser(user._id)}
                      disabled={actionLoading === user._id || user.isBanned}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Ban user"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No users currently online
        </div>
      )}
    </div>
  );
};

export default UserManagement;

