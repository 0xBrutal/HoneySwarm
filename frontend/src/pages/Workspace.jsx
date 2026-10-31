import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionInfo, getSessionId, clearSession, attachSession } from '../services/simulationApi';
import { LayoutDashboard, Terminal, Users, FolderOpen, ShieldAlert, LogOut, MessageSquare } from 'lucide-react';

import DashboardView from '../components/DashboardView';
import TerminalView from '../components/TerminalView';
import DirectoryView from '../components/DirectoryView';
import CloudDriveView from '../components/CloudDriveView';
import AdminView from '../components/AdminView';
import ChatView from '../components/ChatView';

const TABS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'directory', label: 'Directory', icon: Users },
  { id: 'cloud', label: 'Cloud Drive', icon: FolderOpen },
  { id: 'chat', label: 'HR Assistant', icon: MessageSquare },
  { id: 'admin', label: 'Admin Panel', icon: ShieldAlert },
];

const privilegeBadge = (privilege) => {
  switch (privilege) {
    case 'root': return 'bg-red-100 text-red-700';
    case 'admin': return 'bg-amber-100 text-amber-700';
    case 'employee': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const Workspace = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [simState, setSimState] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const attach = params.get('attach');
    if (attach) attachSession(attach);

    if (!getSessionId()) { navigate('/portal'); return; }
    getSessionInfo()
      .then((res) => setSimState(res.state))
      .catch(() => navigate('/portal'));
  }, [navigate]);

  const exit = () => {
    clearSession();
    navigate('/portal');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-200">
          <span className="text-lg font-bold text-blue-800">Vertex Dynamics</span>
          <span className="block text-xs text-gray-400 mt-0.5">Internal Workspace</span>
        </div>
        <nav className="flex-1 py-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${active ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={exit} className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-red-600">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h1>
          {simState && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Signed in as <span className="font-mono font-medium text-gray-700">{simState.currentUser}</span></span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${privilegeBadge(simState.privilege)}`}>{simState.privilege}</span>
            </div>
          )}
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'dashboard' && <DashboardView simState={simState} />}
          {activeTab === 'terminal' && <TerminalView simState={simState} onStateChange={setSimState} />}
          {activeTab === 'directory' && <DirectoryView />}
          {activeTab === 'cloud' && <CloudDriveView />}
	  {activeTab === 'chat' && <ChatView />}
          {activeTab === 'admin' && <AdminView key={simState?.privilege || 'none'} />}
        </main>
      </div>
    </div>
  );
};

export default Workspace;
