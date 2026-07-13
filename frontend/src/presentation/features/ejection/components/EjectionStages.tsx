import React, { useEffect, useRef, useState } from 'react';
import { EjectionProfileRepository } from '../../../../infrastructure/repository/ejection-profile.repository';
import { EjectionStage } from '../../../../domain/models/process-profile.model';

const repo = new EjectionProfileRepository();

export const EjectionStages: React.FC = () => {
    const [stages, setStages] = useState<EjectionStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const snapshotRef = useRef<EjectionStage[]>([]);

    useEffect(() => {
        repo.getEjectionProfile()
            .then(setStages)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const setField = (orden: number, field: keyof EjectionStage, value: number) =>
        setStages(prev => prev.map(s => s.orden === orden ? { ...s, [field]: value } : s));

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
            const saved = await repo.saveEjectionProfile(stages);
            setStages(saved);
            setIsEditing(false);
        } catch (err) {
            console.error('Error al guardar el perfil de eyección:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm">
                    <span className="material-icons text-primary">tune</span>
                    Configuración de Etapas de Avance
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 font-bold">Max Carrera: 250mm</span>
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
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                {loading && stages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-slate-500 text-sm gap-2">
                        <span className="material-icons animate-spin">refresh</span> Cargando perfil de eyección...
                    </div>
                ) : stages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-slate-400 text-sm">
                        Sin etapas configuradas.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                        {stages.map((stage) => (
                            <div key={stage.orden}
                                className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-5">
                                <div className="flex items-center gap-3 mb-6 shrink-0">
                                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm">{stage.orden}</span>
                                    <h4 className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">{stage.etiqueta}</h4>
                                </div>
                                <div className="flex-1 flex flex-col justify-between gap-4">
                                    <label className={`flex flex-col gap-2 rounded-xl border px-4 py-4 transition-colors ${isEditing
                                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-within:border-primary'
                                        : 'bg-slate-100/60 dark:bg-slate-800/40 border-transparent'}`}>
                                        <span className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <span className="material-icons text-sm">straighten</span> Posición
                                            </span>
                                            <span className="font-mono">mm</span>
                                        </span>
                                        <input
                                            type="number"
                                            disabled={!isEditing}
                                            className="w-full bg-transparent font-mono text-2xl font-bold text-slate-800 dark:text-slate-100 outline-none disabled:cursor-default"
                                            value={stage.posicion}
                                            onChange={(e) => setField(stage.orden, 'posicion', Number(e.target.value))}
                                        />
                                    </label>
                                    <label className={`flex flex-col gap-2 rounded-xl border px-4 py-4 transition-colors ${isEditing
                                        ? 'bg-white dark:bg-slate-900 border-primary/30 focus-within:border-primary'
                                        : 'bg-primary/5 dark:bg-primary/10 border-transparent'}`}>
                                        <span className="flex items-center justify-between text-[11px] font-bold uppercase text-primary/80">
                                            <span className="flex items-center gap-1.5">
                                                <span className="material-icons text-sm">speed</span> Velocidad
                                            </span>
                                            <span className="font-mono">mm/s</span>
                                        </span>
                                        <input
                                            type="number"
                                            disabled={!isEditing}
                                            className="w-full bg-transparent font-mono text-2xl font-bold text-primary outline-none disabled:cursor-default"
                                            value={stage.velocidad}
                                            onChange={(e) => setField(stage.orden, 'velocidad', Number(e.target.value))}
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
