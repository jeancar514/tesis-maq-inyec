import React from 'react';
import { HoldingStages } from '../components/HoldingStages';

export const HoldingPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Compactación (Holding)</h1>
                <p className="text-xs text-slate-500 font-medium">Configuración de las etapas de mantenimiento de presión posterior a la inyección</p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
                <HoldingStages />
            </div>
        </div>
    );
};
