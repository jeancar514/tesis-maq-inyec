import React from 'react';
import { IOMonitor } from '../components/IOMonitor';

export const IOMonitorPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-4 overflow-hidden">
            {/* Page Header */}
            <div className="shrink-0 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        Diagnóstico de Señales PLC
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </h1>
                </div>
                <div className="flex gap-3 pb-1">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                        <span className="material-icons text-sm">print</span>
                        EXPORTAR LOG
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0">
                <IOMonitor />
            </div>
        </div>
    );
};
