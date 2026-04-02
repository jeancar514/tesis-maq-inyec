import React, { useEffect, useState } from 'react';
import { GetServoDataUseCase } from '../../../../domain/usecase/get-servo-data.usecase';
import { ServoRepository } from '../../../../infrastructure/repository/servo.repository';
import { ServoData } from '../../../../domain/models/servo.model';

// Inicializamos el Repositorio y el Caso de Uso (mismo patrón que KPIGrid)
const servoRepository = new ServoRepository();
const getServoDataUseCase = new GetServoDataUseCase(servoRepository);


const ServoCard: React.FC<{
    label: string;
    icon: string;
    value: React.ReactNode;
    iconColor?: string;
    accentColor?: string;
}> = ({ label, icon, value, iconColor = "text-primary", accentColor }) => (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
            <span className={`material-icons text-lg ${iconColor}`}>{icon}</span>
        </div>
        <div className={`text-xl font-bold mb-0.5 ${accentColor || ''}`}>{value}</div>
    </div>
);

export const ServoVariableGrid: React.FC = () => {
    const [servoData, setServoData] = useState<ServoData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getServoDataUseCase.execute();
                setServoData(data);
            } catch (error) {
                console.error("Error al obtener datos del servo:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-24 text-slate-500">
                <span className="material-icons animate-spin mr-2">refresh</span>
                Cargando variables del servo...
            </div>
        );
    }

    const raw = servoData || { speed: 0, torque: 0, position: 0, current: 0, voltage: 0 };
    const data = {
        speed:    parseFloat((raw.speed * 0.1).toFixed(2)),
        torque:   parseFloat(((raw.torque * 0.1)*(3.8/100)).toFixed(2)),
        position: parseFloat(((raw.position / 100000)).toFixed(2)),
        current:  parseFloat(((raw.current * 0.01)).toFixed(2)),
        voltage:  parseFloat(((raw.current / 10)).toFixed(2)),
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <ServoCard
                label="Velocidad"
                icon="speed"
                value={<>{data.speed}<span className="text-sm font-medium text-slate-400 ml-1">RPM</span></>}
            />
            <ServoCard
                label="Torque"
                icon="rotate_right"
                value={<>{data.torque}<span className="text-sm font-medium text-slate-400 ml-1">KNm</span></>}
            />
            <ServoCard
                label="Posición"
                icon="my_location"
                value={<>{data.position}<span className="text-sm font-medium text-slate-400 ml-1">rev</span></>}
            />
            <ServoCard
                label="Corriente"
                icon="bolt"
                value={<>{data.current}<span className="text-sm font-medium text-slate-400 ml-1">A</span></>}
                accentColor="text-amber-600"
            />
            <ServoCard
                label="Voltaje"
                icon="electrical_services"
                value={<>{data.voltage}<span className="text-sm font-medium text-slate-400 ml-1">V</span></>}
                accentColor="text-blue-600"
            />
        </div>
    );
};
