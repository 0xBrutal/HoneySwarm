import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchSessions } from '../services/api';

const DefenderDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  const handleLogout = () => { logout(); navigate('/defender/login'); };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSessions();
        setSessions(data.sessions || []);
      } catch (e) { console.error(e); }
    };
    load();
    const interval = setInterval(load, 3000); // Poll every 3s to see score updates live
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-navy text-cyan-400 p-8">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold">Defender Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Logged in as: {user?.email}</span>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded text-sm">Logout</button>
        </div>
      </div>

      <h2 className="text-xl mb-4 text-gray-200">Live Session Intelligence</h2>

      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700 text-sm">
          <thead className="bg-gray-900 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">Session ID</th>
              <th className="px-4 py-3 text-left">Stage</th>
              <th className="px-4 py-3 text-left">Threat Score</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-gray-200">
            {sessions.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No sessions recorded yet. Go to /portal and interact with the simulation.</td></tr>
            )}
            {sessions.map(s => (
              <tr key={s.id} className="hover:bg-gray-700">
                <td className="px-4 py-3 font-mono text-xs">{s.id.slice(0, 8)}...</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${s.routing_stage === 'deception' ? 'bg-red-900 text-red-200' :
                      s.routing_stage === 'probe' ? 'bg-amber-900 text-amber-200' : 'bg-blue-900 text-blue-200'
                    }`}>{s.routing_stage}</span>
                </td>
                <td className="px-4 py-3 font-mono font-bold">{s.threat_score}</td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(s.last_activity_at + 'Z').toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DefenderDashboard;