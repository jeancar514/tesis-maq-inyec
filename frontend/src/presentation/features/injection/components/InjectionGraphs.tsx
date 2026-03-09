import React from 'react';
import { GraphToolbar } from './GraphToolbar';
import { PressureGraph } from './PressureGraph';
import { VelocityGraph } from './VelocityGraph';
import { AnalysisSidebar } from './AnalysisSidebar';

export const InjectionGraphs: React.FC = () => {
    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            {/* Toolbar always visible at the top */}
            <GraphToolbar />

            {/* Main Content Area: Resizes to fill remaining height */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Graphs Column: Should scroll internally if graphs are too tall */}
                <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                    {/* <PressureGraph />
                    <VelocityGraph /> */}
                </div>

                {/* Sidebar Column: Fixed width, scrolls internally */}
                {/* <AnalysisSidebar /> */}
            </div>
        </div>
    );
};
