import React from 'react';
import { OpeningStages } from '../components/OpeningStages';

export const OpeningProfilePage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Perfil de Apertura de Molde</h1>
                <p className="text-xs text-slate-500 font-medium">Configuración de posición, velocidad y aceleración por etapa de apertura</p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
                <OpeningStages />
            </div>
        </div>
    );
};
