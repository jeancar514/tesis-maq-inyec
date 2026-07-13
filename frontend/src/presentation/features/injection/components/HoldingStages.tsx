import React, { useEffect, useRef, useState } from 'react';
import { InjectionProfileRepository } from '../../../../infrastructure/repository/injection-profile.repository';
import { HoldingStage } from '../../../../domain/models/process-profile.model';

const repo = new InjectionProfileRepository();

export const HoldingStages: React.FC = () => {
    const [stages, setStages] = useState<HoldingStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const snapshotRef = useRef<HoldingStage[]>([]);

    useEffect(() => {
        repo.getHoldingProfile()
            .then(setStages)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const setField = (orden: number, field: keyof HoldingStage, value: number) =>
        setStages(prev => prev.map(s => s.orden === orden ? { ...s, [field]: value } : s));

    const addStage = () => {
        setStages(prev => [...prev, { orden: (prev.at(-1)?.orden ?? 0) + 1, presion: 0, tiempo: 0, velocidad: 0, posicion: 0 }]);
    };

    const handleEnableEdit = () => {
        snapshotRef.current = stages;
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setStages(snapshotRef.current);
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const saved = await repo.saveHoldingProfile(stages);
            setStages(saved);
            setIsEditing(false);
        } catch (err) {
            console.error('Error al guardar el perfil de sostenimiento:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20 shrink-0">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">Etapas de Compactación</h3>
                <div className="flex items-center gap-2">
                    {isEditing && (
                        <button onClick={addStage} className="text-primary text-[11px] font-bold uppercase tracking-wide hover:underline flex items-center gap-1 transition-all">
                            <span className="material-icons text-sm">add_circle</span> Añadir Etapa
                        </button>
                    )}
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={handleEnableEdit}
                            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-icons text-sm">edit</span> Habilitar edición
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                <span className="material-icons text-sm">close</span> Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
                            >
                                <span className={`material-icons text-sm ${saving ? 'animate-spin' : ''}`}>{saving ? 'refresh' : 'save'}</span>
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar p-6">
                {loading && stages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-slate-500 text-sm gap-2">
                        <span className="material-icons animate-spin">refresh</span> Cargando perfil de sostenimiento...
                    </div>
                ) : stages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-slate-400 text-sm">
                        Sin etapas configuradas.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 h-full">
                        {stages.map((stage) => (
                            <div key={stage.orden}
                                className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-5">
                                <div className="flex items-center gap-3 mb-6 shrink-0">
                                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm">{stage.orden}</span>
                                    <h4 className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Etapa {stage.orden}</h4>
                                </div>
                                <div className="flex-1 flex flex-col justify-between gap-3">
                                    <label className={`flex flex-col gap-2 rounded-xl border px-4 py-3 transition-colors ${isEditing
                                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-within:border-primary'
                                        : 'bg-slate-100/60 dark:bg-slate-800/40 border-transparent'}`}>
                                        <span className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <span className="material-icons text-sm">compress</span> Presión
                                            </span>
                                            <span className="font-mono">bar</span>
                                        </span>
                                        <input
                                            type="number"
                                            disabled={!isEditing}
                                            className="w-full bg-transparent font-mono text-xl font-bold text-slate-800 dark:text-slate-100 outline-none disabled:cursor-default"
                                            value={stage.presion}
                                            onChange={(e) => setField(stage.orden, 'presion', Number(e.target.value))}
                                        />
                                    </label>
                                    <label className={`flex flex-col gap-2 rounded-xl border px-4 py-3 transition-colors ${isEditing
                                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-within:border-primary'
                                        : 'bg-slate-100/60 dark:bg-slate-800/40 border-transparent'}`}>
                                        <span className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <span className="material-icons text-sm">timer</span> Tiempo
                                            </span>
                                            <span className="font-mono">s</span>
                                        </span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            disabled={!isEditing}
                                            className="w-full bg-transparent font-mono text-xl font-bold text-slate-800 dark:text-slate-100 outline-none disabled:cursor-default"
                                            value={stage.tiempo}
                                            onChange={(e) => setField(stage.orden, 'tiempo', Number(e.target.value))}
                                        />
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1 rounded-xl border border-transparent bg-slate-100/60 dark:bg-slate-800/40 px-3 py-2">
                                            <span className="text-[9px] font-bold uppercase text-slate-400">Velocidad</span>
                                            <span className="font-mono text-sm font-bold text-slate-500 dark:text-slate-400">{stage.velocidad} mm/s</span>
                                        </div>
                                        <div className="flex flex-col gap-1 rounded-xl border border-transparent bg-slate-100/60 dark:bg-slate-800/40 px-3 py-2">
                                            <span className="text-[9px] font-bold uppercase text-slate-400">Posición</span>
                                            <span className="font-mono text-sm font-bold text-slate-500 dark:text-slate-400">{stage.posicion} mm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
