import React, { useState } from 'react';
import './IOMonitor.css';

interface SignalItemProps {
    address: string;
    label: string;
    isActive: boolean;
    isOutput?: boolean;
    isPulse?: boolean;
}

const SignalItem: React.FC<SignalItemProps> = ({ address, label, isActive, isOutput, isPulse }) => {
    const ledColor = isOutput ? 'bg-amber-500 led-glow-amber' : 'bg-emerald-500 led-glow-green';

    return (
        <tr className={`group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isPulse ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}>
            <td className="pl-4 py-3 w-12 text-center">
                <div className={`w-3.5 h-3.5 rounded-full mx-auto transition-all duration-300 ${isActive ? ledColor : 'bg-slate-300 dark:bg-slate-700'} ${isPulse && isActive ? 'animate-pulse' : ''}`}></div>
            </td>
            <td className={`py-3 px-2 w-24 font-mono text-xs ${isPulse ? 'text-primary font-bold' : 'text-slate-500'}`}>{address}</td>
            <td className={`py-3 px-2 text-sm ${isPulse ? 'font-semibold' : 'font-medium'}`}>{label}</td>
            <td className="py-3 px-4 text-right">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? (isOutput ? 'text-amber-500' : 'text-emerald-500') : 'text-slate-400'}`}>
                    {isActive ? (isPulse ? 'ACTIVO' : 'ON') : 'OFF'}
                </span>
            </td>
        </tr>
    );
};

export const IOMonitor: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('TODOS');

    const inputs = [
        { address: '%IX0.0', label: 'DI_01: Paro de Emergencia OK', isActive: true },
        { address: '%IX0.1', label: 'DI_02: Puerta Delantera Abierta', isActive: false },
        { address: '%IX0.2', label: 'DI_03: Presión de Aire Crítica', isActive: true },
        { address: '%IX0.3', label: 'DI_04: Sensor de Molde Cerrado', isActive: true, isPulse: true },
        { address: '%IX0.4', label: 'DI_05: Fin de Carrera Retroceso', isActive: false },
        { address: '%IX0.5', label: 'DI_06: Nivel Aceite Hidráulico', isActive: false },
        { address: '%IX0.6', label: 'DI_07: Protección Térmica Motor', isActive: false },
    ];

    const outputs = [
        { address: '%QX0.0', label: 'DO_01: Contactor Principal', isActive: true, isOutput: true },
        { address: '%QX0.1', label: 'DO_02: Válvula Cierre Lento', isActive: false, isOutput: true },
        { address: '%QX0.2', label: 'DO_03: Válvula Inyección 1', isActive: false, isOutput: true },
        { address: '%QX0.3', label: 'DO_04: Bomba de Lubricación', isActive: true, isOutput: true },
        { address: '%QX0.4', label: 'DO_05: Soplado de Aire', isActive: false, isOutput: true },
    ];

    const filters = ['TODOS', 'SEGURIDAD', 'CIERRE', 'INYECCIÓN', 'EXPULSOR', 'AUXILIARES'];

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Module Filter Selector */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeFilter === filter ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-slate-400 text-sm">search</span>
                    <input
                        className="pl-9 pr-4 py-1.5 text-xs rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary focus:border-primary w-64 outline-none transition-all"
                        placeholder="Buscar señal..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* I/O Grid Container */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Digital Inputs Column */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                            ENTRADAS DIGITALES (DI)
                        </h3>
                        <span className="text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">MOD: %IX0.0 - %IX3.7</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        <table className="w-full border-separate border-spacing-y-1">
                            <tbody>
                                {inputs.map(input => <SignalItem key={input.address} {...input} />)}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Digital Outputs Column */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                            SALIDAS DIGITALES (DO)
                        </h3>
                        <span className="text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">MOD: %QX0.0 - %QX2.7</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        <table className="w-full border-separate border-spacing-y-1">
                            <tbody>
                                {outputs.map(output => <SignalItem key={output.address} {...output} />)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};
