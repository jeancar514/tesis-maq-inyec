import React from 'react';
import { AlarmHistory } from '../components/AlarmHistory';

export const AlarmHistoryPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-4 overflow-hidden">
            {/* Page Header */}
            <div className="shrink-0">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    Registro Histórico de Fallas
                    <span className="material-icons text-primary">history</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">Consulta cronológica de alarmas, advertencias e información del sistema PLC</p>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0">
                <AlarmHistory />
            </div>
        </div>
    );
};
