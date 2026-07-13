import React, { useEffect, useRef, useState } from 'react';
import { ZoneCard } from '../components/ZoneCard';
import { HeatingZoneRepository } from '../../../../infrastructure/repository/heating-zone.repository';
import { HeatingZone } from '../../../../domain/models/process-profile.model';

const repo = new HeatingZoneRepository();

export const HeatingZonesPage: React.FC = () => {
    const [zones, setZones] = useState<HeatingZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activating, setActivating] = useState(false);

    const snapshotRef = useRef<HeatingZone[]>([]);

    useEffect(() => {
        repo.getZones()
            .then(setZones)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const setField = (id: number, field: keyof HeatingZone, value: number | boolean) =>
        setZones(prev => prev.map(z => z.id === id ? { ...z, [field]: value } : z));

    const handleEnableEdit = () => {
        snapshotRef.current = zones;
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setZones(snapshotRef.current);
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const saved = await repo.saveZones(zones);
            setZones(saved);
            setIsEditing(false);
        } catch (err) {
            console.error('Error al guardar las zonas de calefacción:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleActivateAll = async () => {
        setActivating(true);
        try {
            const next = zones.map(z => ({ ...z, activa: true }));
            const saved = await repo.saveZones(next);
            setZones(saved);
        } catch (err) {
            console.error('Error al activar las zonas:', err);
        } finally {
            setActivating(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 overflow-hidden">
            {/* Header Section */}
            <div className="shrink-0 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Zonas del Cilindro</h1>
                    <p className="text-xs text-slate-500 font-medium">Monitoreo y control térmico de las bandas calefactoras del cañón</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleActivateAll}
                        disabled={activating || zones.length === 0}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/30 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm group disabled:opacity-50"
                    >
                        <span className={`material-icons text-sm ${activating ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                            {activating ? 'refresh' : 'done_all'}
                        </span>
                        ACTIVAR TODAS LAS ZONAS
                    </button>
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={handleEnableEdit}
                            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-icons text-sm">edit</span> Habilitar edición
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                <span className="material-icons text-sm">close</span> Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
                            >
                                <span className={`material-icons text-sm ${saving ? 'animate-spin' : ''}`}>{saving ? 'refresh' : 'save'}</span>
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Monitor Section Title */}
            <div className="shrink-0 flex items-center justify-between px-1">
                <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-icons text-lg">thermostat</span>
                    Monitor de Zonas
                </h2>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Sistema OK</span>
                    </div>
                </div>
            </div>

            {/* Zone Cards Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-4">
                {loading && zones.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-slate-500 text-sm gap-2">
                        <span className="material-icons animate-spin">refresh</span> Cargando zonas...
                    </div>
                ) : zones.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-slate-400 text-sm">
                        Sin zonas configuradas.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
                        {zones.map((zone) => (
                            <ZoneCard
                                key={zone.id}
                                zone={zone}
                                isEditing={isEditing}
                                onChange={(field, value) => setField(zone.id, field, value)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
