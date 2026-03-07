import React from 'react';

interface AlarmEvent {
    code: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    module: string;
    timestamp: string;
    status?: 'active' | 'acknowledged' | 'resolved';
}

const AlarmRow: React.FC<{ event: AlarmEvent }> = ({ event }) => {
    const severityConfig = {
        critical: { icon: 'error', color: 'text-rose-500', bg: 'bg-rose-50/30' },
        warning: { icon: 'warning', color: 'text-amber-500', bg: 'bg-amber-50/10' },
        info: { icon: 'info', color: 'text-blue-500', bg: 'bg-blue-50/30' }
    };

    const config = severityConfig[event.severity];

    return (
        <tr className={`group transition-colors ${config.bg} hover:brightness-95`}>
            <td className="px-4 py-4 font-mono font-bold text-xs text-slate-500 dark:text-slate-400">
                {event.code}
            </td>
            <td className="px-2 py-4 text-center">
                <span className={`material-icons ${config.color} text-lg`}>{config.icon}</span>
            </td>
            <td className="px-4 py-4">
                <div className="font-bold text-slate-900 dark:text-slate-100">{event.title}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-tight">{event.description}</div>
            </td>
            <td className="px-4 py-4">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {event.module}
                </span>
            </td>
            <td className="px-4 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {event.timestamp}
            </td>
            <td className="px-4 py-4 text-right">
                {event.severity !== 'info' ? (
                    <button
                        className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all group-hover:scale-110"
                        title="Diagnóstico Inteligente"
                    >
                        <span className="material-symbols-outlined text-xl">psychology</span>
                    </button>
                ) : (
                    <span className="material-icons text-emerald-500 text-sm">check_circle</span>
                )}
            </td>
        </tr>
    );
};

export const AlarmHistory: React.FC = () => {
    const alarms: AlarmEvent[] = [
        {
            code: 'ALM_502',
            severity: 'critical',
            title: 'Exceso de Torque en Eje',
            description: 'Límite AX_x_TQ excedido (threshold > 185%)',
            module: 'Servo Ejector',
            timestamp: '2023-11-24 14:22:12.45'
        },
        {
            code: 'ALM_104',
            severity: 'warning',
            title: 'Falla Comunicación Sensor Redundante',
            description: 'Timeout en respuesta Profinet Nodo 04',
            module: 'Red I/O',
            timestamp: '2023-11-24 14:15:08.02'
        },
        {
            code: 'ALM_882',
            severity: 'critical',
            title: 'Paro de Emergencia Presionado',
            description: 'Interrupción de lazo de seguridad dual',
            module: 'Safety',
            timestamp: '2023-11-24 14:10:55.30'
        },
        {
            code: 'INF_002',
            severity: 'info',
            title: 'Cambio de Receta Finalizado',
            description: 'Receta: "MOLD_A_88" cargada con éxito',
            module: 'Sistema',
            timestamp: '2023-11-24 13:58:12.11'
        }
    ];

    return (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <span className="material-icons text-slate-400">format_list_bulleted</span>
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-300">Historial de Eventos Cronológicos</h3>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 text-[10px] font-black border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all uppercase tracking-widest shadow-sm">
                        Exportar Log
                    </button>
                    <button className="px-4 py-2 text-[10px] font-black bg-slate-800 dark:bg-primary text-white rounded-lg hover:scale-105 transition-all shadow-md uppercase tracking-widest">
                        Reconocer Todo
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-10">
                        <tr className="text-[10px] font-black text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/30">
                            <th className="px-4 py-3 tracking-widest">Código</th>
                            <th className="px-2 py-3 text-center tracking-widest">Sev</th>
                            <th className="px-4 py-3 tracking-widest">Descripción Técnica</th>
                            <th className="px-4 py-3 tracking-widest">Módulo</th>
                            <th className="px-4 py-3 tracking-widest">Timestamp</th>
                            <th className="px-4 py-3 text-right tracking-widest">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {alarms.map((alarm, idx) => (
                            <AlarmRow key={idx} event={alarm} />
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};
