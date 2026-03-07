import React from 'react';

export const PressureGraph: React.FC = () => {
    return (
        <div className="flex-1 min-h-[300px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Presión vs. Tiempo</span>
                <span className="text-[9px] font-mono text-slate-400">Y: bar / X: s</span>
            </div>
            <div className="flex-1 relative p-4 group">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
                    <line x1="0" y1="280" x2="1000" y2="280" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                    <line x1="0" y1="200" x2="1000" y2="200" stroke="currentColor" className="text-slate-100 dark:text-slate-800/50" strokeWidth="1" />
                    <line x1="0" y1="120" x2="1000" y2="120" stroke="currentColor" className="text-slate-100 dark:text-slate-800/50" strokeWidth="1" />
                    <line x1="0" y1="40" x2="1000" y2="40" stroke="currentColor" className="text-slate-100 dark:text-slate-800/50" strokeWidth="1" />
                    <path d="M0,280 Q100,280 200,80 T400,60 T600,60 T800,100 T1000,120" fill="none" opacity="0.3" stroke="#94a3b8" strokeDasharray="6,4" strokeWidth="2" />
                    <path d="M0,280 L180,280 L250,120 L380,50 L550,55 L750,95 L1000,115" fill="none" stroke="#0d7ff2" strokeLinejoin="round" strokeWidth="3" className="drop-shadow-[0_0_8px_rgba(13,127,242,0.4)]" />
                    <line stroke="#0d7ff2" strokeDasharray="4,2" strokeWidth="1" x1="450" x2="450" y1="0" y2="300" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    <circle cx="450" cy="52" fill="#0d7ff2" r="4" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </svg>
                <div className="absolute left-[460px] top-[30px] bg-primary text-white px-3 py-1.5 rounded shadow-xl text-[10px] font-mono z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    T: 2.25s <br /> P: 1245 bar
                </div>
            </div>
        </div>
    );
};
