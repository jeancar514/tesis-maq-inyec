import React from 'react';

export const EjectionMonitor: React.FC = () => {
    return (
        <div className="w-80 flex flex-col gap-3 shrink-0 h-full overflow-y-hidden ">
            {/* Real-Time Monitor */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 shadow-sm shrink-0">
                <h3 className="font-bold mb-2 text-xs flex items-center gap-1 text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    <span className="material-icons text-primary text-base">monitoring</span>
                    Monitor en Tiempo Real
                </h3>
                <div className="space-y-4">
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-md border border-slate-100 dark:border-slate-800 shadow-inner">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Posición Actual Eyector</p>
                        <div className="flex justify-between items-baseline">
                            <span className="text-xl font-mono font-black text-primary">124.52</span>
                            <span className="text-slate-400 font-bold text-[10px] uppercase">mm</span>
                        </div>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-md border border-slate-100 dark:border-slate-800 shadow-inner">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Torque Servo Eyector</p>
                        <div className="flex justify-between items-baseline">
                            <span className="text-xl font-mono font-black text-orange-500">42.8</span>
                            <span className="text-slate-400 font-bold text-[10px] uppercase">%</span>
                        </div>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-md border border-slate-100 dark:border-slate-800 shadow-inner">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Contador de Golpes</p>
                        <div className="flex justify-between items-baseline">
                            <span className="text-xl font-mono font-black text-slate-700 dark:text-slate-200">3</span>
                            <span className="text-slate-400 font-bold text-[10px] uppercase">/ 3</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 shadow-sm shrink-0">
                <h3 className="font-bold mb-2 text-xs uppercase tracking-wide text-slate-800 dark:text-slate-100">Controles Manuales</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button className="flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white transition-all rounded-lg gap-1 border border-slate-200 dark:border-slate-700 group">
                        <span className="material-icons group-hover:scale-110 transition-transform text-base">arrow_forward</span>
                        <span className="text-[9px] font-black uppercase">JOG AVANCE</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white transition-all rounded-lg gap-1 border border-slate-200 dark:border-slate-700 group">
                        <span className="material-icons group-hover:scale-110 transition-transform text-base">arrow_back</span>
                        <span className="text-[9px] font-black uppercase">JOG RETORNO</span>
                    </button>
                    <button className="col-span-2 flex items-center justify-center p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all rounded-lg gap-1 border border-primary/20 shadow-sm mt-0.5">
                        <span className="material-icons text-base group-hover:rotate-12 transition-transform">home</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Retorno a Home</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
