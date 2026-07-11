import { GetOperationModeUseCase } from '@/domain/usecase/get-operation-mode.usecase';
import { SetOperationModeUseCase } from '@/domain/usecase/set-operation-mode.usecase';
import { operationModeWebSocketService } from '@/infrastructure/helpers/operation-mode-websocket.service';
import { OperationModeRepository } from '@/infrastructure/repository/operation-mode.repository';
import React, { useEffect, useState } from 'react';


const repository = new OperationModeRepository(operationModeWebSocketService);
const getOperationModeUseCase = new GetOperationModeUseCase(repository);
const setOperationModeUseCase = new SetOperationModeUseCase(repository);

export const OperationMode: React.FC = () => {
    const [mode, setMode] = useState<number>(2); // 1: manual, 2: automático
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        // Carga inicial desde la base de datos (GET), independiente del WebSocket.
        getOperationModeUseCase.execute()
            .then((data) => { if (mounted && typeof data.mode === 'number') setMode(data.mode); })
            .catch((err) => console.error('Error al obtener el modo de operación:', err));

        getOperationModeUseCase.connectWebSocket();
        const unsubscribe = getOperationModeUseCase.subscribeToOperationMode((data) => {
            setMode(data.mode);
        });
        return () => {
            mounted = false;
            unsubscribe();
            getOperationModeUseCase.disconnectWebSocket();
        };
    }, []);

    const handleChangeMode = async (newMode: number) => {
        setLoading(true);
        try {
            const result = await setOperationModeUseCase.execute(newMode);
            if (typeof result.mode === 'number') setMode(result.mode);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-white dark:bg-slate-900/40 p-4 rounded-lg border border-primary/10 shadow-sm h-full flex flex-col">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Modo de Operación</h3>
            <div className="grid grid-cols-2 gap-2 flex-1 max-h-40">
                {/* Manual Mode */}
                <button
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 ${mode === 1 ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/50'} transition-all group`}
                    disabled={loading || mode === 1}
                    onClick={() => handleChangeMode(1)}
                >
                    {mode === 1 && (
                        <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center text-white">
                            <span className="material-icons text-[8px]">check</span>
                        </div>
                    )}
                    <span className={`material-icons text-lg mb-1 ${mode === 1 ? 'text-primary' : 'text-slate-400 group-hover:text-primary transition-colors'}`}>pan_tool</span>
                    <span className="font-bold text-xs">MANUAL</span>
                </button>
                {/* Auto Mode */}
                <button
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 ${mode === 2 ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/50'} transition-all group`}
                    disabled={loading || mode === 2}
                    onClick={() => handleChangeMode(2)}
                >
                    {mode === 2 && (
                        <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center text-white">
                            <span className="material-icons text-[8px]">check</span>
                        </div>
                    )}
                    <span className={`material-icons text-lg mb-1 ${mode === 2 ? 'text-primary' : 'text-slate-400 group-hover:text-primary transition-colors'}`}>autorenew</span>
                    <span className="font-bold text-xs uppercase">Automático</span>
                </button>
            </div>
        </section>
    );
};
