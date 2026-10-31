import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DefenderDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/defender/login');
  };

  return (
    <div className="min-h-screen bg-navy text-cyan-400 p-8">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold">Defender Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Logged in as: {user?.email}</span>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded text-sm">
            Logout
          </button>
        </div>
      </div>
      <p className="text-lg">Welcome to the SOC. Simulation and monitoring modules will be loaded here in Milestone 5.</p>
    </div>
  );
};

export default DefenderDashboard;
