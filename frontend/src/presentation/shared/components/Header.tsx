import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="h-16 relative flex items-center justify-between px-6 shrink-0 bg-gradient-to-r from-white via-white to-primary-50 dark:from-surface-dark dark:via-surface-dark dark:to-[#0c1b2e] border-b border-slate-200/80 dark:border-slate-800 shadow-soft">
            {/* Línea de acento inferior */}
            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-700 rounded-xl flex items-center justify-center text-white shadow-glow">
                    <span className="material-icons">precision_manufacturing</span>
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight uppercase tracking-wider bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        HMI Inyectora v4.2
                    </h1>
                    <p className="text-xs text-primary font-semibold tracking-wide">Línea de Producción A · Celda 08</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
                        CONECTADO
                    </span>
                    <span className="text-xs text-slate-400 font-medium">12 Oct 2023 · 14:35:12</span>
                </div>
            </div>
        </header>
    );
};
