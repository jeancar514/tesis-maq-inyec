import React from 'react';
import { InjectionGraphs } from '../components/InjectionGraphs';

export const InjectionGraphsPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Gráficos de Inyección</h1>
                <p className="text-xs text-slate-500 font-medium">Visualización de curvas de presión, velocidad y análisis de ciclo en tiempo real</p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
                <InjectionGraphs />
            </div>
        </div>
    );
};
