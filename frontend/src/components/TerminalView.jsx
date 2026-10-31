import { useState, useRef, useEffect } from 'react';
import { terminalCommand } from '../services/simulationApi';

const WELCOME = [
  { type: 'system', text: 'Vertex Dynamics Corporate Shell (vd-corp-01)' },
  { type: 'system', text: 'Authorized use only. All activity is monitored and recorded.' },
  { type: 'system', text: 'Type "help" to list available commands.' },
];

const TerminalView = ({ simState, onStateChange }) => {
  const [lines, setLines] = useState(WELCOME);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [histIndex, setHistIndex] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [lines]);

  const run = async (cmd) => {
    setLines((prev) => [...prev, { type: 'input', text: cmd }]);
    if (!cmd.trim()) return;
    setBusy(true);
    try {
      const res = await terminalCommand(cmd);
      if (res.output === '__CLEAR__') {
        setLines(WELCOME);
      } else if (res.output) {
        setLines((prev) => [...prev, ...res.output.split('\n').map((l) => ({ type: 'output', text: l }))]);
      }
      if (res.state) onStateChange?.(res.state);
    } catch (err) {
      setLines((prev) => [...prev, { type: 'error', text: err.message }]);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      const cmd = input;
      setInput('');
      if (cmd.trim()) {
        setHistory((prev) => [...prev, cmd]);
      }
      setHistIndex(-1);
      run(cmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = histIndex === -1 ? history.length - 1 : Math.max(0, histIndex - 1);
      setHistIndex(nextIdx);
      setInput(history[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIndex === -1) return;
      const nextIdx = histIndex + 1;
      if (nextIdx >= history.length) { setHistIndex(-1); setInput(''); }
      else { setHistIndex(nextIdx); setInput(history[nextIdx]); }
    }
  };

  const user = simState?.currentUser || 'guest';
  const cwd = simState?.cwd || '~';
  const promptPath = cwd.replace(`/home/${user}`, '~');
  const colorFor = (t) => {
    if (t === 'input') return 'text-green-300';
    if (t === 'system') return 'text-cyan-400';
    if (t === 'error') return 'text-red-400';
    return 'text-gray-200';
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 h-[620px] flex flex-col"
         onClick={() => inputRef.current?.focus()}>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700">
        <span className="w-3 h-3 rounded-full bg-red-500"></span>
        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
        <span className="w-3 h-3 rounded-full bg-green-500"></span>
        <span className="ml-2 text-gray-400 text-sm">{user}@vd-corp-01 — secure shell</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed">
        {lines.map((l, i) => (
          <div key={i} className={`whitespace-pre-wrap ${colorFor(l.type)}`}>
            {l.type === 'input' ? `${user}@vd-corp-01:${promptPath}$ ${l.text}` : (l.text || '\u00A0')}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-700 flex items-center font-mono text-sm">
        <span className="text-green-400 mr-2 whitespace-nowrap">{user}@vd-corp-01:{promptPath}$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={busy}
          className="flex-1 bg-transparent text-gray-100 outline-none"
          placeholder={busy ? 'processing...' : ''}
          autoFocus
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default TerminalView;
