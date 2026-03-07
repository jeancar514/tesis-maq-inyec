import React from 'react';

export const PIDChart: React.FC = () => {
    return (
        <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <span className="material-icons text-primary">timeline</span>
                    Estabilidad Térmica - Tiempo Real
                </h2>
            </div>

            <div className="flex-1 relative rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden bg-slate-50/30 dark:bg-slate-950/30">
                {/* SVG Chart Simulation */}
                <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
                    {/* Grid Lines Horizontal */}
                    <line className="stroke-slate-100 dark:stroke-slate-800" x1="0" x2="1000" y1="100" y2="100" />
                    <line className="stroke-slate-100 dark:stroke-slate-800" x1="0" x2="1000" y1="200" y2="200" />
                    <line className="stroke-slate-100 dark:stroke-slate-800" x1="0" x2="1000" y1="300" y2="300" />

                    {/* SP (Setpoint) - Blue Straightish line */}
                    <path d="M 0 200 L 400 200 L 400 150 L 1000 150" fill="none" stroke="#3b82f6" strokeWidth="2" />

                    {/* PV (Process Value) - Red Curve with Overshoot */}
                    <path
                        d="M 0 350 Q 150 350, 300 250 T 400 150 T 450 120 T 520 160 T 600 145 T 700 152 L 1000 150"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3"
                        className="animate-pulse"
                    />

                    {/* Power Output - Dashed Grey */}
                    <path d="M 0 380 L 380 380 L 400 100 L 450 300 L 500 200 L 1000 280" fill="none" stroke="#94a3b8" strokeDasharray="5,5" strokeWidth="1" />
                </svg>

                {/* Overlay Markers */}
                <div className="absolute top-4 left-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg border border-primary/20 text-[9px] font-mono leading-relaxed shadow-sm">
                    <span className="text-slate-400 font-bold uppercase block mb-1">Ejes</span>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary/20"></span>
                            <span>Y-AXIS: TEMP (°C)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary/20"></span>
                            <span>X-AXIS: TIME (s)</span>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-4 right-4 flex gap-2">
                    <button className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors">
                        <span className="material-icons text-sm text-slate-600 dark:text-slate-400">fullscreen</span>
                    </button>
                    <button className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors">
                        <span className="material-icons text-sm text-slate-600 dark:text-slate-400">download</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
