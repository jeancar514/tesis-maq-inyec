import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const SidebarItem: React.FC<{ label: string; icon: string; to: string }> = ({ label, icon, to }) => {
    return (
        <NavLink
            to={to}
            end
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`
            }
        >
            <span className="material-icons">{icon}</span>
            <span className="text-sm">{label}</span>
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
            { label: 'Perfil de Cierre', icon: 'timeline', to: '/clamp' },
            { label: 'Perfil de Apertura', icon: 'open_in_full', to: '/clamp/opening-profile' },
        ]
    },
    'injection': {
        title: 'Control de Inyección',
        items: [
            { label: 'Carro de Inyección', icon: 'insights', to: '/injection/injection-profile' },
            { label: 'Husillo', icon: 'compress', to: '/injection/holding' },
            { label: 'Gráficos', icon: 'show_chart', to: '/injection/graphs' },
        ]
    },
    'ejection': {
        title: 'Control de Expulsión',
        items: [
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
        <aside className="w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{config.title}</h2>
            </div>
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {config.items.map((item) => (
                    <SidebarItem key={item.to} label={item.label} icon={item.icon} to={item.to} />
                ))}
            </nav>
        </aside>
    );
};
