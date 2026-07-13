import React from 'react';
import { HeatingZone } from '../../../../domain/models/process-profile.model';

interface ZoneCardProps {
    zone: HeatingZone;
    isEditing: boolean;
    onChange: (field: keyof HeatingZone, value: number | boolean) => void;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({ zone, isEditing, onChange }) => {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md hover:border-primary/20">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{zone.nombre}</span>
                <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => onChange('activa', !zone.activa)}
                    title={zone.activa ? 'Zona activa' : 'Zona inactiva'}
                    className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full transition-colors ${isEditing ? 'cursor-pointer' : 'cursor-default'} ${zone.activa
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'}`}
                >
                    <span className={`w-2 h-2 rounded-full ${zone.activa ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
                    {zone.activa ? 'Activa' : 'Inactiva'}
                </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
                <label className={`flex flex-col gap-2 rounded-xl border px-4 py-4 transition-colors ${isEditing
                    ? 'bg-white dark:bg-slate-950 border-primary/30 focus-within:border-primary'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700'}`}>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Setpoint (SP)</span>
                    <div className="relative">
                        <input
                            className="w-full bg-transparent font-mono font-black text-2xl text-primary outline-none disabled:cursor-default"
                            type="number"
                            disabled={!isEditing}
                            value={zone.setpoint}
                            onChange={(e) => onChange('setpoint', Number(e.target.value))}
                        />
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 font-bold text-sm">°C</span>
                    </div>
                </label>

                <div className="grid grid-cols-2 gap-3">
                    <label className={`flex flex-col gap-1.5 rounded-xl border px-3 py-3 transition-colors ${isEditing
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-within:border-primary'
                        : 'bg-slate-100/60 dark:bg-slate-800/40 border-transparent'}`}>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide">Tol. Superior</span>
                        <div className="flex items-baseline gap-0.5">
                            <span className="font-mono font-bold text-sm text-slate-400">+</span>
                            <input
                                className="w-full bg-transparent text-center font-mono font-bold text-sm dark:text-slate-200 outline-none disabled:cursor-default"
                                type="number"
                                disabled={!isEditing}
                                value={zone.toleranciaSup}
                                onChange={(e) => onChange('toleranciaSup', Number(e.target.value))}
                            />
                            <span className="font-mono font-bold text-xs text-slate-400">°C</span>
                        </div>
                    </label>
                    <label className={`flex flex-col gap-1.5 rounded-xl border px-3 py-3 transition-colors ${isEditing
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-within:border-primary'
                        : 'bg-slate-100/60 dark:bg-slate-800/40 border-transparent'}`}>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide">Tol. Inferior</span>
                        <div className="flex items-baseline gap-0.5">
                            <span className="font-mono font-bold text-sm text-slate-400">-</span>
                            <input
                                className="w-full bg-transparent text-center font-mono font-bold text-sm dark:text-slate-200 outline-none disabled:cursor-default"
                                type="number"
                                disabled={!isEditing}
                                value={zone.toleranciaInf}
                                onChange={(e) => onChange('toleranciaInf', Number(e.target.value))}
                            />
                            <span className="font-mono font-bold text-xs text-slate-400">°C</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
};
