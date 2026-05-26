import React from "react";
import { Activity, RefreshCw, ShieldAlert } from "lucide-react";

interface DesignTabProps {
  saving: boolean;
  onRetheme: (type: 'colors' | 'headers') => void;
}

export function DesignTab({ saving, onRetheme }: DesignTabProps) {
  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Activity size={15} className="text-slate-600" />
            <h3 className="font-bold text-[11px] uppercase tracking-wider">Automated Theme Engine</h3>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Beta</span>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex flex-col gap-1">
            <h4 className="text-[14px] font-bold text-slate-800">Slate Re-palette</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Convert existing blue-themed utility classes (#3FA2F6, blue-600) to corporate Slate-900/800 palette across the entire source code.
            </p>
            <button 
              onClick={() => onRetheme('colors')}
              disabled={saving}
              className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Apply Slate Color Palette
            </button>
          </div>

          <div className="h-px bg-slate-100"></div>

          <div className="flex flex-col gap-1">
            <h4 className="text-[14px] font-bold text-slate-800">Corporate Header Conversion</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Automatically find all screen headers with white backgrounds and convert them to high-contrast Dark Slate headers for a premium enterprise look.
            </p>
            <button 
              onClick={() => onRetheme('headers')}
              disabled={saving}
              className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Apply Dark Header Theme
            </button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <div className="flex gap-3">
          <ShieldAlert size={20} className="text-amber-500 shrink-0" />
          <div className="flex flex-col gap-1">
            <h4 className="text-[12px] font-bold text-amber-800 uppercase tracking-tight">Warning: Core Modification</h4>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              These operations perform a recursive find-and-replace on the physical source code files under <code className="bg-amber-100 px-1 rounded">./src</code>. This is equivalent to running a design refactor tool. Changes are permanent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
