import React from 'react';
import { ZoneCard } from '../components/ZoneCard';

export const HeatingZonesPage: React.FC = () => {
    const zones = [
        { name: "Zona 1 - Alim.", pv: 210, sp: 210, ssr: 34, tolSup: "+5", tolInf: "-5" },
        { name: "Zona 2 - Trans. 1", pv: 225, sp: 225, ssr: 12, tolSup: "+5", tolInf: "-5" },
        { name: "Zona 3 - Trans. 2", pv: 240, sp: 240, ssr: 0, tolSup: "+5", tolInf: "-5" },
        { name: "Zona 4 - Dosif.", pv: 240, sp: 240, ssr: 5, tolSup: "+5", tolInf: "-5" },
        { name: "Zona 5 - Salida", pv: 235, sp: 235, ssr: 18, tolSup: "+5", tolInf: "-5" },
    ];

    return (
        <div className="flex flex-col h-full gap-6 overflow-hidden">
            {/* Header Section */}
            <div className="shrink-0 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Zonas del Cilindro</h1>
                    <p className="text-xs text-slate-500 font-medium">Monitoreo y control térmico de las bandas calefactoras del cañón</p>
                </div>
                <button className="bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/30 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm group">
                    <span className="material-icons text-sm group-hover:rotate-12 transition-transform">done_all</span>
                    ACTIVAR TODAS LAS ZONAS
                </button>
            </div>

            {/* Monitor Section Title */}
            <div className="shrink-0 flex items-center justify-between px-1">
                <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-icons text-lg">thermostat</span>
                    Monitor de Zonas
                </h2>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Sistema OK</span>
                    </div>
                </div>
            </div>

            {/* Zone Cards Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {zones.map((zone, index) => (
                        <ZoneCard key={index} {...zone} />
                    ))}
                </div>
            </div>
        </div>
    );
};
