import React, { useEffect, useState } from 'react';
import { ServoRepository } from '../../../../infrastructure/repository/servo.repository';
import { GetServoDataUseCase } from '../../../../domain/usecase/get-servo-data.usecase';
import { servoWebSocketService } from '../../../../infrastructure/helpers/servo-websocket.service';
import { ServoData } from '../../../../domain/models/servo.model';

const servoRepository = new ServoRepository();
const getServoDataUseCase = new GetServoDataUseCase(servoRepository);

// Escala los valores raw del servo aplicando un factor de 0.1
const scaleServo = (value: number): number => parseFloat((value * 0.1).toFixed(2));

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
        // Carga inicial por HTTP
        getServoDataUseCase.execute()
            .then(setServoData)
            .catch(err => console.error('Error cargando servo:', err))
            .finally(() => setLoading(false));

        // Suscripción WebSocket — singleton directo para evitar instancias duplicadas
        servoWebSocketService.connect();
        const unsubscribe = servoWebSocketService.subscribe((data) => {
            setServoData(data);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
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
        speed:    scaleServo(raw.speed),
        torque:   scaleServo(raw.torque),
        position: scaleServo(raw.position),
        current:  scaleServo(raw.current),
        voltage:  scaleServo(raw.voltage),
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
                value={<>{data.torque}<span className="text-sm font-medium text-slate-400 ml-1">Nm</span></>}
            />
            <ServoCard
                label="Posición"
                icon="my_location"
                value={<>{data.position}<span className="text-sm font-medium text-slate-400 ml-1">°</span></>}
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
