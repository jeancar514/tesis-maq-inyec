import React, { useEffect, useRef, useState } from 'react';
import { GetPhaseTimingUseCase } from '../../../../domain/usecase/get-phase-timing.usecase';
import { SavePhaseTimingUseCase } from '../../../../domain/usecase/save-phase-timing.usecase';
import { PhaseTimingRepository } from '../../../../infrastructure/repository/phase-timing.repository';
import { FaseTiempo } from '../../../../domain/models/phase-timing.model';

const phaseTimingRepository = new PhaseTimingRepository();
const getPhaseTimingUseCase = new GetPhaseTimingUseCase(phaseTimingRepository);
const savePhaseTimingUseCase = new SavePhaseTimingUseCase(phaseTimingRepository);

// Umbral de desviación (real vs programado) para resaltar la fase.
const DESVIACION_UMBRAL = 0.08; // 8%

export const PhaseGantt: React.FC = () => {
    const [phases, setPhases] = useState<FaseTiempo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Snapshot para poder cancelar la edición sin perder los datos en vivo.
    const snapshotRef = useRef<FaseTiempo[]>([]);

    useEffect(() => {
        let mounted = true;
        const fetchPhases = async () => {
            try {
                const data = await getPhaseTimingUseCase.execute();
                // Mientras se edita, se congela la vista para no sobrescribir los cambios en curso.
                if (mounted && !isEditing) setPhases(data);
            } catch (err) {
                console.error('Error al obtener los tiempos por fase:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchPhases();
        const interval = setInterval(fetchPhases, 2000);
        return () => { mounted = false; clearInterval(interval); };
    }, [isEditing]);

    const setField = (orden: number, field: 'tiempoProgramado' | 'tiempoReal', value: number) => {
        setPhases(prev => prev.map(p => p.orden === orden ? { ...p, [field]: value } : p));
    };

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
            const saved = await savePhaseTimingUseCase.execute(phases);
            setPhases(saved);
            setIsEditing(false);
        } catch (err) {
            console.error('Error al guardar los tiempos de fase:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="font-bold flex items-center gap-2 text-sm">
                    <span className="material-icons text-primary text-sm">analytics</span>
                    COMPARATIVA POR FASE
                </h2>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <span className="w-3 h-3 bg-red-500 rounded-sm"></span> Desviación &gt; {(DESVIACION_UMBRAL * 100).toFixed(0)}%
                    </div>
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
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading && phases.length === 0 ? (
                    <div className="flex justify-center items-center h-24 text-slate-500 text-sm gap-2">
                        <span className="material-icons animate-spin">refresh</span> Cargando tiempos...
                    </div>
                ) : phases.length === 0 ? (
                    <div className="flex justify-center items-center h-24 text-slate-400 text-sm">
                        Sin fases configuradas en la base de datos.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {phases.map(phase => {
                            const diferencia = phase.tiempoReal - phase.tiempoProgramado;
                            const desviacionPct = phase.tiempoProgramado > 0
                                ? (diferencia / phase.tiempoProgramado) * 100
                                : 0;
                            const desviado = Math.abs(desviacionPct) > DESVIACION_UMBRAL * 100;

                            return (
                                <div key={phase.orden}
                                    className={`relative rounded-lg border p-3 transition-all ${desviado
                                        ? 'border-red-300 bg-red-50/60 dark:bg-red-950/20 dark:border-red-900'
                                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'}`}>
                                    <div className={`text-xs font-bold uppercase mb-2 ${desviado ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {phase.nombre}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <label className={`flex flex-col rounded border px-2 py-1.5 transition-colors ${isEditing
                                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-within:border-primary'
                                            : 'bg-slate-100/60 dark:bg-slate-800/30 border-transparent'}`}>
                                            <span className="text-[9px] font-bold uppercase text-slate-400">Programado (s)</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                disabled={!isEditing}
                                                className="w-full bg-transparent font-mono text-sm font-bold text-slate-700 dark:text-slate-200 outline-none disabled:cursor-default"
                                                value={phase.tiempoProgramado}
                                                onChange={(e) => setField(phase.orden, 'tiempoProgramado', Number(e.target.value))}
                                            />
                                        </label>
                                        <label className={`flex flex-col rounded border px-2 py-1.5 transition-colors ${isEditing
                                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-within:border-primary'
                                            : 'bg-slate-100/60 dark:bg-slate-800/30 border-transparent'}`}>
                                            <span className="text-[9px] font-bold uppercase text-slate-400">Real (s)</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                disabled={!isEditing}
                                                className={`w-full bg-transparent font-mono text-sm font-bold outline-none disabled:cursor-default ${desviado ? 'text-red-600' : 'text-primary'}`}
                                                value={phase.tiempoReal}
                                                onChange={(e) => setField(phase.orden, 'tiempoReal', Number(e.target.value))}
                                            />
                                        </label>
                                    </div>
                                    <div className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${desviado
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                        : 'bg-slate-200/70 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'}`}>
                                        <span className="material-icons text-xs leading-none">
                                            {diferencia === 0 ? 'remove' : diferencia > 0 ? 'trending_up' : 'trending_down'}
                                        </span>
                                        {diferencia >= 0 ? '+' : ''}{diferencia.toFixed(2)}s ({desviacionPct >= 0 ? '+' : ''}{desviacionPct.toFixed(1)}%)
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};
