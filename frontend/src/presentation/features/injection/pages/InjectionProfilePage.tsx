import React from 'react';
import { InjectionTable } from '../components/InjectionTable';

export const InjectionProfilePage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Configuración de Inyección</h1>
                <p className="text-xs text-slate-500 font-medium">Control de perfil de velocidad y presión por etapas de recorrido</p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
                <InjectionTable />
            </div>
        </div>
    );
};
