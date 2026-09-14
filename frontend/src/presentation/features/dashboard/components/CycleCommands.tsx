import { SendCycleCommandUseCase } from '@/domain/usecase/send-cycle-command.usecase';
import { SubscribeCycleCommandUseCase } from '@/domain/usecase/subscribe-cycle-command.usecase';
import { cycleCommandWebSocketService } from '@/infrastructure/helpers/cycle-command-websocket.service';
import { CycleCommandRepository } from '@/infrastructure/repository/cycle-command.repository';
import { EmergencyStopRepository } from '@/infrastructure/repository/emergency-stop.repository';
import React, { useEffect, useState } from 'react';

const repository = new CycleCommandRepository(cycleCommandWebSocketService);
const sendCycleCommandUseCase = new SendCycleCommandUseCase(repository);
const subscribeCycleCommandUseCase = new SubscribeCycleCommandUseCase(repository);
const emergencyStopRepo = new EmergencyStopRepository();

export const CycleCommands: React.FC = () => {
    const [lastCommand, setLastCommand] = useState<'start' | 'stop' | ''>('');
    const [loading, setLoading] = useState(false);
    const [emergencyStop, setEmergencyStop] = useState(false);
    const [eStopLoading, setEStopLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        // Carga inicial desde la base de datos (GET), independiente del WebSocket.
        subscribeCycleCommandUseCase.getCurrent()
            .then((data) => { if (mounted && (data.command === 'start' || data.command === 'stop')) setLastCommand(data.command); })
            .catch((err) => console.error('Error al obtener el comando de ciclo:', err));

        // Estado inicial de la parada de emergencia (registro dedicado, dirección Modbus 352).
        emergencyStopRepo.get()
            .then((data) => { if (mounted && typeof data.active === 'boolean') setEmergencyStop(data.active); })
            .catch((err) => console.error('Error al obtener la parada de emergencia:', err));

        subscribeCycleCommandUseCase.connectWebSocket();
        const unsubscribe = subscribeCycleCommandUseCase.subscribe((data) => {
            setLastCommand(data.command);
        });
        return () => {
            mounted = false;
            unsubscribe();
            subscribeCycleCommandUseCase.disconnectWebSocket();
        };
    }, []);

    const sendCommand = async (command: 'start' | 'stop') => {
        setLoading(true);
        try {
            const result = await sendCycleCommandUseCase.execute(command);
            if (typeof result.command === 'string') setLastCommand(result.command);
        } finally {
            setLoading(false);
        }
    };

    // Envía 1 o 0 al backend (dirección Modbus 352) según el nuevo estado del switch.
    const toggleEmergencyStop = async () => {
        setEStopLoading(true);
        const next = !emergencyStop;
        try {
            const result = await emergencyStopRepo.set(next);
            setEmergencyStop(typeof result.active === 'boolean' ? result.active : next);
        } catch (err) {
            console.error('Error al enviar la parada de emergencia:', err);
        } finally {
            setEStopLoading(false);
        }
    };

    return (
        <section className="bg-white dark:bg-slate-900/40 p-4 rounded-lg border border-primary/10 shadow-sm flex flex-col h-full">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Comando de Ciclo</h3>

            {/* Aviso de Parada de Emergencia activa */}
            {emergencyStop && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="material-icons text-red-500 text-base">report</span>
                    <span className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wide">Parada de Emergencia Activa</span>
                </div>
            )}

            {/* Indicador de estado de la máquina */}
            <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border ${lastCommand === 'start' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                <span className="relative flex h-3 w-3">
                    {lastCommand === 'start' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${lastCommand === 'start' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                </span>
                <span className={`text-xs font-semibold ${lastCommand === 'start' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {lastCommand === 'start' ? 'Máquina en Operación' : 'Máquina Detenida'}
                </span>
            </div>

            {/* Botones de control */}
            <div className="flex items-center justify-center gap-8 flex-1">
                {/* Start Button */}
                <button
                    className={`w-36 h-36 rounded-full bg-emerald-500 flex flex-col items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all border-4 border-white dark:border-slate-800 shadow-xl group ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={loading || lastCommand === 'start'}
                    onClick={() => sendCommand('start')}
                >
                    <span className="material-icons text-4xl mb-1 group-hover:scale-110 transition-transform">play_arrow</span>
                    <span className="font-black text-sm uppercase tracking-tighter">Iniciar Ciclo</span>
                </button>

                {/* Stop Button */}
                <button
                    className={`w-36 h-36 rounded-full bg-red-500 flex flex-col items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all border-4 border-white dark:border-slate-800 shadow-xl group ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={loading || lastCommand === 'stop'}
                    onClick={() => sendCommand('stop')}
                >
                    <span className="material-icons text-4xl mb-1 group-hover:scale-110 transition-transform">stop</span>
                    <span className="font-black text-sm uppercase tracking-tighter">Paro Ciclo</span>
                </button>
            </div>

            {/* Switch de Parada de Emergencia — envía 1/0 a la dirección Modbus 352 */}
            <div className="flex items-center justify-between p-3 mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <span className={`material-icons text-sm ${emergencyStop ? 'text-red-500' : 'text-slate-400'}`}>emergency</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Parada de Emergencia</p>
                </div>
                <button
                    onClick={toggleEmergencyStop}
                    disabled={eStopLoading}
                    className={`relative w-11 h-6 rounded-full transition-colors ${emergencyStop ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-300 dark:bg-slate-600'} ${eStopLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emergencyStop ? 'translate-x-5' : ''}`} />
                </button>
            </div>
        </section>
    );
};
