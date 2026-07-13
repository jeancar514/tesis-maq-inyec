import React, { useEffect, useRef, useState } from 'react';
import { InjectionProfileRepository } from '../../../../infrastructure/repository/injection-profile.repository';
import { InjectionStage } from '../../../../domain/models/process-profile.model';

const repo = new InjectionProfileRepository();

export const InjectionTable: React.FC = () => {
    const [phases, setPhases] = useState<InjectionStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const snapshotRef = useRef<InjectionStage[]>([]);

    useEffect(() => {
        repo.getInjectionProfile()
            .then(setPhases)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const setField = (orden: number, field: keyof InjectionStage, value: number) =>
        setPhases(prev => prev.map(p => p.orden === orden ? { ...p, [field]: value } : p));

    const handleEnableEdit = () => {
        snapshotRef.current = phases;
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setPhases(snapshotRef.current);
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const saved = await repo.saveInjectionProfile(phases);
            setPhases(saved);
            setIsEditing(false);
        } catch (err) {
            console.error('Error al guardar el perfil de inyección:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2 uppercase text-xs tracking-wider">
                    <span className="material-icons text-primary text-sm">timeline</span> Perfil de Velocidad por Etapa
                </h3>
                {!isEditing ? (
                    <button
                        type="button"
                        onClick={handleEnableEdit}
                        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-icons text-sm">edit</span> Habilitar edición
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
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
                    </div>
                )}
            </div>
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar p-6">
                {loading && phases.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-slate-500 text-sm gap-2">
                        <span className="material-icons animate-spin">refresh</span> Cargando perfil de inyección...
                    </div>
                ) : phases.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-slate-400 text-sm">
                        Sin etapas configuradas.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 h-full">
                        {phases.map((phase) => (
                            <div key={phase.orden}
                                className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-5">
                                <div className="flex items-center gap-3 mb-6 shrink-0">
                                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm">{phase.orden}</span>
                                    <h4 className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Etapa {phase.orden}</h4>
                                </div>
                                <div className="flex-1 flex flex-col justify-between gap-4">
                                    <label className={`flex flex-col gap-2 rounded-xl border px-4 py-4 transition-colors ${isEditing
                                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-within:border-primary'
                                        : 'bg-slate-100/60 dark:bg-slate-800/40 border-transparent'}`}>
                                        <span className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <span className="material-icons text-sm">straighten</span> Punto Inicio
                                            </span>
                                            <span className="font-mono">mm</span>
                                        </span>
                                        <input
                                            type="number"
                                            disabled={!isEditing}
                                            className="w-full bg-transparent font-mono text-2xl font-bold text-slate-800 dark:text-slate-100 outline-none disabled:cursor-default"
                                            value={phase.puntoInicio}
                                            onChange={(e) => setField(phase.orden, 'puntoInicio', Number(e.target.value))}
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
                                            value={phase.velocidad}
                                            onChange={(e) => setField(phase.orden, 'velocidad', Number(e.target.value))}
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
