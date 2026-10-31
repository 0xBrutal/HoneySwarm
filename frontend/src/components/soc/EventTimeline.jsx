import { AlertTriangle, Info, ShieldAlert, Zap } from 'lucide-react';

const severityConfig = {
  info: { color: 'text-blue-400', bg: 'bg-blue-900/30', icon: Info },
  medium: { color: 'text-amber-400', bg: 'bg-amber-900/30', icon: AlertTriangle },
  high: { color: 'text-orange-400', bg: 'bg-orange-900/30', icon: Zap },
  critical: { color: 'text-red-400', bg: 'bg-red-900/40', icon: ShieldAlert },
};

const EventTimeline = ({ events }) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg h-[400px] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">Event Timeline</h3>
        <span className="text-xs text-gray-500">{events.length} events</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
        {events.length === 0 && (
          <p className="text-gray-500 text-center py-8">Waiting for activity...</p>
        )}
        {events.map((ev) => {
          const config = severityConfig[ev.severity] || severityConfig.info;
          const Icon = config.icon;
          return (
            <div key={ev.id} className={`flex gap-3 p-2 rounded ${config.bg} hover:bg-gray-800 transition-colors`}>
              <Icon size={14} className={`${config.color} mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className={`font-bold ${config.color}`}>{ev.event_type}</span>
                  <span className="text-gray-500 text-[10px]">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-gray-300 truncate">{ev.action || 'No action'}</p>
                {ev.description && <p className="text-gray-500 truncate">{ev.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventTimeline;
