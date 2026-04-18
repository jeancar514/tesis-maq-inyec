import React, { useEffect, useRef, useState } from 'react';
import { ScrewControlRepository } from '../../../../infrastructure/repository/screw-control.repository';
import { ScrewControlData } from '../../../../domain/models/screw-control.model';

const MAX_STROKE = 210.0;
const CYCLE_MS = 6000;
const POLL_MS = 1500;

const repo = new ScrewControlRepository();

export const DriveCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const offsetRef = useRef(0);
    const lastRef = useRef(0);
    const screwDataRef = useRef<ScrewControlData>({ controlEncendido: 0, velocidadHusillo: 0, torqueHusillo: 0 });
    const [screwData, setScrewData] = useState<ScrewControlData>({ controlEncendido: 0, velocidadHusillo: 0, torqueHusillo: 0 });

    // Poll /api/screw-control cada POLL_MS
    useEffect(() => {
        const fetch = () => {
            repo.get()
                .then(d => { screwDataRef.current = d; setScrewData(d); })
                .catch(() => {});
        };
        fetch();
        const id = setInterval(fetch, POLL_MS);
        return () => clearInterval(id);
    }, []);

    // Animación canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        const tick = (now: number) => {
            const dt = now - (lastRef.current || now);
            lastRef.current = now;

            const t = (now % CYCLE_MS) / CYCLE_MS;
            let pos: number;
            let isCharging = false;
            let phase = 'IDLE';

            if (t < 0.35) {
                pos = MAX_STROKE - (MAX_STROKE - 10) * (t / 0.35);
                phase = 'Inyección';
            } else if (t < 0.50) {
                pos = 10 - 2 * ((t - 0.35) / 0.15);
                phase = 'Mantenimiento';
            } else if (t < 0.82) {
                pos = 8 + (MAX_STROKE - 8) * ((t - 0.50) / 0.32);
                isCharging = true;
                phase = 'Carga';
                offsetRef.current = (offsetRef.current + (dt / 16) * 2.5) % 25;
            } else {
                pos = MAX_STROKE;
                phase = 'Enfriamiento';
            }

            draw(ctx, canvas, pos, offsetRef.current, isCharging, phase, screwDataRef.current);
            animRef.current = requestAnimationFrame(tick);
        };

        animRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    const encendido = screwData.controlEncendido === 37;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
            {/* Status bar */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${encendido ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className={`text-[10px] font-bold uppercase ${encendido ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {encendido ? 'Encendido' : 'Apagado'}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="material-icons text-xs text-primary">speed</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{screwData.velocidadHusillo}</span>
                    <span>RPM</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="material-icons text-xs text-amber-500">rotate_right</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{screwData.torqueHusillo}</span>
                    <span>Nm</span>
                </div>
            </div>
            <canvas ref={canvasRef} width={800} height={260} className="w-full h-full" />
        </div>
    );
};

function draw(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    pos: number,
    screwOffset: number,
    isCharging: boolean,
    phase: string,
    data: ScrewControlData
) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width;
    const H = canvas.height;
    const cy = H / 2 + 10;
    const encendido = data.controlEncendido === 37;

    // ── Barrel ──────────────────────────────────────────────────────────────
    const barrelX = 160;
    const barrelW = W - barrelX - 60;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    (ctx as any).roundRect(barrelX, cy - 40, barrelW, 80, 6);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(barrelX, cy - 40, barrelW, 10);

    // ── Heaters — naranja si encendido, gris si apagado ─────────────────────
    const heaterColor = encendido ? '#f59e0b' : '#475569';
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = heaterColor;
        ctx.fillRect(barrelX + 30 + i * 70, cy - 46, 50, 6);
        ctx.fillRect(barrelX + 30 + i * 70, cy + 40, 50, 6);
    }

    // ── Screw body ──────────────────────────────────────────────────────────
    const screwX = barrelX + (pos / MAX_STROKE) * (barrelW - 20);
    ctx.fillStyle = encendido ? '#94a3b8' : '#64748b';
    ctx.fillRect(screwX, cy - 8, barrelW, 16);

    // ── Screw threads ───────────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(barrelX, cy - 38, barrelW, 76);
    ctx.clip();
    ctx.strokeStyle = isCharging && encendido ? '#ef4444' : '#64748b';
    ctx.lineWidth = 1.5;
    for (let i = -25; i < barrelW + 25; i += 25) {
        const x = screwX + i + screwOffset;
        ctx.beginPath();
        ctx.moveTo(x, cy - 30);
        ctx.lineTo(x + 14, cy + 30);
        ctx.stroke();
    }
    ctx.restore();

    // ── Nozzle ──────────────────────────────────────────────────────────────
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(barrelX, cy - 26);
    ctx.lineTo(barrelX - 24, cy - 7);
    ctx.lineTo(barrelX - 24, cy + 7);
    ctx.lineTo(barrelX, cy + 26);
    ctx.closePath();
    ctx.fill();

    // ── Hopper ──────────────────────────────────────────────────────────────
    const hx = barrelX + barrelW * 0.55;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(hx - 40, cy - 120);
    ctx.lineTo(hx + 40, cy - 120);
    ctx.lineTo(hx + 20, cy - 40);
    ctx.lineTo(hx - 20, cy - 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(hx - 44, cy - 126, 88, 8);
    ctx.fillStyle = 'rgba(147,197,253,0.5)';
    for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(hx - 18 + i * 6, cy - 82, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Motor block ─────────────────────────────────────────────────────────
    const mx = barrelX + barrelW + 4;
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    (ctx as any).roundRect(mx, cy - 35, 50, 70, 4);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(mx + 8, cy - 20, 34, 40);

    // ── Phase label ─────────────────────────────────────────────────────────
    ctx.fillStyle = isCharging && encendido ? '#ef4444' : '#94a3b8';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(phase, barrelX + 8, cy - 48);
}
