import React from 'react';
import { ProcessSequence } from '../components/ProcessSequence';

export const StepCyclePage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Control de Secuencia de Ciclo</h1>
                <p className="text-xs text-slate-500 font-medium">Monitoreo detallado de los pasos del proceso de inyección</p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
                <ProcessSequence />
            </div>
        </div>
    );
};
