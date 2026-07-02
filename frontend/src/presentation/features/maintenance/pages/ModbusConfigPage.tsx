import React, { useEffect, useMemo, useState } from 'react';
import { RegisterConfigRepository } from '../../../../infrastructure/repository/register-config.repository';
import { RegisterConfig, RegisterPatch, ModbusType } from '../../../../domain/models/register-config.model';

const repo = new RegisterConfigRepository();

/* Mapeo: módulo del FooterNav → submódulos (tipos de registro) del Sidebar */
interface ModuleDef {
    key: string;
    label: string;
    icon: string;
    groups: Array<{ type: string; label: string }>;
}

const MODULES: ModuleDef[] = [
    {
        key: 'dashboard', label: 'General', icon: 'dashboard', groups: [
            { type: 'kpis', label: 'KPIs / Producción' },
            { type: 'operation_mode', label: 'Modo de Operación' },
            { type: 'cycle_command', label: 'Comando de Ciclo' },
        ]
    },
    {
        key: 'clamp', label: 'Molde', icon: 'view_sidebar', groups: [
            { type: 'mold_control', label: 'Control de Molde' },
        ]
    },
    {
        key: 'injection', label: 'Inyección', icon: 'input', groups: [
            { type: 'servo', label: 'Servomotor (lecturas)' },
            { type: 'screw_control', label: 'Husillo' },
            { type: 'carriage_control', label: 'Carro de Inyección' },
        ]
    },
    {
        key: 'ejection', label: 'Eyección', icon: 'eject', groups: [
            { type: 'ejector_control', label: 'Eyector' },
        ]
    },
    {
        key: 'heating', label: 'Temperaturas', icon: 'thermostat', groups: [
            { type: 'heating', label: 'Zonas del Cilindro' },
        ]
    },
];

const MODBUS_TYPES: ModbusType[] = ['inputRegister', 'holdingRegister', 'coil', 'discreteInput'];
const DATA_TYPES = ['Boolean', 'Int16', 'UInt16', 'Int32', 'UInt32', 'Float', 'Double', 'String'];

const EDITABLE_FIELDS: (keyof RegisterConfig)[] = [
    'modbusType', 'modbusAddress', 'opcuaDataType', 'scaleFactor', 'unit', 'readable', 'writable',
];

interface ModbusConfigPageProps {
    /** Módulo activo inicial (key de MODULES). Por defecto 'dashboard'. */
    initialModule?: string;
    /** Si es true, oculta las pestañas y fija el módulo (vista embebida por módulo). */
    lockModule?: boolean;
}

export const ModbusConfigPage: React.FC<ModbusConfigPageProps> = ({ initialModule = 'dashboard', lockModule = false }) => {
    const [registers, setRegisters] = useState<RegisterConfig[]>([]);
    const [draft, setDraft] = useState<Record<string, RegisterConfig>>({});
    const [activeModule, setActiveModule] = useState<string>(initialModule);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const regs = await repo.getAll();
            setRegisters(regs);
            const map: Record<string, RegisterConfig> = {};
            regs.forEach(r => { map[r.name] = { ...r }; });
            setDraft(map);
        } catch {
            setRegisters([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const isModified = (name: string): boolean => {
        const orig = registers.find(r => r.name === name);
        const cur = draft[name];
        if (!orig || !cur) return false;
        return EDITABLE_FIELDS.some(f => orig[f] !== cur[f]);
    };

    const modifiedNames = useMemo(
        () => Object.keys(draft).filter(isModified),
        [draft, registers]
    );

    const setField = (name: string, field: keyof RegisterConfig, value: any) => {
        setDraft(prev => ({ ...prev, [name]: { ...prev[name], [field]: value } }));
    };

    const handleSave = async () => {
        if (modifiedNames.length === 0) return;
        setSaving(true);
        setStatus('idle');
        try {
            const changes: RegisterPatch[] = modifiedNames.map(name => {
                const r = draft[name];
                return {
                    name,
                    modbusType: r.modbusType,
                    modbusAddress: r.modbusAddress,
                    opcuaDataType: r.opcuaDataType,
                    scaleFactor: r.scaleFactor,
                    unit: r.unit,
                    readable: r.readable,
                    writable: r.writable,
                };
            });
            const res = await repo.saveBatch(changes);
            if (res?.success) {
                setStatus('ok');
                setStatusMsg(`${changes.length} dirección(es) actualizada(s)`);
            } else {
                const fails = (res?.results || []).filter(x => x.error);
                setStatus('error');
                setStatusMsg(fails.length ? `${fails.length} con error` : 'Error al guardar');
            }
            await load();
        } catch {
            setStatus('error');
            setStatusMsg('No se pudo conectar con el bridge');
        } finally {
            setSaving(false);
            setTimeout(() => setStatus('idle'), 3500);
        }
    };

    const resetModule = () => {
        const map = { ...draft };
        registers.forEach(r => { map[r.name] = { ...r }; });
        setDraft(map);
    };

    const activeDef = MODULES.find(m => m.key === activeModule)!;
    const byType = (type: string) => registers.filter(r => r.type === type);

    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            {/* Header */}
            <div className="shrink-0 flex flex-wrap justify-between items-end gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                        <span className="material-icons text-primary">memory</span>
                        Direcciones Modbus
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">Configura dinámicamente la dirección Modbus de cada variable por módulo</p>
                </div>
                <div className="flex items-center gap-2">
                    {status === 'ok' && (
                        <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                            <span className="material-icons text-sm">check_circle</span>{statusMsg}
                        </span>
                    )}
                    {status === 'error' && (
                        <span className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                            <span className="material-icons text-sm">error</span>{statusMsg}
                        </span>
                    )}
                    <button onClick={load} disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-icons text-sm">refresh</span> Recargar
                    </button>
                    <button onClick={handleSave} disabled={saving || modifiedNames.length === 0}
                        className="btn-primary px-4 py-2 text-xs">
                        <span className="material-icons text-sm">{saving ? 'hourglass_empty' : 'save'}</span>
                        {saving ? 'Guardando...' : `Guardar ${modifiedNames.length > 0 ? `(${modifiedNames.length})` : ''}`}
                    </button>
                </div>
            </div>

            {/* Tabs de módulos del FooterNav */}
            {!lockModule && (
            <div className="shrink-0 flex gap-1.5 flex-wrap">
                {MODULES.map(m => {
                    const count = m.groups.reduce((acc, g) => acc + byType(g.type).length, 0);
                    const mod = m.groups.some(g => byType(g.type).some(r => isModified(r.name)));
                    return (
                        <button key={m.key} onClick={() => setActiveModule(m.key)}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeModule === m.key
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-primary'}`}>
                            <span className="material-icons text-sm">{m.icon}</span>
                            {m.label}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeModule === m.key ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>{count}</span>
                            {mod && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900" />}
                        </button>
                    );
                })}
            </div>
            )}

            {/* Contenido */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm gap-2">
                        <span className="material-icons animate-spin">autorenew</span> Cargando registros...
                    </div>
                ) : registers.length === 0 ? (
                    <div className="surface-card p-6 text-center text-sm text-slate-400">
                        No se pudieron cargar los registros. ¿Está corriendo el bridge (puerto 3000)?
                    </div>
                ) : activeDef.groups.every(group => byType(group.type).length === 0) ? (
                    <div className="surface-card p-6 text-center text-sm text-slate-400">
                        Este módulo no expone variables Modbus configurables. Sus parámetros se gestionan desde la base de datos.
                    </div>
                ) : (
                    activeDef.groups.map(group => {
                        const rows = byType(group.type);
                        if (rows.length === 0) return null;
                        return (
                            <div key={group.type} className="surface-card panel-accent p-4 pl-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">{group.label}</h2>
                                    <span className="text-[10px] font-mono text-slate-400">{group.type}</span>
                                    <span className="text-[10px] text-slate-400 ml-auto">{rows.length} variables</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                                <th className="text-left font-bold py-2 pr-2">Variable</th>
                                                <th className="text-left font-bold py-2 px-2">Tipo Modbus</th>
                                                <th className="text-left font-bold py-2 px-2">Dirección</th>
                                                <th className="text-left font-bold py-2 px-2">Tipo Dato</th>
                                                <th className="text-left font-bold py-2 px-2">Escala</th>
                                                <th className="text-left font-bold py-2 px-2">Unidad</th>
                                                <th className="text-center font-bold py-2 px-2">R</th>
                                                <th className="text-center font-bold py-2 px-2">W</th>
                                                <th className="text-right font-bold py-2 pl-2">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map(orig => {
                                                const r = draft[orig.name] || orig;
                                                const mod = isModified(orig.name);
                                                return (
                                                    <tr key={orig.name} className={`border-b border-slate-100 dark:border-slate-800/60 ${mod ? 'bg-amber-50/60 dark:bg-amber-500/5' : ''}`}>
                                                        <td className="py-2 pr-2">
                                                            <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                                                                {mod && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                                                {orig.name}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 max-w-[180px] truncate">{orig.description}</div>
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <select value={r.modbusType}
                                                                onChange={e => setField(orig.name, 'modbusType', e.target.value)}
                                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-primary">
                                                                {MODBUS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input type="number" min={0} max={65535} value={r.modbusAddress}
                                                                onChange={e => setField(orig.name, 'modbusAddress', Number(e.target.value))}
                                                                className="w-20 bg-white dark:bg-slate-900 border-2 border-primary/30 rounded-md px-2 py-1 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <select value={r.opcuaDataType}
                                                                onChange={e => setField(orig.name, 'opcuaDataType', e.target.value)}
                                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-primary">
                                                                {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input type="number" step="any" value={r.scaleFactor}
                                                                onChange={e => setField(orig.name, 'scaleFactor', Number(e.target.value))}
                                                                className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary" />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input type="text" value={r.unit}
                                                                onChange={e => setField(orig.name, 'unit', e.target.value)}
                                                                className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-primary" />
                                                        </td>
                                                        <td className="py-2 px-2 text-center">
                                                            <input type="checkbox" checked={!!r.readable}
                                                                onChange={e => setField(orig.name, 'readable', e.target.checked)}
                                                                className="accent-primary w-4 h-4" />
                                                        </td>
                                                        <td className="py-2 px-2 text-center">
                                                            <input type="checkbox" checked={!!r.writable}
                                                                onChange={e => setField(orig.name, 'writable', e.target.checked)}
                                                                className="accent-primary w-4 h-4" />
                                                        </td>
                                                        <td className="py-2 pl-2 text-right font-mono text-slate-500 dark:text-slate-400">
                                                            {orig.value !== undefined && orig.value !== null ? String(orig.value) : '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {modifiedNames.length > 0 && (
                <div className="shrink-0 flex items-center justify-between px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300/50 text-amber-700 dark:text-amber-400 text-xs font-bold">
                    <span className="flex items-center gap-2"><span className="material-icons text-sm">edit</span>{modifiedNames.length} cambio(s) sin guardar</span>
                    <button onClick={resetModule} className="underline hover:no-underline">Descartar</button>
                </div>
            )}
        </div>
    );
};
