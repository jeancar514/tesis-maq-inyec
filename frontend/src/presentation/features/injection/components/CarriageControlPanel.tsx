import React, { useState, useEffect } from 'react';
import { CarriageControlRepository } from '../../../../infrastructure/repository/carriage-control.repository';
import { CarriageControlData } from '../../../../domain/models/carriage-control.model';
import { MovePositionField } from '../../../shared/components/MovePositionField';

const repo = new CarriageControlRepository();

const DEFAULTS: CarriageControlData = {
    carriageControlEncendido: 0,
    carriageTorque: 0,
    carriageCambioPosicion: 0,
    carriagePosicion1: 0,
    carriagePosicion2: 0,
    carriageVelocidadPosicion: 0,
    carriageVelocidad: 0,
    carriagePosicion: 0,
    carriageTorqueSecundario: 0,
};

export const CarriageControlPanel: React.FC = () => {
    const [draft, setDraft] = useState<CarriageControlData>(DEFAULTS);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

    useEffect(() => {
        repo.get().then(setDraft).catch(() => {/* bridge offline */});
    }, []);

    const handleChange = (key: keyof CarriageControlData, value: number) => {
        setDraft(p => ({ ...p, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus('idle');
        try {
            await repo.update({
                carriageControlEncendido: draft.carriageControlEncendido,
                carriageTorque: draft.carriageTorque,
                carriageCambioPosicion: draft.carriageCambioPosicion,
                carriageVelocidadPosicion: draft.carriageVelocidadPosicion,
            });
            setStatus('ok');
        } catch {
            setStatus('error');
        } finally {
            setSaving(false);
            setTimeout(() => setStatus('idle'), 2500);
        }
    };

    const encendido = draft.carriageControlEncendido === 37;

    return (
        <div className="surface-card panel-accent p-4 pl-5">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-icons text-sm text-primary">settings_input_component</span>
                    Control Carro
                </p>
                {status === 'ok' && <StatusBadge ok />}
                {status === 'error' && <StatusBadge />}
            </div>

            <div className="space-y-3">
                <PowerToggle on={encendido} onToggle={() => handleChange('carriageControlEncendido', encendido ? 0 : 37)} />

                <MovePositionField onMove={(t) => repo.move(t, draft.carriageCambioPosicion)} unit="mm" />

                <NumberField icon="compress" label="Torque" unit="%" value={draft.carriageTorque} min={0} max={100} onChange={v => handleChange('carriageTorque', v)} />
                <NumberField icon="swap_horiz" label="Cambio de Posición" unit="mm" value={draft.carriageCambioPosicion} min={0} max={2000} onChange={v => handleChange('carriageCambioPosicion', v)} />
                <NumberField icon="speed" label="Velocidad en Posición" unit="mm/s" value={draft.carriageVelocidadPosicion} min={0} max={500} onChange={v => handleChange('carriageVelocidadPosicion', v)} />
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
