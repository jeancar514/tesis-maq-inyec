import { SendCycleCommandUseCase } from '@/domain/usecase/send-cycle-command.usecase';
import { SubscribeCycleCommandUseCase } from '@/domain/usecase/subscribe-cycle-command.usecase';
import { cycleCommandWebSocketService } from '@/infrastructure/helpers/cycle-command-websocket.service';
import { CycleCommandRepository } from '@/infrastructure/repository/cycle-command.repository';
import React, { useEffect, useState } from 'react';

const repository = new CycleCommandRepository(cycleCommandWebSocketService);
const sendCycleCommandUseCase = new SendCycleCommandUseCase(repository);
const subscribeCycleCommandUseCase = new SubscribeCycleCommandUseCase(repository);

export const CycleCommands: React.FC = () => {
    const [lastCommand, setLastCommand] = useState<'start' | 'stop' | ''>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        subscribeCycleCommandUseCase.connectWebSocket();
        const unsubscribe = subscribeCycleCommandUseCase.subscribe((data) => {
            setLastCommand(data.command);
        });
        return () => {
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

    return (
        <section className="bg-white dark:bg-slate-900/40 p-5 rounded-lg border border-primary/10 shadow-sm flex items-center justify-center gap-6 h-full">
            {/* Start Button */}
            <button
                className={`w-28 h-28 rounded-full bg-emerald-500 flex flex-col items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all border-4 border-white dark:border-slate-800 shadow-xl group ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={loading || lastCommand === 'start'}
                onClick={() => sendCommand('start')}
            >
                <span className="material-icons text-3xl mb-0.5 group-hover:scale-110 transition-transform">play_arrow</span>
                <span className="font-black text-xs uppercase tracking-tighter">Iniciar Ciclo</span>
            </button>

            {/* Stop Button */}
            <button
                className={`w-28 h-28 rounded-full bg-red-500 flex flex-col items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all border-4 border-white dark:border-slate-800 shadow-xl group ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={loading || lastCommand === 'stop'}
                onClick={() => sendCommand('stop')}
            >
                <span className="material-icons text-3xl mb-0.5 group-hover:scale-110 transition-transform">stop</span>
                <span className="font-black text-xs uppercase tracking-tighter">Paro Ciclo</span>
            </button>
        </section>
    );
};
