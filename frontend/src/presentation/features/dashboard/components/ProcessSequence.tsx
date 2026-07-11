import React, { useEffect, useMemo, useState } from 'react';
import { GetStepCycleUseCase } from '../../../../domain/usecase/get-step-cycle.usecase';
import { StepCycleRepository } from '../../../../infrastructure/repository/step-cycle.repository';
import { GetCatalogsUseCase } from '../../../../domain/usecase/get-catalogs.usecase';
import { CatalogRepository } from '../../../../infrastructure/repository/catalog.repository';
import { CicloPaso } from '../../../../domain/models/step-cycle.model';
import { EstadoFaseItem } from '../../../../domain/models/catalog.model';

const getStepCycleUseCase = new GetStepCycleUseCase(new StepCycleRepository());
const getCatalogsUseCase = new GetCatalogsUseCase(new CatalogRepository());

// Ícono por estado (no vive en el maestro; el maestro aporta etiqueta y color).
const ICON_BY_ESTADO: Record<string, string> = {
    completado: 'check_circle',
    activo: 'play_circle_filled',
    pendiente: 'radio_button_unchecked',
    bloqueado: 'lock',
};

// Clases Tailwind por color del maestro (cat_estado_fase.color).
const COLOR_CLASSES: Record<string, { icon: string; text: string; row: string }> = {
    green: { icon: 'text-green-500', text: 'text-slate-700 dark:text-slate-200', row: 'border border-transparent hover:border-slate-100 dark:hover:border-slate-800' },
    primary: { icon: 'text-primary animate-pulse', text: 'text-primary', row: 'border-2 border-primary/20 bg-primary/5 shadow-sm' },
    slate: { icon: 'text-slate-300', text: 'text-slate-600 dark:text-slate-300', row: 'opacity-60' },
    red: { icon: 'text-red-500', text: 'text-red-700 dark:text-red-400', row: 'bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50' },
};
const FALLBACK = COLOR_CLASSES.slate;

export const ProcessSequence: React.FC = () => {
    const [steps, setSteps] = useState<CicloPaso[]>([]);
    const [estadoCat, setEstadoCat] = useState<EstadoFaseItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Catálogo de estados (una sola vez) — etiquetas y colores predeterminados.
        getCatalogsUseCase.execute()
            .then((cat) => { if (mounted) setEstadoCat(cat.estadoFase); })
            .catch((err) => console.error('Error al obtener catálogos:', err));

        const fetchSteps = async () => {
            try {
                const data = await getStepCycleUseCase.execute();
                if (mounted) setSteps(data);
            } catch (err) {
                console.error('Error al obtener la secuencia de pasos:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchSteps();
        const interval = setInterval(fetchSteps, 2000);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    // Mapa estado -> { etiqueta, color } desde el maestro.
    const estadoMap = useMemo(() => {
        const m: Record<string, EstadoFaseItem> = {};
        estadoCat.forEach(e => { m[e.codigo] = e; });
        return m;
    }, [estadoCat]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Secuencia de Proceso</h3>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-bold">{steps.length} PASOS TOTALES</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {loading && steps.length === 0 ? (
                    <div className="flex justify-center items-center h-24 text-slate-500 text-sm gap-2">
                        <span className="material-icons animate-spin">refresh</span> Cargando secuencia...
                    </div>
                ) : steps.length === 0 ? (
                    <div className="flex justify-center items-center h-24 text-slate-400 text-sm">
                        Sin pasos configurados en la base de datos.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {steps.map(step => {
                            const cat = estadoMap[step.estado];
                            const meta = COLOR_CLASSES[cat?.color ?? ''] ?? FALLBACK;
                            const label = cat?.etiqueta ?? step.estado;
                            const icon = ICON_BY_ESTADO[step.estado] ?? 'radio_button_unchecked';
                            const activo = step.estado === 'activo';
                            return (
                                <div key={step.orden}
                                    className={`flex items-center rounded-lg transition-all ${activo ? 'p-4 relative overflow-hidden' : 'p-3'} ${meta.row}`}>
                                    {activo && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>}
                                    <div className="w-8 flex justify-center">
                                        <span className={`material-icons ${meta.icon}`}>{icon}</span>
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className={`text-sm font-bold ${activo ? 'font-black uppercase' : ''} ${meta.text}`}>
                                                {step.orden}. {step.nombre}
                                            </p>
                                            {activo && <span className="text-[10px] font-bold px-2 py-0.5 bg-primary text-white rounded">ACTIVO</span>}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                            {step.estado === 'completado' && step.duracion > 0
                                                ? `${label} - ${step.duracion.toFixed(2)}s`
                                                : label}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
