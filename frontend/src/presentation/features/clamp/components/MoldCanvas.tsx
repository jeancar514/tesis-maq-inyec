import React, { useEffect, useRef, useState, useCallback } from 'react';

type CyclePhase = 'CERRANDO' | 'INYECTANDO' | 'ENFRIANDO' | 'ABRIENDO' | 'EXPULSANDO' | 'RETRAYENDO' | 'ESPERA';

const PHASE_COLORS: Record<CyclePhase, string> = {
    CERRANDO: '#3b82f6',
    INYECTANDO: '#f97316',
    ENFRIANDO: '#38bdf8',
    ABRIENDO: '#3b82f6',
    EXPULSANDO: '#facc15',
    RETRAYENDO: '#facc15',
    ESPERA: '#14b8a6',
};

const PHASE_LABELS: Record<CyclePhase, string> = {
    CERRANDO: 'Cerrando',
    INYECTANDO: 'Inyectando',
    ENFRIANDO: 'Enfriando',
    ABRIENDO: 'Abriendo',
    EXPULSANDO: 'Expulsando',
    RETRAYENDO: 'Retrayendo',
    ESPERA: 'Espera',
};

const PHASE_DESC: Record<CyclePhase, string> = {
    CERRANDO: 'El plato móvil avanza comprimiendo los resortes de tensión.',
    INYECTANDO: 'La boquilla introduce polímero fundido a alta presión.',
    ENFRIANDO: 'Circulación de refrigerante para solidificar la pieza.',
    ABRIENDO: 'Retracción de la unidad de cierre.',
    EXPULSANDO: 'La placa extractora desmolda la pieza terminada.',
    RETRAYENDO: 'Retrayendo pernos expulsores a posición de reposo.',
    ESPERA: 'Intervalo de seguridad antes del nuevo ciclo.',
};

/* ─── Timing constants (ms) ─── */
const CLOSE_STEP = 12;
const OPEN_STEP = 12;
const INJECT_DELAY = 500;
const INJECT_FILL_DELAY = 350;
const COOL_DELAY = 1000;
const EJECT_STEP = 18;
const RETRACT_STEP = 14;
const WAIT_DELAY = 1800;

/* ─── Geometry constants ─── */
const MIN_X = 80;
const MAX_X = 260;
const MAX_EJECT = 25;

function sleep(ms: number) {
    return new Promise<void>(r => setTimeout(r, ms));
}

export const MoldCanvas: React.FC = () => {
    const [moldPos, setMoldPos] = useState(0);        // 0‒100 %
    const [ejectorPos, setEjectorPos] = useState(0);   // 0‒25 mm
    const [phase, setPhase] = useState<CyclePhase>('ESPERA');
    const [showPlastic, setShowPlastic] = useState(false);
    const [fallingPiece, setFallingPiece] = useState(false);
    const cancelRef = useRef(false);

    /* ── Mold cycle logic ── */
    const runCycle = useCallback(async () => {
        if (cancelRef.current) return;

        // 1 ─ CLOSE
        setPhase('CERRANDO');
        for (let i = 0; i <= 100; i += 2) {
            if (cancelRef.current) return;
            setMoldPos(i);
            await sleep(CLOSE_STEP);
        }

        // 2 ─ INJECT
        setPhase('INYECTANDO');
        await sleep(INJECT_DELAY);
        setShowPlastic(true);
        await sleep(INJECT_FILL_DELAY);

        // 3 ─ COOL
        setPhase('ENFRIANDO');
        await sleep(COOL_DELAY);

        // 4 ─ OPEN to 40 %
        setPhase('ABRIENDO');
        for (let i = 100; i >= 40; i -= 2) {
            if (cancelRef.current) return;
            setMoldPos(i);
            await sleep(OPEN_STEP);
        }

        // 5 ─ EJECT
        setPhase('EXPULSANDO');
        for (let i = 0; i <= MAX_EJECT; i++) {
            if (cancelRef.current) return;
            setEjectorPos(i);
            await sleep(EJECT_STEP);
        }
        // Piece falls
        setFallingPiece(true);
        setShowPlastic(false);
        await sleep(500);
        setFallingPiece(false);

        // 6 ─ RETRACT
        setPhase('RETRAYENDO');
        for (let i = MAX_EJECT; i >= 0; i--) {
            if (cancelRef.current) return;
            setEjectorPos(i);
            await sleep(RETRACT_STEP);
        }

        // 7 ─ Full open
        for (let i = 40; i >= 0; i -= 2) {
            if (cancelRef.current) return;
            setMoldPos(i);
            await sleep(OPEN_STEP);
        }

        // 8 ─ WAIT
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
        return () => {
            running = false;
            cancelRef.current = true;
        };
    }, [runCycle]);

    /* ── Derived positions ── */
    const movingX = MIN_X + ((MAX_X - MIN_X) * (moldPos / 100));
    const springWidth = Math.max(0, 420 - (movingX + 160));

    /* ── Build spring path ── */
    const springPath = (width: number) => {
        if (width <= 0) return '';
        const segs = 12;
        const segW = width / segs;
        let d = 'M 0 6 ';
        for (let i = 0; i < segs; i++) {
            const x = i * segW + segW / 2;
            const y = i % 2 === 0 ? 0 : 12;
            d += `L ${x} ${y} `;
        }
        d += `L ${width} 6`;
        return d;
    };

    const phaseColor = PHASE_COLORS[phase];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
            {/* Status bar */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: phaseColor, boxShadow: `0 0 8px ${phaseColor}` }}
                    />
                    <span className="text-[10px] font-bold uppercase" style={{ color: phaseColor }}>
                        {PHASE_LABELS[phase]}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="material-icons text-xs text-primary">compress</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{moldPos}%</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="material-icons text-xs text-amber-500">eject</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{ejectorPos}mm</span>
                </div>
                <span className="ml-auto text-[9px] text-slate-400 hidden sm:inline">{PHASE_DESC[phase]}</span>
            </div>

            {/* SVG animation area */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                <svg viewBox="0 0 600 350" className="w-full h-full" style={{ maxHeight: '100%' }}>
                    <defs>
                        <linearGradient id="moldMetalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#cbd5e1" />
                            <stop offset="50%" stopColor="#94a3b8" />
                            <stop offset="100%" stopColor="#64748b" />
                        </linearGradient>
                        <linearGradient id="moldGreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#bef264" />
                            <stop offset="100%" stopColor="#65a30d" />
                        </linearGradient>
                        <linearGradient id="moldCoolGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#7dd3fc" />
                            <stop offset="100%" stopColor="#0ea5e9" />
                        </linearGradient>
                        <filter id="moldShadow">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
                        </filter>
                    </defs>

                    {/* ── Guide Rails ── */}
                    <rect x="100" y="90" width="400" height="12" fill="url(#moldMetalGrad)" rx="2" />
                    <rect x="100" y="248" width="400" height="12" fill="url(#moldMetalGrad)" rx="2" />

                    {/* ── Dynamic Springs ── */}
                    {springWidth > 0 && (
                        <>
                            <g transform={`translate(${movingX + 160}, 85)`}>
                                <path d={springPath(springWidth)} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                            <g transform={`translate(${movingX + 160}, 253)`}>
                                <path d={springPath(springWidth)} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                        </>
                    )}

                    {/* ── Fixed Side (Right) ── */}
                    <g transform="translate(420, 40)" filter="url(#moldShadow)">
                        {/* Back plate */}
                        <rect x="50" y="10" width="15" height="250" fill="#475569" rx="2" />
                        {/* Fixed mold */}
                        <path d="M0,0 H50 V270 H0 V185 H10 V85 H0 Z" fill="url(#moldGreenGrad)" stroke="#3f6212" strokeWidth="1.5" />
                        {/* Cooling channels */}
                        <circle cx="15" cy="40" r="6" fill="url(#moldCoolGrad)" stroke="#0ea5e9" strokeWidth="1" />
                        <circle cx="35" cy="80" r="6" fill="url(#moldCoolGrad)" stroke="#0ea5e9" strokeWidth="1" />
                        <circle cx="35" cy="190" r="6" fill="url(#moldCoolGrad)" stroke="#0ea5e9" strokeWidth="1" />
                        <circle cx="15" cy="230" r="6" fill="url(#moldCoolGrad)" stroke="#0ea5e9" strokeWidth="1" />
                    </g>

                    {/* ── Injection Unit (Right side nozzle) ── */}
                    <g transform="translate(490, 155)">
                        <path d="M0,20 L30,45 L110,45 L110,-5 L30,-5 L0,20" fill="#64748b" stroke="#334155" strokeWidth="1" />
                        <rect x="25" y="-10" width="15" height="60" fill="#f97316" rx="2" />
                    </g>

                    {/* ── Moving Side (Left) ── */}
                    <g transform={`translate(${movingX}, 40)`} filter="url(#moldShadow)">
                        {/* Moving plate */}
                        <path
                            d="M0,0 H160 L145,20 V90 H130 V180 H145 V250 L160,270 H0 Z"
                            fill="url(#moldGreenGrad)" stroke="#3f6212" strokeWidth="1.5"
                        />
                        {/* Bolt mounts */}
                        <circle cx="25" cy="30" r="14" fill="none" stroke="#3f6212" strokeWidth="2" />
                        <circle cx="25" cy="30" r="4" fill="#3f6212" />
                        <circle cx="25" cy="240" r="14" fill="none" stroke="#3f6212" strokeWidth="2" />
                        <circle cx="25" cy="240" r="4" fill="#3f6212" />

                        {/* ── Ejector system ── */}
                        <g>
                            {/* Hydraulic cylinder */}
                            <rect x="-30" y="115" width="60" height="40" fill="#94a3b8" rx="3" />
                            <rect x="0" y="125" width="130" height="20" fill="#475569" rx="1" />
                            {/* Ejector plate */}
                            <rect
                                x={125 + ejectorPos} y="90" width="12" height="90" fill="#1e293b" rx="2"
                                stroke="#0f172a" strokeWidth="0.5"
                            />
                            {/* Ejector pins */}
                            <rect x={137 + ejectorPos} y="108" width={8} height="3" fill="#64748b" rx="1" />
                            <rect x={137 + ejectorPos} y="135" width={8} height="3" fill="#64748b" rx="1" />
                            <rect x={137 + ejectorPos} y="162" width={8} height="3" fill="#64748b" rx="1" />
                        </g>

                        {/* Plastic piece inside cavity (stays on the moving/core side) */}
                        <path
                            d={`M${130 + ejectorPos},105 L${145 + ejectorPos},105 L${145 + ejectorPos},115 L${152 + ejectorPos},115 L${152 + ejectorPos},155 L${145 + ejectorPos},155 L${145 + ejectorPos},165 L${130 + ejectorPos},165 Z`}
                            fill="#1e3a8a"
                            opacity={showPlastic ? 1 : 0}
                            style={{ transition: 'opacity 0.3s ease' }}
                        />

                        {/* Cooling channels */}
                        <circle cx="115" cy="60" r="6" fill="url(#moldCoolGrad)" stroke="#0ea5e9" strokeWidth="1" />
                        <circle cx="115" cy="210" r="6" fill="url(#moldCoolGrad)" stroke="#0ea5e9" strokeWidth="1" />
                    </g>

                    {/* ── Falling piece animation ── */}
                    {fallingPiece && (
                        <g>
                            <rect x={movingX + 160} y="200" width="18" height="50" fill="#1e3a8a" rx="2" opacity="0.8">
                                <animateTransform
                                    attributeName="transform" type="translate"
                                    from="0 0" to="0 120"
                                    dur="0.5s" fill="freeze"
                                />
                                <animate attributeName="opacity" from="0.8" to="0" dur="0.5s" fill="freeze" />
                            </rect>
                        </g>
                    )}

                    {/* ── Progress bar at bottom ── */}
                    <rect x="100" y="320" width="400" height="4" fill="#1e293b" rx="2" />
                    <rect
                        x="100" y="320"
                        width={400 * (moldPos / 100)} height="4"
                        fill={phaseColor} rx="2"
                        style={{ transition: 'width 0.05s linear' }}
                    />
                    <text x="300" y="340" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace" fontWeight="bold">
                        CARRERA: {moldPos}% · EXPULSOR: {ejectorPos}mm
                    </text>
                </svg>
            </div>
        </div>
    );
};
