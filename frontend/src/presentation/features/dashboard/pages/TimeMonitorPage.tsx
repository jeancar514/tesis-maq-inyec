import React from 'react';
import { PhaseGantt } from '../components/PhaseGantt';

export const TimeMonitorPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Monitor de Tiempos de Ciclo</h1>
                <p className="text-xs text-slate-500 font-medium">Comparativa en tiempo real entre tiempos programados y reales por fase</p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
                <PhaseGantt />
            </div>
        </div>
    );
};
