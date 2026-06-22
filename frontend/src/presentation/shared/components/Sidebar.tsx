import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const SidebarItem: React.FC<{ label: string; icon: string; to: string }> = ({ label, icon, to }) => {
    return (
        <NavLink
            to={to}
            end
            className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-primary-500/15 to-accent/10 text-primary font-bold shadow-soft'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    {/* Barra de acento activa */}
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent transition-all ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
                    <span className={`material-icons text-[20px] transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary/70'}`}>{icon}</span>
                    <span className="text-sm">{label}</span>
                </>
            )}
        </NavLink>
    );
};

interface SidebarConfig {
    title: string;
    items: Array<{ label: string; icon: string; to: string }>;
}

const SIDEBAR_CONFIGS: Record<string, SidebarConfig> = {
    'dashboard': {
        title: 'Panel y Ciclo',
        items: [
            { label: 'Vista General', icon: 'grid_view', to: '/dashboard' },
            { label: 'Ciclo de Pasos', icon: 'account_tree', to: '/dashboard/step-cycle' },
            { label: 'Monitor de Tiempo', icon: 'schedule', to: '/dashboard/time-monitor' },
            { label: 'Servomotor', icon: 'precision_manufacturing', to: '/dashboard/servo-monitor' },
        ]
    },
    'clamp': {
        title: 'Control de Cierre',
        items: [
            { label: 'Vista General', icon: 'view_in_ar', to: '/clamp' },
            { label: 'Perfil de Cierre', icon: 'timeline', to: '/clamp/closing-profile' },
            { label: 'Perfil de Apertura', icon: 'open_in_full', to: '/clamp/opening-profile' },
        ]
    },
    'injection': {
        title: 'Control de Inyección',
        items: [
            { label: 'General', icon: 'monitor_heart', to: '/injection/general' },
            { label: 'Carro de Inyección', icon: 'precision_manufacturing', to: '/injection/carriage' },
            { label: 'Perfil de Inyección', icon: 'insights', to: '/injection/injection-profile' },
            { label: 'Husillo', icon: 'compress', to: '/injection/holding' },
            { label: 'Gráficos', icon: 'show_chart', to: '/injection/graphs' },
        ]
    },
    'ejection': {
        title: 'Control de Expulsión',
        items: [
            { label: 'Eyector', icon: 'eject', to: '/ejection/general' },
            { label: 'Perfil de Eyección', icon: 'show_chart', to: '/ejection/ejection-profile' },
        ]
    },
    'heating': {
        title: 'Temperaturas',
        items: [
            { label: 'Zonas del Cilindro', icon: 'thermostat', to: '/heating/cylinder-zones' },
            { label: 'ON - OFF', icon: 'analytics', to: '/heating/pid-diagnostic' },
        ]
    },
    'recipes': {
        title: 'Gestión de Recetas',
        items: [
            { label: 'Lista de Recetas', icon: 'list_alt', to: '/recipes' },
            { label: 'Importar/Exportar', icon: 'sync_alt', to: '/recipes/sync' },
        ]
    },
    'maintenance': {
        title: 'Mantenimiento',
        items: [
            { label: 'Monitor I/O', icon: 'settings_input_component', to: '/maintenance/io-monitor' },
            { label: 'Historial de Alarmas', icon: 'history', to: '/maintenance/alarm-history' },
        ]
    }
};

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentSection = pathSegments[0] || 'dashboard';

    const config = SIDEBAR_CONFIGS[currentSection] || SIDEBAR_CONFIGS['dashboard'];

    return (
        <aside className="w-56 flex flex-col h-full shrink-0 bg-gradient-to-b from-white/90 to-slate-50/80 dark:from-surface-dark/90 dark:to-background-dark/80 backdrop-blur-sm border-r border-slate-200/80 dark:border-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                    <span className="h-4 w-1 rounded-full bg-gradient-to-b from-primary to-accent" />
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{config.title}</h2>
                </div>
            </div>
            <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto custom-scrollbar">
                {config.items.map((item) => (
                    <SidebarItem key={item.to} label={item.label} icon={item.icon} to={item.to} />
                ))}
            </nav>
            <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="rounded-xl bg-gradient-to-br from-primary-500/10 to-accent/10 p-3 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estado</p>
                    <p className="text-xs font-bold text-primary mt-0.5">Operativo</p>
                </div>
            </div>
        </aside>
    );
};
