import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="h-16 border-b border-primary/10 bg-white dark:bg-background-dark/50 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                    <span className="material-icons">precision_manufacturing</span>
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight uppercase tracking-wider">HMI Inyectora v4.2</h1>
                    <p className="text-xs text-primary font-medium">Línea de Producción A - Celda 08</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> CONECTADO
                    </span>
                    <span className="text-xs opacity-60">12 Oct 2023 | 14:35:12</span>
                </div>
            </div>
        </header>
    );
};
