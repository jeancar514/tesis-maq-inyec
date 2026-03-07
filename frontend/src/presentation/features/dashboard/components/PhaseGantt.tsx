import React from 'react';

export const PhaseGantt: React.FC = () => {
    return (
        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="font-bold flex items-center gap-2 text-sm">
                    <span className="material-icons text-primary text-sm">analytics</span>
                    COMPARATIVA POR FASE (GANTT)
                </h2>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-200 rounded-sm"></span> Programado</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-primary rounded-sm"></span> Real</div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                {/* Cierre */}
                <div className="grid grid-cols-12 gap-4 items-center p-1 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="col-span-2 text-xs font-bold uppercase text-slate-500">Cierre</div>
                    <div className="col-span-10 relative h-10 flex flex-col justify-center space-y-1">
                        <div className="w-[85%] bg-slate-200 dark:bg-slate-700 h-2 rounded-full" title="Set: 2.10s"></div>
                        <div className="w-[82%] bg-primary h-3 rounded-full shadow-sm" title="Actual: 2.05s"></div>
                    </div>
                </div>
                {/* Inyección */}
                <div className="grid grid-cols-12 gap-4 items-center p-1 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="col-span-2 text-xs font-bold uppercase text-slate-500">Inyección</div>
                    <div className="col-span-10 relative h-10 flex flex-col justify-center space-y-1">
                        <div className="w-[60%] bg-slate-200 dark:bg-slate-700 h-2 rounded-full"></div>
                        <div className="w-[62%] bg-primary h-3 rounded-full shadow-sm"></div>
                    </div>
                </div>
                {/* Holding - con desviación */}
                <div className="grid grid-cols-12 gap-4 items-center p-1 transition-all rounded hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-600">
                    <div className="col-span-2 text-xs font-bold uppercase">Anclaje</div>
                    <div className="col-span-10 relative h-10 flex flex-col justify-center space-y-1">
                        <div className="w-[40%] bg-slate-200 dark:bg-slate-700 h-2 rounded-full"></div>
                        <div className="w-[45%] bg-orange-500 h-3 rounded-full shadow-sm"></div>
                    </div>
                </div>
                {/* Enfriamiento */}
                <div className="grid grid-cols-12 gap-4 items-center p-1 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="col-span-2 text-xs font-bold uppercase text-slate-500">Enfriamiento</div>
                    <div className="col-span-10 relative h-10 flex flex-col justify-center space-y-1">
                        <div className="w-[95%] bg-slate-200 dark:bg-slate-700 h-2 rounded-full"></div>
                        <div className="w-[94%] bg-primary h-3 rounded-full shadow-sm"></div>
                    </div>
                </div>
                {/* Apertura */}
                <div className="grid grid-cols-12 gap-4 items-center p-1 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="col-span-2 text-xs font-bold uppercase text-slate-500">Apertura</div>
                    <div className="col-span-10 relative h-10 flex flex-col justify-center space-y-1">
                        <div className="w-[70%] bg-slate-200 dark:bg-slate-700 h-2 rounded-full"></div>
                        <div className="w-[70%] bg-primary h-3 rounded-full shadow-sm"></div>
                    </div>
                </div>
                {/* Eyección */}
                <div className="grid grid-cols-12 gap-4 items-center p-1 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="col-span-2 text-xs font-bold uppercase text-slate-500">Eyección</div>
                    <div className="col-span-10 relative h-10 flex flex-col justify-center space-y-1">
                        <div className="w-[30%] bg-slate-200 dark:bg-slate-700 h-2 rounded-full"></div>
                        <div className="w-[28%] bg-primary h-3 rounded-full shadow-sm"></div>
                    </div>
                </div>
                {/* Plastificación */}
                <div className="grid grid-cols-12 gap-4 items-center p-1 transition-all rounded hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="col-span-2 text-xs font-bold uppercase text-slate-500">Plastificación</div>
                    <div className="col-span-10 relative h-10 flex flex-col justify-center space-y-1">
                        <div className="w-[75%] bg-slate-200 dark:bg-slate-700 h-2 rounded-full"></div>
                        <div className="w-[74%] bg-primary h-3 rounded-full shadow-sm"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};
