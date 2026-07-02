import React, { useEffect, useState } from 'react';
import { ClampProfileRepository } from '../../../../infrastructure/repository/clamp-profile.repository';
import { ClosingStage } from '../../../../domain/models/clamp-profile.model';

const repo = new ClampProfileRepository();

export const ClampParameters: React.FC = () => {
    const [stages, setStages] = useState<ClosingStage[]>([]);

    useEffect(() => { repo.getClosingProfile().then(setStages).catch(() => {}); }, []);

    const setField = (orden: number, field: keyof ClosingStage, value: number) =>
        setStages(prev => prev.map(s => s.orden === orden ? { ...s, [field]: value } : s));

    const persist = () => { repo.saveClosingProfile(stages).catch(() => {}); };

    return (
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <h3 className="font-bold flex items-center gap-2 uppercase text-xs tracking-wider">
                    <span className="material-icons text-primary text-sm">settings</span> Parámetros de Etapa
                </h3>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/20 text-[10px] font-bold uppercase text-slate-400">
                            <th className="px-6 py-3 border-b border-slate-100 dark:border-slate-800">Etapa de Cierre</th>
                            <th className="px-6 py-3 border-b border-slate-100 dark:border-slate-800">Inicio (mm)</th>
                            <th className="px-6 py-3 border-b border-slate-100 dark:border-slate-800">Velocidad (mm/s)</th>
                            <th className="px-6 py-3 border-b border-slate-100 dark:border-slate-800">Torque Máx (%)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {stages.map((stage) => (
                            <tr key={stage.orden} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-semibold text-sm">{stage.orden}. {stage.etiqueta}</td>
                                <td className="px-6 py-4">
                                    <input className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number"
                                        value={stage.inicio}
                                        onChange={(e) => setField(stage.orden, 'inicio', Number(e.target.value))}
                                        onBlur={persist} />
                                </td>
                                <td className="px-6 py-4">
                                    <input className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number"
                                        value={stage.velocidad}
                                        onChange={(e) => setField(stage.orden, 'velocidad', Number(e.target.value))}
                                        onBlur={persist} />
                                </td>
                                <td className="px-6 py-4">
                                    <input className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm focus:ring-primary focus:border-primary" type="number"
                                        value={stage.torqueMax}
                                        onChange={(e) => setField(stage.orden, 'torqueMax', Number(e.target.value))}
                                        onBlur={persist} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
