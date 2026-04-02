import React from 'react';
import { ServoVariableGrid } from '../components/ServoVariableGrid';

export const ServoMonitorPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <ServoVariableGrid />
        </div>
    );
};
