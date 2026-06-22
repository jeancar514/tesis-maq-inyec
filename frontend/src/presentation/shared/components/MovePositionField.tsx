import React, { useState } from 'react';

interface MoveResult {
    success?: boolean;
    currentPosition?: number;
    target?: number;
    error?: string;
}

interface MovePositionFieldProps {
    /** Ejecuta el movimiento; el backend fija Pos1=actual, Pos2=objetivo y dispara Cambio de Posición. */
    onMove: (target: number) => Promise<MoveResult>;
    label?: string;
    unit?: string;
    min?: number;
    max?: number;
}

/**
 * Campo único de "Mover a posición".
 * El usuario ingresa la posición objetivo (X) y pulsa "Ir". Internamente el
 * backend captura la posición real actual (Y) en ese instante, la escribe en
 * Posición 1, escribe X en Posición 2 y dispara Cambio de Posición.
 */
export const MovePositionField: React.FC<MovePositionFieldProps> = ({
    onMove,
    label = 'Mover a Posición',
    unit = 'mm',
    min = 0,
    max = 2000,
}) => {
    const [target, setTarget] = useState<number>(0);
    const [moving, setMoving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
    const [lastFrom, setLastFrom] = useState<number | null>(null);

    const handleMove = async () => {
        setMoving(true);
        setStatus('idle');
        try {
            const res = await onMove(target);
            if (res && res.error) throw new Error(res.error);
            setLastFrom(typeof res?.currentPosition === 'number' ? res.currentPosition : null);
            setStatus('ok');
        } catch {
            setStatus('error');
        } finally {
            setMoving(false);
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div className="panel-accent rounded-xl bg-gradient-to-br from-primary-500/10 to-accent/10 border border-primary/20 p-3 pl-4">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                    <span className="material-icons text-sm text-primary">my_location</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{label}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{unit}</span>
            </div>

            <div className="flex gap-2">
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={target}
                    onChange={e => setTarget(Number(e.target.value))}
                    className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Posición destino"
                />
                <button
                    onClick={handleMove}
                    disabled={moving}
                    className="btn-primary px-4 py-2 text-xs shrink-0"
                >
                    <span className={`material-icons text-sm ${moving ? 'animate-spin' : ''}`}>{moving ? 'autorenew' : 'play_arrow'}</span>
                    {moving ? 'Yendo...' : 'Ir'}
                </button>
            </div>

            <div className="h-4 mt-1.5">
                {status === 'ok' && (
                    <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                        <span className="material-icons text-xs">check_circle</span>
                        {lastFrom !== null ? `Moviendo de ${lastFrom} a ${target} ${unit}` : 'Comando enviado'}
                    </p>
                )}
                {status === 'error' && (
                    <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                        <span className="material-icons text-xs">error</span> No se pudo ejecutar el movimiento
                    </p>
                )}
            </div>
        </div>
    );
};
