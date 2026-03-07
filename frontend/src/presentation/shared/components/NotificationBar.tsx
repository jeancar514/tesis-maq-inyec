import React from 'react';

export const NotificationBar: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-8 px-6 flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="material-icons text-sm">info</span>
                Sistema en Funcionamiento - Sin alarmas activas
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Servidor: Conectado</span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span>OPC-UA: ACTIVO</span>
            </div>
        </div>
    );
}
