import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createSession } from '../services/simulationApi';

const EmployeePortal = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Please enter your Vertex ID and password.'); return; }
    setBusy(true);
    setError('');
    try {
      // Password is redacted before logging; only the username is recorded.
      await createSession({ username, password: '[REDACTED]' });
      setTimeout(() => navigate('/portal/workspace'), 500); // brief realistic delay
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-800 tracking-tight">Vertex Dynamics</Link>
          <span className="text-sm text-gray-500">Employee Portal</span>
        </div>
      </header>

      <div className="flex items-center justify-center py-20">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-semibold text-gray-900">Sign in with your Vertex ID</h1>
          <p className="mt-1 text-sm text-gray-500">Access the intranet, cloud drive, and internal tools.</p>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-2">{error}</div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vertex ID</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. jmiller" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={busy}
              className="w-full flex justify-center py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60">
              {busy ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600">Forgot password?</a>
            <a href="#" className="hover:text-gray-600">Acceptable Use Policy</a>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Authorized employees only. All activity on this system may be monitored.
      </p>
    </div>
  );
};

export default EmployeePortal;
