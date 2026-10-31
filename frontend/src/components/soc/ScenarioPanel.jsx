import { useState, useEffect, useCallback } from 'react';
import { startScenario, pauseScenario, resumeScenario, stopScenario, getScenarioStatus } from '../../services/api';
import { Play, Pause, Square, Bot, ExternalLink } from 'lucide-react';

const ScenarioPanel = ({ socketStatus }) => {
  const [status, setStatus] = useState({ status: 'idle', stepIndex: 0, totalSteps: 0 });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const s = await getScenarioStatus();
      setStatus(s);
    } catch (e) { /* dashboard may load before backend scenario init */ }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (socketStatus) setStatus(socketStatus);
  }, [socketStatus]);

  const act = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const { status: state, stepIndex, totalSteps, currentStage, sessionId } = status;
  const pct = totalSteps > 0 ? Math.round((stepIndex / totalSteps) * 100) : 0;
  const isActive = state === 'running' || state === 'paused';

  return (
    <div className="p-4 border-b border-gray-800 bg-gray-900">
      <div className="flex items-center gap-2 mb-3">
        <Bot size={16} className="text-cyan-400" />
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Automated Scenario</h2>
      </div>

      {isActive || state === 'completed' || state === 'stopped' ? (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span className="font-bold">{state.toUpperCase()}</span>
            <span>{stepIndex}/{totalSteps} steps</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-cyan-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {currentStage && <p className="text-xs text-cyan-300 mt-2">Stage: {currentStage}</p>}
        </div>
      ) : (
        <p className="text-xs text-gray-500 mb-3">Run the scripted intermediate-skill attacker for a live demonstration.</p>
      )}

      <div className="flex gap-2">
        {(state === 'idle' || state === 'completed' || state === 'stopped') && (
          <button onClick={() => act(startScenario)} disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs font-medium disabled:opacity-50">
            <Play size={12} /> Start
          </button>
        )}
        {state === 'running' && (
          <button onClick={() => act(pauseScenario)} disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded text-xs font-medium disabled:opacity-50">
            <Pause size={12} /> Pause
          </button>
        )}
        {state === 'paused' && (
          <button onClick={() => act(resumeScenario)} disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-medium disabled:opacity-50">
            <Play size={12} /> Resume
          </button>
        )}
        {isActive && (
          <button onClick={() => act(stopScenario)} disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-medium disabled:opacity-50">
            <Square size={12} /> Stop
          </button>
        )}
      </div>

      {sessionId && (
        <a href={`/portal/workspace?attach=${sessionId}`} target="_blank" rel="noreferrer"
          className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-cyan-300">
          <ExternalLink size={12} /> Take over session manually
        </a>
      )}
    </div>
  );
};

export default ScenarioPanel;
