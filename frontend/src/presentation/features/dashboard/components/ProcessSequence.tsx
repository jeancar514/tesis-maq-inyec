import React from 'react';

export const ProcessSequence: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Secuencia de Proceso</h3>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-bold">12 PASOS TOTALES</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {/* Steps List */}
                <div className="space-y-1">
                    {/* Completed Steps */}
                    <div className="flex items-center p-3 rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all">
                        <div className="w-8 flex justify-center"><span className="material-icons text-green-500">check_circle</span></div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-bold">1. Cierre de Molde</p>
                            <p className="text-[10px] text-slate-400 font-medium">Completado - 1.20s</p>
                        </div>
                    </div>
                    <div className="flex items-center p-3 rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all">
                        <div className="w-8 flex justify-center"><span className="material-icons text-green-500">check_circle</span></div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-bold">2. Protección de Molde</p>
                            <p className="text-[10px] text-slate-400 font-medium">Completado - 0.45s</p>
                        </div>
                    </div>
                    <div className="flex items-center p-3 rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all">
                        <div className="w-8 flex justify-center"><span className="material-icons text-green-500">check_circle</span></div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-bold">3. Tonelaje</p>
                            <p className="text-[10px] text-slate-400 font-medium">Completado - 0.80s</p>
                        </div>
                    </div>
                    <div className="flex items-center p-3 rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all">
                        <div className="w-8 flex justify-center"><span className="material-icons text-green-500">check_circle</span></div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-bold">4. Avance de Carro</p>
                            <p className="text-[10px] text-slate-400 font-medium">Completado - 1.10s</p>
                        </div>
                    </div>

                    {/* Active Step */}
                    <div className="flex items-center p-4 rounded-xl border-2 border-primary/20 bg-primary/5 relative overflow-hidden shadow-sm">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                        <div className="w-8 flex justify-center relative">
                            <span className="material-icons text-primary animate-pulse">play_circle_filled</span>
                        </div>
                        <div className="ml-4 flex-1">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-black text-primary uppercase">5. Inyección</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary text-white rounded">ACTIVO</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">Ejecutando Fase 2 de Presión...</p>
                        </div>
                    </div>

                    {/* Pending Steps */}
                    <div className="flex items-center p-3 rounded-lg opacity-60">
                        <div className="w-8 flex justify-center"><span className="material-icons text-slate-300">radio_button_unchecked</span></div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium">6. Transferencia V/P</p>
                            <p className="text-[10px] text-slate-400 uppercase">En Espera</p>
                        </div>
                    </div>
                    <div className="flex items-center p-3 rounded-lg opacity-60">
                        <div className="w-8 flex justify-center"><span className="material-icons text-slate-300">radio_button_unchecked</span></div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium">7. Sostenimiento (Holding)</p>
                            <p className="text-[10px] text-slate-400 uppercase">En Espera</p>
                        </div>
                    </div>
                    <div className="flex items-center p-3 rounded-lg opacity-60">
                        <div className="w-8 flex justify-center"><span className="material-icons text-slate-300">radio_button_unchecked</span></div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium">8. Enfriamiento</p>
                            <p className="text-[10px] text-slate-400 uppercase">En Espera</p>
                        </div>
                    </div>

                    {/* Blocked Step */}
                    <div className="flex items-center p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                        <div className="w-8 flex justify-center"><span className="material-icons text-red-500">lock</span></div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">9. Retorno de Carro</p>
                            <p className="text-[10px] text-red-400 font-bold uppercase">Interlock Activo</p>
                        </div>
                    </div>

                    <div className="flex items-center p-3 rounded-lg opacity-60">
                        <div className="w-8 flex justify-center"><span className="material-icons text-slate-300">radio_button_unchecked</span></div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium">10. Apertura</p>
                        </div>
                    </div>
                    <div className="flex items-center p-3 rounded-lg opacity-60">
                        <div className="w-8 flex justify-center"><span className="material-icons text-slate-300">radio_button_unchecked</span></div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium">11. Eyección</p>
                        </div>
                    </div>
                    <div className="flex items-center p-3 rounded-lg opacity-60">
                        <div className="w-8 flex justify-center"><span className="material-icons text-slate-300">radio_button_unchecked</span></div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium">12. Dosificación</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
