import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CarriageControlRepository } from '../../../../infrastructure/repository/carriage-control.repository';
import { CarriageControlData } from '../../../../domain/models/carriage-control.model';

/**
 * Canvas del CARRO DE INYECCIÓN.
 * Simula la unidad de inyección completa (tolva + barril + boquilla + motor)
 * montada sobre guías, que avanza frente al plato fijo hasta que la boquilla
 * toca el bebedero del molde (nozzle touch), inyecta y retrocede.
 * Mecanismo de referencia: la unidad desliza sobre el carro para acercar/retirar
 * la boquilla del molde (MathWorks; Patente US 9,061,455).
 */

type Phase = 'AVANZANDO' | 'CONTACTO' | 'INYECTANDO' | 'RETROCESO' | 'ESPERA';

const PHASE_COLORS: Record<Phase, string> = {
    AVANZANDO: '#3b82f6',
    CONTACTO: '#8b5cf6',
    INYECTANDO: '#f97316',
    RETROCESO: '#3b82f6',
    ESPERA: '#14b8a6',
};

const PHASE_LABELS: Record<Phase, string> = {
    AVANZANDO: 'Avanzando',
    CONTACTO: 'Contacto Boquilla',
    INYECTANDO: 'Inyectando',
    RETROCESO: 'Retroceso',
    ESPERA: 'Espera',
};

const PHASE_DESC: Record<Phase, string> = {
    AVANZANDO: 'El carro desliza sobre las guías acercando la boquilla al molde.',
    CONTACTO: 'La boquilla presiona el bebedero del plato fijo (nozzle touch).',
    INYECTANDO: 'Se transfiere el polímero fundido a la cavidad a alta presión.',
    RETROCESO: 'El carro se retira separando la boquilla del molde.',
    ESPERA: 'Unidad en reposo antes del siguiente ciclo.',
};

/* Geometría del recorrido del carro */
const MIN_X = 120;   // retraído
const MAX_X = 220;   // boquilla en contacto

/* Tiempos (ms) */
const ADVANCE_STEP = 16;
const CONTACT_DELAY = 500;
const INJECT_DELAY = 1300;
const RETRACT_STEP = 18;
const WAIT_DELAY = 1400;
const POLL_MS = 1500;

const repo = new CarriageControlRepository();

const DEFAULTS: CarriageControlData = {
    carriageControlEncendido: 0,
    carriageTorque: 0,
    carriageCambioPosicion: 0,
    carriagePosicion1: 0,
    carriagePosicion2: 0,
    carriageVelocidadPosicion: 0,
    carriageVelocidad: 0,
    carriagePosicion: 0,
    carriageTorqueSecundario: 0,
};

function sleep(ms: number) {
    return new Promise<void>(r => setTimeout(r, ms));
}

export const CarriageCanvas: React.FC = () => {
    const [carriageX, setCarriageX] = useState(MIN_X);
    const [phase, setPhase] = useState<Phase>('ESPERA');
    const [showMelt, setShowMelt] = useState(false);
    const [showPart, setShowPart] = useState(false);
    const [data, setData] = useState<CarriageControlData>(DEFAULTS);
    const cancelRef = useRef(false);

    // Poll de datos en vivo
    useEffect(() => {
        const fetch = () => { repo.get().then(setData).catch(() => {/* bridge offline */}); };
        fetch();
        const id = setInterval(fetch, POLL_MS);
        return () => clearInterval(id);
    }, []);

    const runCycle = useCallback(async () => {
        if (cancelRef.current) return;

        // 1 ─ AVANCE
        setPhase('AVANZANDO');
        setShowPart(false);
        for (let x = MIN_X; x <= MAX_X; x += 2) {
            if (cancelRef.current) return;
            setCarriageX(x);
            await sleep(ADVANCE_STEP);
        }

        // 2 ─ CONTACTO (nozzle touch)
        setPhase('CONTACTO');
        await sleep(CONTACT_DELAY);

        // 3 ─ INYECCIÓN
        setPhase('INYECTANDO');
        setShowMelt(true);
        await sleep(INJECT_DELAY);
        setShowMelt(false);
        setShowPart(true);

        // 4 ─ RETROCESO
        setPhase('RETROCESO');
        for (let x = MAX_X; x >= MIN_X; x -= 2) {
            if (cancelRef.current) return;
            setCarriageX(x);
            await sleep(RETRACT_STEP);
        }

        // 5 ─ ESPERA
        setPhase('ESPERA');
        await sleep(WAIT_DELAY);
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

    const encendido = data.carriageControlEncendido === 37;
    const phaseColor = PHASE_COLORS[phase];
    const travelPct = Math.round(((carriageX - MIN_X) / (MAX_X - MIN_X)) * 100);

    // Posiciones locales: punta de la boquilla en x≈250 del grupo
    const nozzleTipX = carriageX + 250;

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
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{data.carriagePosicion}</span><span>mm</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="material-icons text-xs text-sky-500">speed</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{data.carriageVelocidad}</span><span>mm/s</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="material-icons text-xs text-amber-500">rotate_right</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{data.carriageTorqueSecundario}</span><span>%</span>
                </div>
                <span className="ml-auto text-[9px] text-slate-400 hidden md:inline">{PHASE_DESC[phase]}</span>
            </div>

            {/* SVG */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                <svg viewBox="0 0 600 350" className="w-full h-full" style={{ maxHeight: '100%' }}>
                    <defs>
                        <linearGradient id="carMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#cbd5e1" /><stop offset="50%" stopColor="#94a3b8" /><stop offset="100%" stopColor="#64748b" />
                        </linearGradient>
                        <linearGradient id="carBarrel" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#475569" /><stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>
                        <linearGradient id="carMold" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#bef264" /><stop offset="100%" stopColor="#65a30d" />
                        </linearGradient>
                        <filter id="carShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" /></filter>
                    </defs>

                    {/* ── Guías / rieles ── */}
                    <rect x="30" y="118" width="500" height="8" fill="url(#carMetal)" rx="2" />
                    <rect x="30" y="226" width="500" height="8" fill="url(#carMetal)" rx="2" />
                    {/* Base */}
                    <rect x="30" y="300" width="540" height="14" fill="#334155" rx="2" />

                    {/* ── Plato fijo + molde (derecha) ── */}
                    <g transform="translate(470, 70)" filter="url(#carShadow)">
                        <rect x="40" y="0" width="18" height="210" fill="#475569" rx="2" />
                        <path d="M0,0 H40 V210 H0 V120 H10 V90 H0 Z" fill="url(#carMold)" stroke="#3f6212" strokeWidth="1.5" />
                        {/* Bebedero (sprue) */}
                        <circle cx="2" cy="105" r="7" fill="#1e293b" />
                        <rect x="0" y="101" width="12" height="8" fill="#0f172a" rx="1" />
                        {/* Pieza moldeada */}
                        <path d="M10,92 L22,92 L22,102 L28,102 L28,108 L22,108 L22,118 L10,118 Z"
                            fill="#1e3a8a" opacity={showPart ? 1 : 0} style={{ transition: 'opacity 0.3s ease' }} />
                    </g>

                    {/* ── Chorro de fundido ── */}
                    {showMelt && (
                        <rect x={nozzleTipX} y="173" width={Math.max(0, 472 - nozzleTipX)} height="4" fill="#f97316" rx="1">
                            <animate attributeName="opacity" values="1;0.4;1" dur="0.4s" repeatCount="indefinite" />
                        </rect>
                    )}

                    {/* ── Carro de inyección (móvil) ── */}
                    <g transform={`translate(${carriageX}, 0)`} filter="url(#carShadow)">
                        {/* Patines sobre guías */}
                        <rect x="40" y="112" width="40" height="20" fill="#52525b" rx="2" />
                        <rect x="40" y="220" width="40" height="20" fill="#52525b" rx="2" />
                        <rect x="150" y="112" width="40" height="20" fill="#52525b" rx="2" />
                        <rect x="150" y="220" width="40" height="20" fill="#52525b" rx="2" />

                        {/* Motor / accionamiento (atrás) */}
                        <rect x="0" y="140" width="55" height="70" fill="url(#carMetal)" rx="4" />
                        <circle cx="27" cy="175" r="16" fill="#334155" />
                        <circle cx="27" cy="175" r="6" fill="#64748b" />

                        {/* Tolva */}
                        <g>
                            <path d="M70,55 H120 L108,120 H82 Z" fill="#3b82f6" />
                            <rect x="66" y="49" width="58" height="8" fill="#60a5fa" rx="2" />
                            {[0,1,2,3,4].map(i => (
                                <circle key={i} cx={82 + i * 6} cy={92} r="2.5" fill="rgba(191,219,254,0.7)" />
                            ))}
                        </g>

                        {/* Barril */}
                        <rect x="55" y="155" width="180" height="40" fill="url(#carBarrel)" rx="5" />
                        {/* Bandas calefactoras */}
                        {[0,1,2,3].map(i => (
                            <rect key={i} x={75 + i * 40} y="149" width="28" height="6"
                                fill={encendido ? '#f59e0b' : '#475569'} rx="1" />
                        ))}
                        {/* Boquilla */}
                        <path d="M235,162 L252,172 L252,178 L235,188 Z" fill="#1e293b" />
                    </g>

                    {/* ── Barra de progreso ── */}
                    <rect x="30" y="330" width="500" height="4" fill="#1e293b" rx="2" />
                    <rect x="30" y="330" width={500 * (travelPct / 100)} height="4" fill={phaseColor} rx="2" style={{ transition: 'width 0.05s linear' }} />
                    <text x="280" y="348" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace" fontWeight="bold">
                        AVANCE CARRO: {travelPct}% · POS: {data.carriagePosicion}mm
                    </text>
                </svg>
            </div>
        </div>
    );
};
