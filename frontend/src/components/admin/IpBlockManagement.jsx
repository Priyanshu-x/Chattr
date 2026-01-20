// frontend/src/components/admin/IpBlockManagement.jsx
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Trash2 } from 'lucide-react';
import DOMPurify from 'dompurify'; // Import DOMPurify

const IpBlockManagement = () => {
  const [blockedIps, setBlockedIps] = useState([]);
  const [newIp, setNewIp] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBlockedIps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/blocked-ips');
      setBlockedIps(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedIps();
  }, []);

  const handleBlock = async () => {
    if (!newIp.trim()) return;
    try {
      await api.post('/api/admin/block-ip', { ip: newIp });
      setNewIp('');
      fetchBlockedIps();
    } catch (e) {
      alert('Failed to block IP');
    }
  };

  const handleUnblock = async (ip) => {
    if (!window.confirm(`Unblock IP ${ip}?`)) return;
    try {
      await api.delete(`/api/admin/block-ip/${ip}`);
      fetchBlockedIps();
    } catch (e) {
      alert('Failed to unblock IP');
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Blocked IP Addresses</h3>
      <div className="flex items-center mb-4 space-x-2">
        <input
          type="text"
          value={newIp}
          onChange={e => setNewIp(e.target.value)}
          placeholder="Enter IP to block"
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          onClick={handleBlock}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
        >
          Block
        </button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">IP Address</th>
              <th className="px-6 py-3">Blocked At</th>
              <th className="px-6 py-3">Reason</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blockedIps.map(ipObj => (
              <tr key={ipObj.ip} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td className="px-6 py-4 font-mono">{ipObj.ip}</td>
                <td className="px-6 py-4">{ipObj.blockedAt ? new Date(ipObj.blockedAt).toLocaleString() : '-'}</td>
                <td
                  className="px-6 py-4"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ipObj.reason || '-') }}
                />
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleUnblock(ipObj.ip)}
                    className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                    title="Unblock IP"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default IpBlockManagement;
