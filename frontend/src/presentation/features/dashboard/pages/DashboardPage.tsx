import React from 'react';
import { KPIGrid } from '../components/KPIGrid';
import { OperationMode } from '../components/OperationMode';
import { CycleCommands } from '../components/CycleCommands';

export const DashboardPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-2 overflow-hidden">
            {/* KPIs — ocupa solo lo necesario */}
            <div className="shrink-0">
                <KPIGrid />
            </div>

            {/* Modo de operación + Comandos de ciclo — lado a lado, llenan el resto */}
            <div className="flex-1 min-h-0 grid grid-cols-2 gap-2">
                <OperationMode />
                <CycleCommands />
            </div>
        </div>
    );
};
