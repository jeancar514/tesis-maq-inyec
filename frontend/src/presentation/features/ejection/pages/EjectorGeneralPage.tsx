import React, { useEffect, useState } from 'react';
import { EjectorCanvas } from '../components/EjectorCanvas';
import { EjectorControlPanel } from '../components/EjectorControlPanel';
import { EjectorControlRepository } from '../../../../infrastructure/repository/ejector-control.repository';
import { EjectorControlData } from '../../../../domain/models/ejector-control.model';

const repo = new EjectorControlRepository();

const ReadingCard: React.FC<{ label: string; icon: string; value: number; unit: string; accent?: string }> = ({ label, icon, value, unit, accent }) => (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
            <span className={`material-icons text-lg ${accent || 'text-primary'}`}>{icon}</span>
        </div>
        <div className="text-xl font-bold">{value}<span className="text-sm font-medium text-slate-400 ml-1">{unit}</span></div>
    </div>
);

export const EjectorGeneralPage: React.FC = () => {
    const [data, setData] = useState<EjectorControlData | null>(null);

    useEffect(() => {
        const fetch = () => { repo.get().then(setData).catch(() => {}); };
        fetch();
        const id = setInterval(fetch, 1500);
        return () => clearInterval(id);
    }, []);

    const d = data || { ejectorVelocidad: 0, ejectorPosicion: 0, ejectorTorqueSecundario: 0 } as EjectorControlData;

    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Eyector</h1>
                <p className="text-xs text-slate-500 font-medium">Expulsión de la pieza y variables del servomotor en tiempo real</p>
            </div>

            <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3">
                <ReadingCard label="Velocidad" icon="speed" value={d.ejectorVelocidad} unit="mm/s" accent="text-sky-500" />
                <ReadingCard label="Posición" icon="straighten" value={d.ejectorPosicion} unit="mm" />
                <ReadingCard label="Torque Secundario" icon="rotate_right" value={d.ejectorTorqueSecundario} unit="%" accent="text-amber-600" />
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 overflow-hidden">
                <div className="col-span-9 min-h-0">
                    <EjectorCanvas />
                </div>
                <div className="col-span-3 overflow-y-auto custom-scrollbar">
                    <EjectorControlPanel />
                </div>
            </div>
        </div>
    );
};
