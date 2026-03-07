import React from 'react';

export const InjectionTable: React.FC = () => {
    const phases = [
        { id: '01', pos: "180.00", vel: "120.0" },
        { id: '02', pos: "145.50", vel: "95.0" },
        { id: '03', pos: "90.25", vel: "150.0" },
        { id: '04', pos: "40.00", vel: "65.0" },
        { id: '05', pos: "15.00", vel: "20.0" },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Etapa</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Punto Inicio (mm)</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-primary">Velocidad (mm/s)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {phases.map((phase) => (
                            <tr key={phase.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-2 font-bold text-slate-400">{phase.id}</td>
                                <td className="px-4 py-2">
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent rounded px-2 py-1.5 font-mono text-sm focus:border-primary focus:ring-0 outline-none transition-all dark:text-slate-200"
                                        type="number"
                                        defaultValue={phase.pos}
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        className="w-full bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded px-2 py-1.5 font-mono text-sm text-primary font-bold focus:ring-0 outline-none transition-all"
                                        type="number"
                                        defaultValue={phase.vel}
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
