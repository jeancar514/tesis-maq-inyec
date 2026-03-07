import React from 'react';
import { EjectionStages } from '../components/EjectionStages';
import { EjectionMonitor } from '../components/EjectionMonitor';

export const EjectionProfilePage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Perfil de Eyección</h1>
                <p className="text-xs text-slate-500 font-medium font-semibold">Configuración de etapas de avance del eyector y monitoreo de carga servo</p>
            </div>

            <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <EjectionStages />
                </div>
                <EjectionMonitor />
            </div>
        </div>
    );
};
