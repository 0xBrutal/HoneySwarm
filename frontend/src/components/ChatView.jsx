import { useState, useRef, useEffect } from 'react';
import { sendChat } from '../services/simulationApi';
import { Bot, User, Send } from 'lucide-react';

const ChatView = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm Vera, the Vertex Dynamics HR assistant. How can I help you today?", provider: 'system' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setBusy(true);
    try {
      const res = await sendChat(text);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, provider: res.provider }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}`, provider: 'error' }]);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-[620px] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Bot size={16} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">Vera — HR Assistant</p>
          <p className="text-xs text-gray-400">Ask about policies, onboarding, or benefits</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={12} className="text-blue-600" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
              m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && m.provider && m.provider !== 'system' && (
                <p className="text-[10px] text-gray-400 mt-1">responded by: {m.provider}</p>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={12} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {busy && <p className="text-xs text-gray-400 ml-8">Vera is typing...</p>}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message Vera..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={send} disabled={busy}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatView;
