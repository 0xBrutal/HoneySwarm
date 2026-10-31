import { Shield } from 'lucide-react';

const MitrePanel = ({ techniques }) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={16} className="text-cyan-400" />
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">MITRE ATT&CK Mapping</h3>
      </div>
      
      {(!techniques || techniques.length === 0) ? (
        <p className="text-gray-500 text-sm">No techniques mapped yet. Interact with the environment to generate evidence.</p>
      ) : (
        <div className="space-y-2">
          {techniques.map((tech) => (
            <div key={tech.id} className="p-2 bg-gray-800 rounded border border-gray-700">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-cyan-400 font-bold">{tech.id}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-700 text-gray-300">{tech.tactic}</span>
              </div>
              <p className="text-sm text-gray-200 mt-1">{tech.name}</p>
              <p className="text-[10px] text-gray-500 mt-1">Evidence: {tech.evidence.length} event(s)</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MitrePanel;
