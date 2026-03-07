import React from 'react';

export const EjectionStages: React.FC = () => {
    const stages = [
        { id: 1, label: 'Despegue', pos: "25.0", vel: "40.0"},
        { id: 2, label: 'Expulsión', pos: "120.0", vel: "180.0"},
        { id: 3, label: 'Final', pos: "150.0", vel: "20.0"},
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm">
                    <span className="material-icons text-primary">tune</span>
                    Configuración de Etapas de Avance
                </h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 font-bold">Max Carrera: 250mm</span>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                            <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Etapa</th>
                            <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Posición (mm)</th>
                            <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center text-primary">Velocidad (mm/s)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {stages.map((stage) => (
                            <tr key={stage.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold group-hover:bg-primary group-hover:text-white transition-colors">{stage.id}</span>
                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{stage.label}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <input
                                        className="w-full max-w-[120px] mx-auto block text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary text-sm font-bold tabular-nums outline-none p-1.5"
                                        type="number"
                                        defaultValue={stage.pos}
                                    />
                                </td>
                                <td className="py-4 px-4">
                                    <input
                                        className="w-full max-w-[120px] mx-auto block text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary text-sm font-bold tabular-nums text-primary font-mono outline-none p-1.5"
                                        type="number"
                                        defaultValue={stage.vel}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
