import React from 'react';
import { useStore } from '../../store/useStore';
import { Terminal } from 'lucide-react';

export const LogPanel = () => {
  const { logs } = useStore();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div ref={scrollRef} className="bg-slate-900 rounded-[20px] p-4 text-white text-[11px] font-mono shadow-inner h-[200px] overflow-y-auto w-full border border-slate-700">
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700 sticky top-0 bg-slate-900">
            <span className="font-bold flex items-center gap-1"><Terminal size={12}/> Network Logs</span>
            <span className="text-slate-500">{logs.length} entries</span>
        </div>
      {logs.map((log, i) => (
        <div key={i} className="mb-0.5 border-b border-slate-800/50 pb-0.5 whitespace-pre-wrap">{log}</div>
      ))}
    </div>
  );
};
