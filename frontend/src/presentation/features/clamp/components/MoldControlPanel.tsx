import React, { useState, useEffect } from 'react';
import { MoldControlRepository } from '../../../../infrastructure/repository/mold-control.repository';
import { MoldControlData } from '../../../../domain/models/mold-control.model';

const repo = new MoldControlRepository();

const DEFAULTS: MoldControlData = {
    moldControlEncendido: 0,
    moldTorque: 0,
    moldCambioPosicion: 0,
    moldPosicion1: 0,
    moldPosicion2: 0,
    moldVelocidadPosicion: 0,
};

export const MoldControlPanel: React.FC = () => {
    const [draft, setDraft] = useState<MoldControlData>(DEFAULTS);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

    useEffect(() => {
        repo.get()
            .then(d => { setDraft(d); })
            .catch(() => {/* bridge offline — keep defaults */});
    }, []);

    const handleChange = (key: keyof MoldControlData, value: number) => {
        setDraft(p => ({ ...p, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus('idle');
        try {
            await repo.update(draft);
            setStatus('ok');
        } catch {
            setStatus('error');
        } finally {
            setSaving(false);
            setTimeout(() => setStatus('idle'), 2500);
        }
    };

    const encendido = draft.moldControlEncendido === 37;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-icons text-sm text-primary">settings_input_component</span>
                    Control Molde
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
                {/* Encendido toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-sm text-slate-400">power_settings_new</span>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Encendido</p>
                    </div>
                    <button
                        onClick={() => handleChange('moldControlEncendido', encendido ? 0 : 37)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${encendido ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${encendido ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                {/* Torque */}
                <NumberField
                    icon="compress"
                    label="Torque"
                    unit="%"
                    value={draft.moldTorque}
                    min={0} max={100}
                    onChange={v => handleChange('moldTorque', v)}
                />

                {/* Cambio de Posición */}
                <NumberField
                    icon="swap_horiz"
                    label="Cambio de Posición"
                    unit="mm"
                    value={draft.moldCambioPosicion}
                    min={0} max={2000}
                    onChange={v => handleChange('moldCambioPosicion', v)}
                />

                {/* Posición 1 */}
                <NumberField
                    icon="looks_one"
                    label="Posición 1"
                    unit="mm"
                    value={draft.moldPosicion1}
                    min={0} max={2000}
                    onChange={v => handleChange('moldPosicion1', v)}
                />

                {/* Posición 2 */}
                <NumberField
                    icon="looks_two"
                    label="Posición 2"
                    unit="mm"
                    value={draft.moldPosicion2}
                    min={0} max={2000}
                    onChange={v => handleChange('moldPosicion2', v)}
                />

                {/* Velocidad en Posición */}
                <NumberField
                    icon="speed"
                    label="Velocidad en Posición"
                    unit="mm/s"
                    value={draft.moldVelocidadPosicion}
                    min={0} max={500}
                    onChange={v => handleChange('moldVelocidadPosicion', v)}
                />
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
    icon: string;
    label: string;
    unit: string;
    value: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
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
            type="number"
            min={min} max={max}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary transition-colors"
        />
    </div>
);
