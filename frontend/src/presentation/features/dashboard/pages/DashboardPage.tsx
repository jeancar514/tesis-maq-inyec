import React from 'react';
import { KPIGrid } from '../components/KPIGrid';
import { OperationMode } from '../components/OperationMode';
import { CycleCommands } from '../components/CycleCommands';

export const DashboardPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <KPIGrid />
            <div className="flex gap-3 flex-1 min-h-0">
                <div className="flex-1">
                    <OperationMode />
                </div>
            </div>
            <div className="flex gap-3 flex-1 min-h-0">
                <div className="flex-1">
                    <CycleCommands />
                </div>
            </div>
        </div>
    );
};
