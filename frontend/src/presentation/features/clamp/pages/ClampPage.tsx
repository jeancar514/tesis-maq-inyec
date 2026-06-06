import React from 'react';
import { ServoVariableGrid } from '../../injection/components/ServoVariableGrid';
import { MoldCanvas } from '../components/MoldCanvas';
import { MoldControlPanel } from '../components/MoldControlPanel';

export const ClampPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">General</h1>
                <p className="text-xs text-slate-500 font-medium">Vista general del molde y variables del servomotor en tiempo real</p>
            </div>

            <div className="shrink-0">
                <ServoVariableGrid />
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 overflow-hidden">
                <div className="col-span-9 min-h-0">
                    <MoldCanvas />
                </div>
                <div className="col-span-3 overflow-y-auto custom-scrollbar">
                    <MoldControlPanel />
                </div>
            </div>
        </div>
    );
};
