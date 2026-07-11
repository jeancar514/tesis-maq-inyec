import React, { useEffect, useMemo, useState } from 'react';
import { GetHeatingDiagnosticUseCase } from '../../../../domain/usecase/get-heating-diagnostic.usecase';
import { HeatingDiagnosticRepository } from '../../../../infrastructure/repository/heating-diagnostic.repository';
import { ZonaDiagnostico } from '../../../../domain/models/heating-diagnostic.model';

const useCase = new GetHeatingDiagnosticUseCase(new HeatingDiagnosticRepository());

export const PIDDiagnosticPage: React.FC = () => {
    const [zonas, setZonas] = useState<ZonaDiagnostico[]>([]);
    const [sel, setSel] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            try {
                const data = await useCase.execute();
                if (mounted) setZonas(data);
            } catch (err) {
                console.error('Error al obtener diagnóstico de temperatura:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetch();
        const id = setInterval(fetch, 2000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    const zona = zonas[sel];

    // Dentro de tolerancia?
    const dentroTolerancia = useMemo(() => {
        if (!zona || zona.temperaturaPv === null) return null;
        return zona.temperaturaPv <= zona.setpoint + zona.toleranciaSup
            && zona.temperaturaPv >= zona.setpoint - zona.toleranciaInf;
    }, [zona]);

    return (
        <div className="flex flex-col h-full gap-4 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                    <span className="text-primary material-icons">analytics</span>
                    Diagnóstico de control de temperatura (ON - OFF)
                </h1>
                <p className="text-xs text-slate-500 font-medium">Estado del lazo ON-OFF por zona: valor actual (PV), setpoint y salida SSR</p>
            </div>

            {loading && zonas.length === 0 ? (
                <div className="flex justify-center items-center h-40 text-slate-500 text-sm gap-2">
                    <span className="material-icons animate-spin">refresh</span> Cargando diagnóstico...
                </div>
            ) : zonas.length === 0 ? (
                <div className="flex justify-center items-center h-40 text-slate-400 text-sm">
                    Sin zonas configuradas en la base de datos.
                </div>
            ) : (
                <>
                    {/* Selector de zonas */}
                    <div className="flex gap-2 shrink-0 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit overflow-x-auto">
                        {zonas.map((z, idx) => (
                            <button key={z.codigo} onClick={() => setSel(idx)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${idx === sel
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <span className={`w-2 h-2 rounded-full ${z.estado === 'on' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                                {z.nombre}
                            </button>
                        ))}
                    </div>

                    {/* Tarjetas de la zona seleccionada */}
                    {zona && (
                        <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <MetricCard label="Temperatura (PV)" icon="thermostat"
                                value={zona.temperaturaPv !== null ? `${zona.temperaturaPv.toFixed(1)}°C` : '—'}
                                accent="text-sky-500" />
                            <MetricCard label="Setpoint (SP)" icon="flag"
                                value={`${zona.setpoint.toFixed(1)}°C`} />
                            <MetricCard label="Salida SSR" icon="bolt"
                                value={zona.salidaSsr !== null ? `${zona.salidaSsr.toFixed(0)}%` : '—'}
                                accent={zona.estado === 'on' ? 'text-emerald-500' : 'text-slate-400'} />
                            <MetricCard label="Error (PV - SP)" icon="show_chart"
                                value={zona.error !== null ? `${zona.error > 0 ? '+' : ''}${zona.error.toFixed(2)}°C` : '—'}
                                accent={dentroTolerancia === false ? 'text-orange-500' : 'text-emerald-600'} />
                        </div>
                    )}

                    {/* Estado del lazo */}
                    {zona && (
                        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-center items-center gap-3">
                                <span className={`material-icons text-5xl ${zona.estado === 'on' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {zona.estado === 'on' ? 'toggle_on' : 'toggle_off'}
                                </span>
                                <p className="text-sm font-black uppercase tracking-widest">
                                    Salida {zona.estado === 'on' ? 'ACTIVA' : 'INACTIVA'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {dentroTolerancia === null ? 'Sin lectura' : dentroTolerancia ? 'Dentro de tolerancia' : 'Fuera de tolerancia'}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-center gap-3">
                                <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase">Banda superior</span><span className="font-mono font-bold">{(zona.setpoint + zona.toleranciaSup).toFixed(1)}°C</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase">Setpoint</span><span className="font-mono font-bold text-primary">{zona.setpoint.toFixed(1)}°C</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase">Banda inferior</span><span className="font-mono font-bold">{(zona.setpoint - zona.toleranciaInf).toFixed(1)}°C</span></div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const MetricCard: React.FC<{ label: string; icon: string; value: string; accent?: string }> = ({ label, icon, value, accent }) => (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
            <span className={`material-icons text-lg ${accent || 'text-primary'}`}>{icon}</span>
        </div>
        <div className={`text-2xl font-bold font-mono ${accent || ''}`}>{value}</div>
    </div>
);
