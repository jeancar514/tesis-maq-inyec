import React from 'react';
import { NavLink } from 'react-router-dom';

const NavButton: React.FC<{ label: string; icon: string; to: string }> = ({ label, icon, to }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                isActive
                    ? "flex-1 flex flex-col items-center justify-center gap-1 bg-primary px-4 min-w-[100px]"
                    : "flex-1 flex flex-col items-center justify-center gap-1 px-4 min-w-[100px] hover:bg-slate-800 transition-colors"
            }
        >
            {({ isActive }) => (
                <>
                    <span className={`material-icons ${isActive ? "" : "opacity-60"}`}>{icon}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? "" : "opacity-80"}`}>{label}</span>
                    {isActive && <div className="h-1 w-8 bg-white rounded-full mt-1"></div>}
                </>
            )}
        </NavLink>
    );
};

export const FooterNav: React.FC = () => {
    return (
        <footer className="h-20 bg-slate-900 text-white flex items-stretch shrink-0 overflow-x-auto no-scrollbar z-30">
            <NavButton label="General" icon="dashboard" to="/dashboard" />
            <NavButton label="Molde" icon="view_sidebar" to="/clamp" />
            <NavButton label="Inyección" icon="input" to="/injection" />
            <NavButton label="Eyección" icon="eject" to="/ejection" />
            <NavButton label="Temp." icon="thermostat" to="/heating" />
            <NavButton label="Configuración" icon="build" to="/maintenance" />
        </footer>
    );
};
