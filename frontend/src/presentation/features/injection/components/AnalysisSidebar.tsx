import React from 'react';
import { InjectionMachine } from './InjectionMachine';

export const AnalysisSidebar: React.FC = () => {
    return (
        <aside className="w-72 bg-slate-50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar h-full">
            {/* Master Overlay Toggle */}
            <button className="w-full flex items-center justify-between p-4 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all group">
                <div className="flex flex-col items-start">
                    <span className="text-[9px] font-bold opacity-80 uppercase tracking-wider">Modo Comparación</span>
                    <span className="text-xs font-bold tracking-wide">Superponer Referencia</span>
                </div>
                <span className="material-icons text-xl group-hover:rotate-12 transition-transform">layers</span>
            </button>

            {/* Measuring Cursor Data */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Valores en Cursor</h3>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: 'TIEMPO', val: '2.25', unit: 's' },
                        { label: 'PRESIÓN', val: '1245', unit: 'bar' },
                        { label: 'VELOCIDAD', val: '85.2', unit: 'mm/s' },
                        { label: 'POSICIÓN', val: '34.1', unit: 'mm' },
                    ].map((kpi) => (
                        <div key={kpi.label} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1">{kpi.label}</span>
                            <span className="text-base font-mono font-bold text-slate-700 dark:text-slate-200">
                                {kpi.val}<small className="text-[9px] ml-1 opacity-50">{kpi.unit}</small>
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cycle Summary KPIs */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Resumen del Ciclo</h3>
                <div className="flex flex-col gap-2">
                    {[
                        { icon: 'timer', label: 'Tiempo de Llenado', val: '1.25s' },
                        { icon: 'vertical_align_top', label: 'Presión Máxima', val: '1450 bar' },
                        { icon: 'bolt', label: 'Energía de Inyección', val: '320 J' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-slate-400 text-base">{item.icon}</span>
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{item.label}</span>
                            </div>
                            <span className="font-mono font-bold text-sm text-slate-700 dark:text-slate-300">{item.val}</span>
                        </div>
                    ))}
                </div>

                {/* Mini Map / Overview of Mold */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative bg-white dark:bg-slate-950 p-2 shadow-inner">
                        <div className="absolute top-2 left-2 z-10">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] rounded font-bold uppercase tracking-wider">Estado: Ciclo Activo</span>
                        </div>
                        <InjectionMachine className="opacity-90 hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 text-[8px] text-white rounded font-bold uppercase tracking-wider backdrop-blur-sm">Esquema Dinámico Sistema</div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
