import React from 'react';

export const OpeningStages: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <h3 className="font-bold flex items-center space-x-2 uppercase text-xs tracking-wider">
                    <span className="material-icons text-primary text-sm">tune</span>
                    <span>Configuración de Etapas</span>
                </h3>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                            <th className="px-6 py-3">Etapa de Apertura</th>
                            <th className="px-6 py-3 text-center">Posición (mm)</th>
                            <th className="px-6 py-3 text-center">Velocidad (mm/s)</th>
                            <th className="px-6 py-3 text-center">Aceleración (mm/s²)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">1. Fase 1</td>
                            <td className="px-6 py-4">
                                <input className="w-24 mx-auto block text-center font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number" defaultValue={450.0} />
                            </td>
                            <td className="px-6 py-4">
                                <input className="w-24 mx-auto block text-center font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number" defaultValue={850.0} />
                            </td>
                            <td className="px-6 py-4">
                                <input className="w-24 mx-auto block text-center font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number" defaultValue={1200} />
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">2. Fase 2</td>
                            <td className="px-6 py-4">
                                <input className="w-24 mx-auto block text-center font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number" defaultValue={680.0} />
                            </td>
                            <td className="px-6 py-4">
                                <input className="w-24 mx-auto block text-center font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number" defaultValue={100.0} />
                            </td>
                            <td className="px-6 py-4">
                                <input className="w-24 mx-auto block text-center font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number" defaultValue={600} />
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">3. Posición Final</td>
                            <td className="px-6 py-4">
                                <input className="w-24 mx-auto block text-center font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number" defaultValue={750.0} />
                            </td>
                            <td className="px-6 py-4">
                                <input className="w-24 mx-auto block text-center font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number" defaultValue={20.0} />
                            </td>
                            <td className="px-6 py-4">
                                <input className="w-24 mx-auto block text-center font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number" defaultValue={300} />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
