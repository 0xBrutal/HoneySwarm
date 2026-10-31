import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchSessions, fetchSessionIntelligence, fetchProviderStatus, resetSession, resetAllSessions, emergencyStop, downloadJSONReport, downloadPDFReport } from '../services/api';
import { Activity, AlertOctagon, Users, Cpu, Download, RefreshCw, Power } from 'lucide-react'; 
import { useSocket } from '../hooks/useSocket';
import EventTimeline from '../components/soc/EventTimeline';
import MitrePanel from '../components/soc/MitrePanel';
import ScenarioPanel from '../components/soc/ScenarioPanel';

const DefenderDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [scenarioProgress, setScenarioProgress] = useState(null);

  // Load all sessions
  const loadSessions = useCallback(async () => {
    try {
      const data = await fetchSessions();
      setSessions(data.sessions || []);
    } catch (e) { console.error(e); }
  }, []);

  // Load provider status
  const loadAiStatus = useCallback(async () => {
    try {
      const status = await fetchProviderStatus();
      setAiStatus(status);
    } catch (e) { console.error(e); }
  }, []);

  // Load details for a specific session
  const loadSessionDetails = useCallback(async (sessionId) => {
    try {
      const data = await fetchSessionIntelligence(sessionId);
      setSessionDetails(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    loadSessions();
    loadAiStatus();
    const interval = setInterval(() => {
      loadSessions();
      loadAiStatus();
      if (selectedSession) loadSessionDetails(selectedSession.id);
    }, 5000); // Poll every 5s as a fallback
    return () => clearInterval(interval);
  }, [loadSessions, loadAiStatus, loadSessionDetails, selectedSession]);

  // Socket.IO Handlers
  const handleNewEvent = useCallback((data) => {
    if (selectedSession && data.sessionId === selectedSession.id) {
      loadSessionDetails(selectedSession.id); // Refresh details to get the new event
    }
    loadSessions(); // Refresh the session list to update "last activity"
  }, [selectedSession, loadSessionDetails, loadSessions]);

  const handleSessionUpdated = useCallback((data) => {
    setSessions(prev => prev.map(s => 
      s.id === data.sessionId 
        ? { ...s, threat_score: data.threat_score, routing_stage: data.routing_stage } 
        : s
    ));
    if (selectedSession && selectedSession.id === data.sessionId) {
      setSelectedSession(prev => ({ ...prev, threat_score: data.threat_score, routing_stage: data.routing_stage }));
    }
  }, [selectedSession]);

  useSocket(handleNewEvent, handleSessionUpdated, setScenarioProgress);

  const handleLogout = () => { logout(); navigate('/defender/login'); };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    loadSessionDetails(session.id);
  };

  const [isManaging, setIsManaging] = useState(false);

  const handleResetSession = async () => {
    if (!selectedSession || !window.confirm('Reset this session? This deletes all events and state.')) return;
    setIsManaging(true);
    try {
      await resetSession(selectedSession.id);
      setSelectedSession(null);
      setSessionDetails(null);
      await loadSessions();
    } catch (e) { console.error(e); }
    setIsManaging(false);
  };

  const handleResetAll = async () => {
    if (!window.confirm('WARNING: This will delete ALL sessions, events, and reset the scenario. Continue?')) return;
    setIsManaging(true);
    try {
      await resetAllSessions();
      setSelectedSession(null);
      setSessionDetails(null);
      await loadSessions();
    } catch (e) { console.error(e); }
    setIsManaging(false);
  };

  const handleEmergencyStop = async () => {
    if (!window.confirm('EMERGENCY STOP: Halt scenario and close all active sessions?')) return;
    setIsManaging(true);
    try {
      await emergencyStop();
      await loadSessions();
    } catch (e) { console.error(e); }
    setIsManaging(false);
  };

  // Calculate overview stats
  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const criticalEvents = sessionDetails?.events.filter(e => e.severity === 'high' || e.severity === 'critical').length || 0;

  return (
    <div className="min-h-screen bg-navy text-gray-200 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="text-cyan-400" size={24} />
          <h1 className="text-xl font-bold text-white tracking-wide">HoneySwarm SOC</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleEmergencyStop} disabled={isManaging} className="px-3 py-1.5 bg-red-900/80 hover:bg-red-800 text-red-100 rounded text-xs font-bold border border-red-700 flex items-center gap-1 disabled:opacity-50">
            <Power size={12} /> EMERGENCY STOP
          </button>
          <button onClick={handleResetAll} disabled={isManaging} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs font-medium flex items-center gap-1 disabled:opacity-50">
            <RefreshCw size={12} /> Reset All Demo Data
          </button>
          <div className="flex items-center gap-2 text-sm">
            <Cpu size={14} className={aiStatus?.activeProvider === 'groq' ? 'text-green-400' : 'text-amber-400'} />
            <span>AI: <span className="font-mono font-bold text-white">{(aiStatus?.activeProvider || 'loading').toUpperCase()}</span></span>
          </div>
          <span className="text-sm text-gray-400">{user?.email}</span>
          <button onClick={handleLogout} className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-200 rounded text-xs font-medium border border-red-800">
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Session List */}
        <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          <ScenarioPanel socketStatus={scenarioProgress} /> {/* <-- ADD */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Sessions</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 && <p className="p-4 text-gray-500 text-sm">No sessions recorded.</p>}
            {sessions.map(s => (
              <button 
                key={s.id} 
                onClick={() => handleSelectSession(s)}
                className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors ${selectedSession?.id === s.id ? 'bg-gray-800 border-l-4 border-l-cyan-400' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-xs text-gray-400">{s.id.slice(0, 8)}...</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    s.routing_stage === 'deception' ? 'bg-red-900/50 text-red-300' : 
                    s.routing_stage === 'probe' ? 'bg-amber-900/50 text-amber-300' : 'bg-blue-900/50 text-blue-300'
                  }`}>{s.routing_stage}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Score: {s.threat_score}</span>
                  <span className="text-[10px] text-gray-500">{new Date(s.last_activity_at + 'Z').toLocaleTimeString()}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Right Content: Investigation Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedSession ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <AlertOctagon size={48} className="mb-4 opacity-50" />
              <p className="text-lg">Select a session to investigate</p>
              <p className="text-sm mt-2">Interact with the portal at <code className="text-cyan-400">/portal</code> to generate sessions.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Session Header */}
                {/* Session Header */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Session {selectedSession.id.slice(0, 8)}</h2>
                    <p className="text-sm text-gray-400 mt-1">Started: {new Date(selectedSession.started_at + 'Z').toLocaleString()}</p>
                  </div>
                  <div className="flex gap-8 text-center items-center">
                    <div>
                      <p className="text-3xl font-bold text-white">{selectedSession.threat_score}</p>
                      <p className="text-xs text-gray-400 uppercase">Threat Score</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-cyan-400">{criticalEvents}</p>
                      <p className="text-xs text-gray-400 uppercase">Critical Events</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold uppercase px-3 py-1 rounded ${selectedSession.routing_stage === 'deception' ? 'bg-red-900 text-red-200' :
                          selectedSession.routing_stage === 'probe' ? 'bg-amber-900 text-amber-200' : 'bg-blue-900 text-blue-200'
                        }`}>{selectedSession.routing_stage}</p>
                      <p className="text-xs text-gray-400 uppercase mt-1">Stage</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 border-l border-gray-700 pl-6 ml-2">
                      <div className="flex gap-2">
                        <button onClick={() => downloadPDFReport(selectedSession.id)} className="px-3 py-1.5 bg-cyan-800 hover:bg-cyan-700 text-cyan-100 rounded text-xs flex items-center gap-1">
                          <Download size={12} /> PDF Report
                        </button>
                        <button onClick={() => downloadJSONReport(selectedSession.id)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs flex items-center gap-1">
                          <Download size={12} /> JSON
                        </button>
                      </div>
                      <button onClick={handleResetSession} className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-200 rounded text-xs border border-red-800">
                        Reset Session
                      </button>
                    </div>
                  </div>
                </div>

              {/* Intelligence Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <EventTimeline events={sessionDetails?.events || []} />
                </div>
                <div className="lg:col-span-1">
                  <MitrePanel techniques={sessionDetails?.mitreTechniques || []} />
                </div>
              </div>

              {/* AI Summary */}
              {sessionDetails?.intelligence && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide mb-3">AI Threat Intelligence</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Estimated Objective</p>
                      <p className="text-white font-medium">{sessionDetails.intelligence.objective_estimate}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Estimated Skill Level</p>
                      <p className="text-white font-medium">{sessionDetails.intelligence.skill_estimate}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DefenderDashboard;
