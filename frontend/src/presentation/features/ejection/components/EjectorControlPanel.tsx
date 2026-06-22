import React, { useState, useEffect } from 'react';
import { EjectorControlRepository } from '../../../../infrastructure/repository/ejector-control.repository';
import { EjectorControlData } from '../../../../domain/models/ejector-control.model';

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

const WRITABLE_KEYS: (keyof EjectorControlData)[] = [
    'ejectorControlEncendido',
    'ejectorTorque',
    'ejectorCambioPosicion',
    'ejectorPosicion1',
    'ejectorPosicion2',
    'ejectorVelocidadPosicion',
];

export const EjectorControlPanel: React.FC = () => {
    const [draft, setDraft] = useState<EjectorControlData>(DEFAULTS);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

    useEffect(() => {
        repo.get().then(setDraft).catch(() => {/* bridge offline — keep defaults */});
    }, []);

    const handleChange = (key: keyof EjectorControlData, value: number) => {
        setDraft(p => ({ ...p, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus('idle');
        try {
            const payload: Partial<EjectorControlData> = {};
            WRITABLE_KEYS.forEach(k => { payload[k] = draft[k]; });
            await repo.update(payload);
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-icons text-sm text-primary">settings_input_component</span>
                    Control Eyector
                </p>
                {status === 'ok' && (
                    <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                        <span className="material-icons text-sm">check_circle</span> Guardado
                    </span>
                )}
                {status === 'error' && (
                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                        <span className="material-icons text-sm">error</span> Error
                    </span>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-sm text-slate-400">power_settings_new</span>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Encendido</p>
                    </div>
                    <button
                        onClick={() => handleChange('ejectorControlEncendido', encendido ? 0 : 37)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${encendido ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${encendido ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                <NumberField icon="compress" label="Torque" unit="%" value={draft.ejectorTorque} min={0} max={100} onChange={v => handleChange('ejectorTorque', v)} />
                <NumberField icon="swap_horiz" label="Cambio de Posición" unit="mm" value={draft.ejectorCambioPosicion} min={0} max={2000} onChange={v => handleChange('ejectorCambioPosicion', v)} />
                <NumberField icon="looks_one" label="Posición 1" unit="mm" value={draft.ejectorPosicion1} min={0} max={2000} onChange={v => handleChange('ejectorPosicion1', v)} />
                <NumberField icon="looks_two" label="Posición 2" unit="mm" value={draft.ejectorPosicion2} min={0} max={2000} onChange={v => handleChange('ejectorPosicion2', v)} />
                <NumberField icon="speed" label="Velocidad en Posición" unit="mm/s" value={draft.ejectorVelocidadPosicion} min={0} max={500} onChange={v => handleChange('ejectorVelocidadPosicion', v)} />
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-white font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                <span className="material-icons text-sm">{saving ? 'hourglass_empty' : 'save'}</span>
                {saving ? 'Enviando...' : 'Aplicar cambios'}
            </button>
        </div>
    );
};

const NumberField: React.FC<{
    icon: string; label: string; unit: string; value: number; min: number; max: number; onChange: (v: number) => void;
}> = ({ icon, label, unit, value, min, max, onChange }) => (
    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
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
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary transition-colors"
        />
    </div>
);
