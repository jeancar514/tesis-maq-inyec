import React, { useState, useEffect } from 'react';
import { EjectorControlRepository } from '../../../../infrastructure/repository/ejector-control.repository';
import { EjectorControlData } from '../../../../domain/models/ejector-control.model';
import { MovePositionField } from '../../../shared/components/MovePositionField';

const repo = new EjectorControlRepository();

const DEFAULTS: EjectorControlData = {
    ejectorControlEncendido: 0,
    ejectorTorque: 0,
    ejectorCambioPosicion: 0,
    ejectorPosicion1: 0,
    ejectorPosicion2: 0,
    ejectorVelocidadPosicion: 0,
    ejectorVelocidad: 0,
    ejectorPosicion: 0,
    ejectorTorqueSecundario: 0,
};

export const EjectorControlPanel: React.FC = () => {
    const [draft, setDraft] = useState<EjectorControlData>(DEFAULTS);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

    useEffect(() => {
        repo.get().then(setDraft).catch(() => {/* bridge offline */});
    }, []);

    const handleChange = (key: keyof EjectorControlData, value: number) => {
        setDraft(p => ({ ...p, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus('idle');
        try {
            await repo.update({
                ejectorControlEncendido: draft.ejectorControlEncendido,
                ejectorTorque: draft.ejectorTorque,
                ejectorCambioPosicion: draft.ejectorCambioPosicion,
                ejectorVelocidadPosicion: draft.ejectorVelocidadPosicion,
            });
            setStatus('ok');
        } catch {
            setStatus('error');
        } finally {
            setSaving(false);
            setTimeout(() => setStatus('idle'), 2500);
        }
    };

    const encendido = draft.ejectorControlEncendido === 37;

    return (
        <div className="surface-card panel-accent p-4 pl-5">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-icons text-sm text-primary">settings_input_component</span>
                    Control Eyector
                </p>
                {status === 'ok' && <StatusBadge ok />}
                {status === 'error' && <StatusBadge />}
            </div>

            <div className="space-y-3">
                <PowerToggle on={encendido} onToggle={() => handleChange('ejectorControlEncendido', encendido ? 0 : 37)} />

                <MovePositionField onMove={(t) => repo.move(t, draft.ejectorCambioPosicion)} unit="mm" />

                <NumberField icon="compress" label="Torque" unit="%" value={draft.ejectorTorque} min={0} max={100} onChange={v => handleChange('ejectorTorque', v)} />
                <NumberField icon="swap_horiz" label="Cambio de Posición" unit="mm" value={draft.ejectorCambioPosicion} min={0} max={2000} onChange={v => handleChange('ejectorCambioPosicion', v)} />
                <NumberField icon="speed" label="Velocidad en Posición" unit="mm/s" value={draft.ejectorVelocidadPosicion} min={0} max={500} onChange={v => handleChange('ejectorVelocidadPosicion', v)} />
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary mt-4 w-full py-2 text-xs">
                <span className="material-icons text-sm">{saving ? 'hourglass_empty' : 'save'}</span>
                {saving ? 'Enviando...' : 'Aplicar cambios'}
            </button>
        </div>
    );
};

const StatusBadge: React.FC<{ ok?: boolean }> = ({ ok }) => (
    ok
        ? <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><span className="material-icons text-sm">check_circle</span> Guardado</span>
        : <span className="text-[10px] font-bold text-red-500 flex items-center gap-1"><span className="material-icons text-sm">error</span> Error</span>
);

const PowerToggle: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
            <span className={`material-icons text-sm ${on ? 'text-emerald-500' : 'text-slate-400'}`}>power_settings_new</span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Encendido</p>
        </div>
        <button onClick={onToggle} className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
        </button>
    </div>
);

const NumberField: React.FC<{
    icon: string; label: string; unit: string; value: number; min: number; max: number; onChange: (v: number) => void;
}> = ({ icon, label, unit, value, min, max, onChange }) => (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-colors">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
                <span className="material-icons text-sm text-slate-400">{icon}</span>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{label}</p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{unit}</span>
        </div>
        <input
            type="number" min={min} max={max} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
    </div>
);
