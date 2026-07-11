import React, { useEffect, useMemo, useState } from 'react';
import { GetPhaseTimingUseCase } from '../../../../domain/usecase/get-phase-timing.usecase';
import { PhaseTimingRepository } from '../../../../infrastructure/repository/phase-timing.repository';
import { FaseTiempo } from '../../../../domain/models/phase-timing.model';

const getPhaseTimingUseCase = new GetPhaseTimingUseCase(new PhaseTimingRepository());

// Umbral de desviación (real vs programado) para resaltar en naranja.
const DESVIACION_UMBRAL = 0.08; // 8%

export const PhaseGantt: React.FC = () => {
    const [phases, setPhases] = useState<FaseTiempo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchPhases = async () => {
            try {
                const data = await getPhaseTimingUseCase.execute();
                if (mounted) setPhases(data);
            } catch (err) {
                console.error('Error al obtener los tiempos por fase:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchPhases();
        const interval = setInterval(fetchPhases, 2000);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    // Escala: el mayor tiempo (programado o real) equivale al 100% de ancho.
    const maxTiempo = useMemo(() => {
        const vals = phases.flatMap(p => [p.tiempoProgramado, p.tiempoReal]);
        return Math.max(1, ...vals);
    }, [phases]);

    const pct = (v: number) => `${Math.min(100, (v / maxTiempo) * 100)}%`;

    return (
        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="font-bold flex items-center gap-2 text-sm">
                    <span className="material-icons text-primary text-sm">analytics</span>
                    COMPARATIVA POR FASE (GANTT)
                </h2>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-200 rounded-sm"></span> Programado</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-primary rounded-sm"></span> Real</div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                {loading && phases.length === 0 ? (
                    <div className="flex justify-center items-center h-24 text-slate-500 text-sm gap-2">
                        <span className="material-icons animate-spin">refresh</span> Cargando tiempos...
                    </div>
                ) : phases.length === 0 ? (
                    <div className="flex justify-center items-center h-24 text-slate-400 text-sm">
                        Sin fases configuradas en la base de datos.
                    </div>
                ) : (
                    phases.map(phase => {
                        const desviado = phase.tiempoProgramado > 0 &&
                            Math.abs(phase.tiempoReal - phase.tiempoProgramado) / phase.tiempoProgramado > DESVIACION_UMBRAL;
                        return (
                            <div key={phase.orden}
                                className={`grid grid-cols-12 gap-4 items-center p-1 transition-all rounded ${desviado ? 'hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                <div className={`col-span-2 text-xs font-bold uppercase ${desviado ? '' : 'text-slate-500'}`}>{phase.nombre}</div>
                                <div className="col-span-10 relative h-10 flex flex-col justify-center space-y-1">
                                    <div className="bg-slate-200 dark:bg-slate-700 h-2 rounded-full" style={{ width: pct(phase.tiempoProgramado) }}
                                        title={`Programado: ${phase.tiempoProgramado.toFixed(2)}s`}></div>
                                    <div className={`${desviado ? 'bg-orange-500' : 'bg-primary'} h-3 rounded-full shadow-sm`} style={{ width: pct(phase.tiempoReal) }}
                                        title={`Real: ${phase.tiempoReal.toFixed(2)}s`}></div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};
