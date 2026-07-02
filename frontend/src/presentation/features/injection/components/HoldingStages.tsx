import React, { useEffect, useState } from 'react';
import { InjectionProfileRepository } from '../../../../infrastructure/repository/injection-profile.repository';
import { HoldingStage } from '../../../../domain/models/process-profile.model';

const repo = new InjectionProfileRepository();

export const HoldingStages: React.FC = () => {
    const [stages, setStages] = useState<HoldingStage[]>([]);

    useEffect(() => { repo.getHoldingProfile().then(setStages).catch(() => {}); }, []);

    const setField = (orden: number, field: keyof HoldingStage, value: number) =>
        setStages(prev => prev.map(s => s.orden === orden ? { ...s, [field]: value } : s));

    const persist = () => { repo.saveHoldingProfile(stages).catch(() => {}); };

    const addStage = () => {
        setStages(prev => {
            const next = [...prev, { orden: (prev.at(-1)?.orden ?? 0) + 1, presion: 0, tiempo: 0, velocidad: 0, posicion: 0 }];
            repo.saveHoldingProfile(next).catch(() => {});
            return next;
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20 shrink-0">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">Etapas de Compactación</h3>
                <button onClick={addStage} className="text-primary text-xs font-bold hover:underline flex items-center gap-1 transition-all">
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
                            <tr key={stage.orden} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-slate-400">{String(stage.orden).padStart(2, '0')}</td>
                                <td className="px-6 py-4">
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        type="number"
                                        value={stage.presion}
                                        onChange={(e) => setField(stage.orden, 'presion', Number(e.target.value))}
                                        onBlur={persist}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        step="0.01"
                                        type="number"
                                        value={stage.tiempo}
                                        onChange={(e) => setField(stage.orden, 'tiempo', Number(e.target.value))}
                                        onBlur={persist}
                                    />
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{stage.velocidad}</td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{stage.posicion}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
