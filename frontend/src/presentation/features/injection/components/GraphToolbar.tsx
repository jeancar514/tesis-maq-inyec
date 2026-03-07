import React from 'react';

export const GraphToolbar: React.FC = () => {
    return (
        <div className="h-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button className="px-3 py-1 rounded-md bg-white dark:bg-slate-700 shadow-sm text-xs font-semibold text-primary">REAL-TIME</button>
                    <button className="px-3 py-1 rounded-md text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">HISTORIAL</button>
                </div>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.6)]"></span>
                    <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600 dark:text-slate-300">Ciclo Actual</span>
                    <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400 ml-2"></span>
                    <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Curva Maestra</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:border-primary transition-colors uppercase tracking-wider">
                    <span className="material-icons text-sm">zoom_in</span> ZOOM
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:border-primary transition-colors uppercase tracking-wider">
                    <span className="material-icons text-sm">settings_overscan</span> AUTO-ESCALA
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-red-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors uppercase tracking-wider">
                    <span className="material-icons text-sm">delete_sweep</span> LIMPIAR
                </button>
            </div>
        </div>
    );
};
