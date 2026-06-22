import React from 'react';
import { NavLink } from 'react-router-dom';

const NavButton: React.FC<{ label: string; icon: string; to: string }> = ({ label, icon, to }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `relative flex-1 flex flex-col items-center justify-center gap-1 px-4 min-w-[100px] transition-all duration-200 ${isActive
                    ? "bg-gradient-to-b from-primary-500 to-primary-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
            }
        >
            {({ isActive }) => (
                <>
                    {isActive && <span className="absolute top-0 left-0 h-0.5 w-full bg-accent shadow-[0_0_10px_rgba(6,182,212,0.8)]" />}
                    <span className={`material-icons ${isActive ? "" : "opacity-60"}`}>{icon}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? "" : "opacity-80"}`}>{label}</span>
                    {isActive && <div className="h-1 w-8 bg-white/90 rounded-full"></div>}
                </>
            )}
        </NavLink>
    );
};

export const FooterNav: React.FC = () => {
    return (
        <footer className="h-20 bg-gradient-to-r from-slate-900 via-slate-900 to-[#0c1b2e] text-white flex items-stretch shrink-0 overflow-x-auto no-scrollbar z-30 border-t border-slate-800 shadow-elevated">
            <NavButton label="General" icon="dashboard" to="/dashboard" />
            <NavButton label="Molde" icon="view_sidebar" to="/clamp" />
            <NavButton label="Inyección" icon="input" to="/injection" />
            <NavButton label="Eyección" icon="eject" to="/ejection" />
            <NavButton label="Temp." icon="thermostat" to="/heating" />
            <NavButton label="Configuración" icon="build" to="/maintenance" />
        </footer>
    );
};
