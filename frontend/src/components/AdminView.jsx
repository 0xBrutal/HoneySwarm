import { useState, useEffect } from 'react';
import { getAdminPanel } from '../services/simulationApi';
import { ShieldAlert } from 'lucide-react';

const AdminView = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminPanel().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">{error}</div>;
  if (!data) return <div className="text-sm text-gray-500">Loading...</div>;

  if (data.restricted) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex items-start gap-3">
        <ShieldAlert className="text-amber-600 mt-1" size={20} />
        <div>
          <h3 className="font-semibold text-amber-800">Restricted Area</h3>
          <p className="text-sm text-amber-700 mt-1">{data.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 font-medium text-gray-700">System Accounts</div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.users.map((u) => (
              <tr key={u.username} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-gray-800">{u.username}</td>
                <td className="px-4 py-2 text-gray-600">{u.role}</td>
                <td className="px-4 py-2"><span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">{u.status}</span></td>
                <td className="px-4 py-2 text-gray-500">{u.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 font-medium text-gray-700">System Configuration</div>
        <div className="p-4 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-2">
          <div><span className="text-gray-400">Hostname:</span> {data.config.hostname}</div>
          <div><span className="text-gray-400">Kernel:</span> {data.config.kernel}</div>
          <div><span className="text-gray-400">Uptime:</span> {data.config.uptime}</div>
          <div><span className="text-gray-400">Pending updates:</span> {data.config.pendingUpdates}</div>
          <div className="md:col-span-2 mt-2">
            <span className="text-gray-400 block mb-1">Services:</span>
            <ul className="list-disc list-inside">
              {data.config.services.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
