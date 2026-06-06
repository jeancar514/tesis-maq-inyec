import React from 'react';
import { ClampParameters } from '../components/ClampParameters';

export const ClampPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Control de Cierre de Molde</h1>
                <p className="text-xs text-slate-500 font-medium">Configuración de etapas y parámetros del sistema de cierre</p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
                <ClampParameters />
            </div>
        </div>
    );
};
