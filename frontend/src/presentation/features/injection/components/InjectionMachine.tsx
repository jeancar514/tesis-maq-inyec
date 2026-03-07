import React from 'react';

export const InjectionMachine: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`w-full ${className}`}>
            <style>
                {`
                @keyframes cicloInyeccion {
                    0%, 15%   { transform: translateX(0); } 
                    30%, 65%  { transform: translateX(70px); } 
                    80%, 100% { transform: translateX(0); } 
                }

                @keyframes caerPieza {
                    0%, 75%   { opacity: 0; transform: translateY(0) rotate(0deg); }
                    76%       { opacity: 1; transform: translateY(0) rotate(0deg); }
                    88%       { opacity: 1; transform: translateY(110px) rotate(45deg); }
                    89%, 100% { opacity: 0; transform: translateY(110px) rotate(45deg); }
                }

                @keyframes parpadeoLuz {
                    0%, 49% { fill: #10b981; filter: drop-shadow(0 0 2px #10b981); }
                    50%, 100% { fill: #059669; }
                }

                @keyframes pulsoCalor {
                    0%, 25% { fill: #f97316; }
                    35%, 55% { fill: #ef4444; }
                    65%, 100% { fill: #f97316; }
                }

                .anim-grupo-movil {
                    animation: cicloInyeccion 5s infinite ease-in-out;
                }

                .anim-pieza {
                    animation: caerPieza 5s infinite ease-in;
                    transform-origin: center;
                }

                .anim-luz {
                    animation: parpadeoLuz 1s infinite;
                }

                .anim-calor {
                    animation: pulsoCalor 5s infinite;
                }
                `}
            </style>
            <svg className="w-full h-auto drop-shadow-2xl" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gradBase" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#334155" />
                    </linearGradient>
                    <linearGradient id="gradPlatina" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Machine Shadow */}
                <ellipse cx="400" cy="425" rx="360" ry="12" fill="currentColor" className="text-slate-900/10 dark:text-black/20" />

                {/* 1. CHASIS Y BASE */}
                <rect x="90" y="390" width="50" height="25" rx="5" fill="currentColor" className="text-slate-800 dark:text-slate-950" />
                <rect x="375" y="390" width="50" height="25" rx="5" fill="currentColor" className="text-slate-800 dark:text-slate-950" />
                <rect x="660" y="390" width="50" height="25" rx="5" fill="currentColor" className="text-slate-800 dark:text-slate-950" />

                <rect x="50" y="320" width="700" height="80" rx="8" fill="url(#gradBase)" />
                <rect x="50" y="330" width="700" height="2" fill="white" fillOpacity="0.05" />

                {/* 2. UNIDAD DE INYECCIÓN */}
                <rect x="420" y="240" width="300" height="50" rx="5" fill="currentColor" className="text-slate-400 dark:text-slate-700" />

                {/* Motor */}
                <rect x="580" y="140" width="130" height="110" rx="10" fill="currentColor" className="text-primary/80" />
                <rect x="590" y="150" width="20" height="90" rx="5" fill="currentColor" className="text-slate-800/40" />
                <rect x="620" y="150" width="20" height="90" rx="5" fill="currentColor" className="text-slate-800/40" />
                <rect x="650" y="150" width="20" height="90" rx="5" fill="currentColor" className="text-slate-800/40" />

                {/* Cañón */}
                <rect x="410" y="190" width="170" height="40" className="anim-calor" fill="#f97316" />

                {/* Bandas Calefactoras */}
                <rect x="430" y="185" width="15" height="50" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
                <rect x="460" y="185" width="15" height="50" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
                <rect x="490" y="185" width="15" height="50" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
                <rect x="520" y="185" width="15" height="50" rx="2" fill="currentColor" className="text-slate-300 dark:text-slate-600" />

                {/* Boquilla */}
                <polygon points="410,195 385,205 385,215 410,225" className="anim-calor" fill="#f97316" />

                {/* Tolva */}
                <rect x="520" y="160" width="30" height="30" fill="currentColor" className="text-slate-500" />
                <polygon points="535,160 480,40 590,40" fill="currentColor" className="text-slate-300 dark:text-slate-700" />
                <rect x="470" y="30" width="130" height="10" rx="3" fill="currentColor" className="text-slate-400 dark:text-slate-800" />
                <polygon points="535,140 515,60 555,60" fill="currentColor" className="text-primary/40" />

                {/* 3. UNIDAD DE CIERRE */}
                <rect x="70" y="100" width="50" height="220" rx="6" fill="currentColor" className="text-slate-700 dark:text-slate-800" />
                <rect x="360" y="100" width="50" height="220" rx="6" fill="currentColor" className="text-slate-700 dark:text-slate-800" />

                {/* Tie bars */}
                <rect x="110" y="125" width="260" height="18" fill="currentColor" className="text-slate-300 dark:text-slate-700" stroke="currentColor" strokeOpacity="0.1" />
                <rect x="110" y="280" width="260" height="18" fill="currentColor" className="text-slate-300 dark:text-slate-700" stroke="currentColor" strokeOpacity="0.1" />

                {/* Molde Fijo */}
                <rect x="320" y="140" width="40" height="140" rx="3" fill="currentColor" className="text-slate-400 dark:text-slate-500" />
                <rect x="310" y="160" width="10" height="100" fill="currentColor" className="text-slate-500 dark:text-slate-600" />

                {/* GRUPO MÓVIL */}
                <g className="anim-grupo-movil">
                    <rect x="20" y="195" width="140" height="30" fill="currentColor" className="text-slate-300 dark:text-slate-700" />
                    <rect x="160" y="100" width="50" height="220" rx="6" fill="url(#gradPlatina)" />
                    <rect x="210" y="140" width="40" height="140" rx="3" fill="currentColor" className="text-slate-400 dark:text-slate-500" />
                    <rect x="250" y="160" width="10" height="100" fill="currentColor" className="text-slate-500 dark:text-slate-600" />
                </g>

                <rect x="40" y="180" width="60" height="60" rx="8" fill="currentColor" className="text-primary/60" />

                {/* 4. PIEZA PLÁSTICA */}
                <rect className="anim-pieza text-primary" x="280" y="180" width="20" height="50" rx="2" fill="currentColor" />

                {/* 5. PUERTA DE SEGURIDAD */}
                <rect x="110" y="80" width="280" height="250" rx="10" fill="currentColor" className="text-primary/5 stroke-slate-900/20 dark:stroke-white/10" strokeWidth="3" />
                <rect x="230" y="180" width="15" height="50" rx="5" fill="currentColor" className="text-primary/40" />

                {/* 6. PANEL DE CONTROL */}
                <path d="M 400 90 L 450 60" stroke="#7f8c8d" strokeWidth="10" strokeLinecap="round" />
                <rect x="420" y="15" width="110" height="85" rx="6" className="fill-slate-100 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700" strokeWidth="2" />
                <rect x="430" y="25" width="90" height="50" rx="3" fill="#0f172a" />
                <polyline points="440,65 460,40 480,55 510,35" fill="none" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="440" cy="85" r="5" className="anim-luz" />
            </svg>
        </div>
    );
};
