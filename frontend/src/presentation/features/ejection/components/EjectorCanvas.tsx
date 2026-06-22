import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EjectorControlRepository } from '../../../../infrastructure/repository/ejector-control.repository';
import { EjectorControlData } from '../../../../domain/models/ejector-control.model';

/**
 * Canvas del EYECTOR.
 * Simula la placa expulsora que arrastra los pernos/pines a través de la mitad
 * móvil del molde para empujar la pieza solidificada y vencer la adhesión; luego
 * los pines retraen (ciclo expulsión-retroceso).
 * Mecanismo de referencia: placa expulsora + pines de extracción (aprios.com;
 * Patente US 8,622,733).
 */

type Phase = 'REPOSO' | 'EXPULSANDO' | 'CAIDA' | 'RETRAYENDO';

const PHASE_COLORS: Record<Phase, string> = {
    REPOSO: '#14b8a6',
    EXPULSANDO: '#facc15',
    CAIDA: '#f97316',
    RETRAYENDO: '#3b82f6',
};

const PHASE_LABELS: Record<Phase, string> = {
    REPOSO: 'Reposo',
    EXPULSANDO: 'Expulsando',
    CAIDA: 'Pieza Liberada',
    RETRAYENDO: 'Retrayendo',
};

const PHASE_DESC: Record<Phase, string> = {
    REPOSO: 'Placa expulsora retraída, pines dentro del molde.',
    EXPULSANDO: 'La placa avanza y los pines empujan la pieza fuera del núcleo.',
    CAIDA: 'La pieza se desprende del molde y cae.',
    RETRAYENDO: 'Los pines regresan a su posición de reposo.',
};

/* Recorrido del eyector (mm de avance de pines) */
const MAX_EJECT = 40;

/* Tiempos (ms) */
const EJECT_STEP = 22;
const RELEASE_DELAY = 450;
const RETRACT_STEP = 16;
const WAIT_DELAY = 1500;
const POLL_MS = 1500;

const repo = new EjectorControlRepository();

const DEFAULTS: EjectorControlData = {
    ejectorControlEncendido: 0,
    ejectorTorque: 0,
    ejectorCambioPosicion: 0,
    ejectorPosicion1: 0,
    ejectorPosicion2: 0,
    ejectorVelocidadPosicion: 0,
    ejectorVelocidad: 0,
    ejectorPosicion: 0,
    ejectorTorqueSecundario: 0,
};

function sleep(ms: number) {
    return new Promise<void>(r => setTimeout(r, ms));
}

export const EjectorCanvas: React.FC = () => {
    const [push, setPush] = useState(0);              // 0‒MAX_EJECT mm
    const [phase, setPhase] = useState<Phase>('REPOSO');
    const [showPart, setShowPart] = useState(true);
    const [falling, setFalling] = useState(false);
    const [data, setData] = useState<EjectorControlData>(DEFAULTS);
    const cancelRef = useRef(false);

    useEffect(() => {
        const fetch = () => { repo.get().then(setData).catch(() => {}); };
        fetch();
        const id = setInterval(fetch, POLL_MS);
        return () => clearInterval(id);
    }, []);

    const runCycle = useCallback(async () => {
        if (cancelRef.current) return;

        // 1 ─ REPOSO
        setPhase('REPOSO');
        setShowPart(true);
        setFalling(false);
        setPush(0);
        await sleep(WAIT_DELAY);

        // 2 ─ EXPULSIÓN
        setPhase('EXPULSANDO');
        for (let p = 0; p <= MAX_EJECT; p++) {
            if (cancelRef.current) return;
            setPush(p);
            await sleep(EJECT_STEP);
        }

        // 3 ─ LIBERACIÓN / CAÍDA
        setPhase('CAIDA');
        setShowPart(false);
        setFalling(true);
        await sleep(RELEASE_DELAY + 300);
        setFalling(false);

        // 4 ─ RETROCESO
        setPhase('RETRAYENDO');
        for (let p = MAX_EJECT; p >= 0; p--) {
            if (cancelRef.current) return;
            setPush(p);
            await sleep(RETRACT_STEP);
        }
    }, []);

    useEffect(() => {
        cancelRef.current = false;
        let running = true;
        const loop = async () => {
            while (running && !cancelRef.current) {
                await runCycle();
            }
        };
        loop();
        return () => { running = false; cancelRef.current = true; };
    }, [runCycle]);

    const encendido = data.ejectorControlEncendido === 37;
    const phaseColor = PHASE_COLORS[phase];
    const pushPct = Math.round((push / MAX_EJECT) * 100);

    /* Geometría */
    const plateX = 150 + push;        // placa expulsora
    const pinTipX = 340 + push;       // punta de los pines (núcleo en x=340)
    const partX = 342 + push;         // pieza empujada por los pines

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
            {/* Status bar */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: phaseColor, boxShadow: `0 0 8px ${phaseColor}` }} />
                    <span className="text-[10px] font-bold uppercase" style={{ color: phaseColor }}>{PHASE_LABELS[phase]}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <div className={`w-2 h-2 rounded-full ${encendido ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className="font-bold">{encendido ? 'ON' : 'OFF'}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="material-icons text-xs text-primary">straighten</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{data.ejectorPosicion}</span><span>mm</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="material-icons text-xs text-sky-500">speed</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{data.ejectorVelocidad}</span><span>mm/s</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="material-icons text-xs text-amber-500">rotate_right</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{data.ejectorTorqueSecundario}</span><span>%</span>
                </div>
                <span className="ml-auto text-[9px] text-slate-400 hidden md:inline">{PHASE_DESC[phase]}</span>
            </div>

            {/* SVG */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                <svg viewBox="0 0 600 350" className="w-full h-full" style={{ maxHeight: '100%' }}>
                    <defs>
                        <linearGradient id="ejMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#cbd5e1" /><stop offset="50%" stopColor="#94a3b8" /><stop offset="100%" stopColor="#64748b" />
                        </linearGradient>
                        <linearGradient id="ejMold" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#bef264" /><stop offset="100%" stopColor="#65a30d" />
                        </linearGradient>
                        <filter id="ejShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" /></filter>
                    </defs>

                    {/* Rieles guía de la placa */}
                    <rect x="60" y="120" width="300" height="6" fill="url(#ejMetal)" rx="2" />
                    <rect x="60" y="224" width="300" height="6" fill="url(#ejMetal)" rx="2" />
                    {/* Base */}
                    <rect x="40" y="300" width="420" height="14" fill="#334155" rx="2" />

                    {/* ── Placa de respaldo fija (izquierda) ── */}
                    <rect x="60" y="80" width="16" height="190" fill="#475569" rx="2" />

                    {/* ── Mitad móvil del molde (fija en esta vista) ── */}
                    <g transform="translate(330, 70)" filter="url(#ejShadow)">
                        <path d="M0,0 H70 V210 H0 Z" fill="url(#ejMold)" stroke="#3f6212" strokeWidth="1.5" />
                        {/* Núcleo (lado derecho donde queda la pieza) */}
                        <rect x="60" y="80" width="14" height="50" fill="#84cc16" stroke="#3f6212" strokeWidth="1" />
                        {/* Canales por donde pasan los pines */}
                        <rect x="0" y="92" width="74" height="3" fill="#3f6212" opacity="0.5" />
                        <rect x="0" y="112" width="74" height="3" fill="#3f6212" opacity="0.5" />
                    </g>

                    {/* ── Placa expulsora (móvil) ── */}
                    <g transform={`translate(${plateX}, 0)`}>
                        {/* Patines */}
                        <rect x="6" y="114" width="26" height="18" fill="#52525b" rx="2" />
                        <rect x="6" y="218" width="26" height="18" fill="#52525b" rx="2" />
                        {/* Placa */}
                        <rect x="0" y="95" width="22" height="160" fill="#1e293b" stroke="#0f172a" strokeWidth="1" rx="2" />
                        {/* Vástago del actuador (hacia la izquierda) */}
                        <rect x="-40" y="166" width="42" height="18" fill="#64748b" rx="2" />
                    </g>

                    {/* ── Pines expulsores (atraviesan el molde) ── */}
                    {[150, 170, 190].map((y, i) => (
                        <rect key={i} x={plateX + 22} y={y - 1.5} width={pinTipX - (plateX + 22)} height="3" fill="#94a3b8" rx="1" />
                    ))}
                    {/* Cabeza de los pines en la placa */}
                    {[150, 170, 190].map((y, i) => (
                        <rect key={`h${i}`} x={plateX + 16} y={y - 4} width="8" height="8" fill="#475569" rx="1" />
                    ))}

                    {/* ── Pieza moldeada ── */}
                    {showPart && (
                        <g transform={`translate(${partX}, 150)`} style={{ transition: 'transform 0.05s linear' }}>
                            <path d="M0,-2 L14,-2 L14,8 L20,8 L20,32 L14,32 L14,42 L0,42 Z" fill="#1e3a8a" stroke="#1e40af" strokeWidth="1" />
                        </g>
                    )}

                    {/* ── Pieza cayendo ── */}
                    {falling && (
                        <g>
                            <path d={`M${pinTipX + 2},148 L${pinTipX + 16},148 L${pinTipX + 16},158 L${pinTipX + 22},158 L${pinTipX + 22},182 L${pinTipX + 16},182 L${pinTipX + 16},192 L${pinTipX + 2},192 Z`} fill="#1e3a8a" opacity="0.85">
                                <animateTransform attributeName="transform" type="translate" from="0 0" to="20 150" dur="0.7s" fill="freeze" />
                                <animate attributeName="opacity" from="0.85" to="0" dur="0.7s" fill="freeze" />
                            </path>
                        </g>
                    )}

                    {/* ── Barra de progreso ── */}
                    <rect x="60" y="330" width="440" height="4" fill="#1e293b" rx="2" />
                    <rect x="60" y="330" width={440 * (pushPct / 100)} height="4" fill={phaseColor} rx="2" style={{ transition: 'width 0.05s linear' }} />
                    <text x="280" y="348" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace" fontWeight="bold">
                        CARRERA EYECTOR: {pushPct}% · POS: {data.ejectorPosicion}mm
                    </text>
                </svg>
            </div>
        </div>
    );
};
