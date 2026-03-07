import React from 'react';

export const HoldingStages: React.FC = () => {
    const stages = [
        { id: '01', pres: 750, time: "1.50", vel: "15.0", pos: "20.0" },
        { id: '02', pres: 620, time: "2.00", vel: "12.0", pos: "18.0" },
        { id: '03', pres: 500, time: "3.00", vel: "8.0", pos: "15.0" },
        { id: '04', pres: 450, time: "1.50", vel: "5.0", pos: "10.0" },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20 shrink-0">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">Etapas de Compactación</h3>
                <button className="text-primary text-xs font-bold hover:underline flex items-center gap-1 transition-all">
                    <span className="material-icons text-sm">add_circle</span> Añadir Etapa
                </button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                            <th className="px-6 py-3">Etapa</th>
                            <th className="px-6 py-3">Presión (bar)</th>
                            <th className="px-6 py-3">Tiempo (s)</th>
                            <th className="px-6 py-3">Velocidad (mm/s)</th>
                            <th className="px-6 py-3">Posición (mm)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {stages.map((stage) => (
                            <tr key={stage.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-slate-400">{stage.id}</td>
                                <td className="px-6 py-4">
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        type="number"
                                        defaultValue={stage.pres}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        step="0.01"
                                        type="number"
                                        defaultValue={stage.time}
                                    />
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{stage.vel}</td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{stage.pos}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
