import React, { useEffect, useState } from 'react';
import { GetKPIsUseCase } from '../../../../domain/usecase/get-kpis.usecase';
import { KPIRepository } from '../../../../infrastructure/repository/kpi.repository';
import { KPIValues } from '../../../../domain/models/kpi.model';

// Inicializamos el Repositorio y el Caso de Uso.
// (En una app más grande esto podría inyectarse por contexto o un DI container)
const kpiRepository = new KPIRepository();
const getKPIsUseCase = new GetKPIsUseCase(kpiRepository);

const KPICard: React.FC<{
    label: string;
    icon: string;
    value: React.ReactNode;
    footer?: React.ReactNode;
    iconColor?: string;
    accentColor?: string;
}> = ({ label, icon, value, footer, iconColor = "text-primary", accentColor }) => (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
            <span className={`material-icons text-lg ${iconColor}`}>{icon}</span>
        </div>
        <div className={`text-xl font-bold mb-0.5 ${accentColor || ''}`}>{value}</div>
        {footer}
    </div>
);

export const KPIGrid: React.FC = () => {
    const [kpiData, setKpiData] = useState<KPIValues | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchKPIs = async () => {
            try {
                const data = await getKPIsUseCase.execute();
                setKpiData(data);
            } catch (error) {
                console.error("Error al obtener los KPIs del gateway:", error);
            } finally {
                setLoading(false);
            }
        };

        // Carga inicial
        fetchKPIs();

        // Conectar WebSocket
        getKPIsUseCase.connectWebSocket();

        // Suscribirse a actualizaciones en tiempo real
        const unsubscribe = getKPIsUseCase.subscribeToKPIs((kpis) => {
            setKpiData(kpis);
            setLoading(false);
        });

        // Cleanup al desmontar
        return () => {
            unsubscribe();
            getKPIsUseCase.disconnectWebSocket();
        };
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-24 text-slate-500">
                <span className="material-icons animate-spin mr-2">refresh</span>
                Cargando indicadores...
            </div>
        );
    }

    // Datos por defecto por si falla el servidor o no hay datos (fallback)
    const data = kpiData || { cycleTime: 0, productionCount: 0, productionTarget: 5000, qualityYield: 0 };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <KPICard
                label="Tiempo de Ciclo"
                icon="timer"
                value={<>{data.cycleTime}<span className="text-sm font-medium text-slate-400 ml-1">s</span></>}
            />

            <KPICard
                label="Producción"
                icon="inventory_2"
                value={<>{data.productionCount} <span className="text-xs font-normal text-slate-400">/ {5000}</span></>}
            />

            <KPICard
                label="Rendimiento de Calidad"
                icon="verified"
                value={<>{data.qualityYield}<span className="text-sm ml-0.5">%</span></>}
                accentColor="text-emerald-600"
            />
        </div>
    );
};

