import React from 'react';
import { PIDChart } from '../components/PIDChart';

export const PIDDiagnosticPage: React.FC = () => {
    const zones = ['Boquilla', 'Zona 1', 'Zona 2', 'Zona 3', 'Zona 4', 'Zona 5'];

    return (
        <div className="flex flex-col h-full gap-4 overflow-hidden">
            {/* Header Section */}
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                    <span className="text-primary material-icons">analytics</span>
                    Diagnóstico PID de Calentamiento
                </h1>
                <p className="text-xs text-slate-500 font-medium">Análisis de estabilidad térmica y sintonización de lazos de control por zona</p>
            </div>

            {/* Zone Selector Tabs */}
            <div className="flex gap-2 shrink-0 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
                {zones.map((zone, idx) => (
                    <button
                        key={zone}
                        className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${idx === 0
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        {zone}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm">
                    <PIDChart />
                </div>
            </div>

            {/* Bottom KPIs */}
            <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { icon: 'error_outline', col: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Error Máximo (Overshoot)', val: '1.2°C' },
                    { icon: 'timer', col: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Tiempo de Asentamiento', val: '240s' },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:border-primary/20">
                        <div className={`w-12 h-12 rounded-xl ${kpi.bg} ${kpi.col} flex items-center justify-center shadow-inner`}>
                            <span className="material-icons text-2xl">{kpi.icon}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">{kpi.label}</p>
                            <p className="text-xl font-mono font-black text-slate-800 dark:text-slate-100">{kpi.val}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
