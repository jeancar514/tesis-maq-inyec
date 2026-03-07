import React from 'react';

interface ZoneCardProps {
    name: string;
    pv: number;
    sp: number;
    ssr: number;
    tolSup: string;
    tolInf: string;
    statusColor?: string;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({
    name,
    pv,
    sp,
    ssr,
    tolSup,
    tolInf,
    statusColor = "bg-emerald-500"
}) => {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md hover:border-primary/20">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{name}</span>
                <div className={`w-2 h-2 ${statusColor} rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]`}></div>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-6">
                <div className="text-center">
                    <span className="text-4xl font-mono font-black tracking-tighter text-slate-800 dark:text-slate-100">
                        {pv}<span className="text-lg font-bold text-slate-300 dark:text-slate-600 ml-0.5">°C</span>
                    </span>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black mt-1 tracking-widest">Temperatura Real (PV)</p>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Setpoint (SP)</label>
                        <div className="relative group">
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-lg px-3 py-2 text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                type="number"
                                defaultValue={sp}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 font-bold text-sm">°C</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1.5 items-center">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Salida SSR</label>
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{ssr}%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 block">Tol. Sup.</label>
                            <input
                                className="w-full text-center bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold py-1 dark:text-slate-300 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                type="text"
                                defaultValue={tolSup}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 block">Tol. Inf.</label>
                            <input
                                className="w-full text-center bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold py-1 dark:text-slate-300 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                type="text"
                                defaultValue={tolInf}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
