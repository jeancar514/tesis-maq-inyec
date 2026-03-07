import React from 'react';

export const VelocityGraph: React.FC = () => {
    return (
        <div className="flex-1 min-h-[300px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Velocidad vs. Posición</span>
                <span className="text-[9px] font-mono text-slate-400">Y: mm/s / X: mm</span>
            </div>
            <div className="flex-1 relative p-4">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
                    <line x1="0" y1="280" x2="1000" y2="280" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                    <path d="M0,280 L100,50 L300,50 L500,120 L800,250 L1000,280" fill="none" opacity="0.3" stroke="#94a3b8" strokeDasharray="6,4" strokeWidth="2" />
                    <path d="M0,280 L110,45 L320,55 L510,130 L805,245 L1000,280" fill="none" stroke="#2dd4bf" strokeLinejoin="round" strokeWidth="3" className="drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
                </svg>
            </div>
        </div>
    );
};
