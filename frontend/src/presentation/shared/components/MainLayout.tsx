import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FooterNav } from './FooterNav';
import { Outlet, useLocation } from 'react-router-dom';

export const MainLayout: React.FC = () => {
    const location = useLocation();
    return (
        <div className="text-slate-800 dark:text-slate-100 h-screen flex flex-col font-display overflow-hidden">
            <Header />
            <div className="flex-1 flex overflow-hidden min-h-0">
                <Sidebar />
                <main className="flex-1 overflow-hidden p-4 relative bg-grid">
                    {/* Resplandor decorativo superior */}
                    <div className="pointer-events-none absolute -top-24 right-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
                    <div key={location.pathname} className="relative h-full animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
            <FooterNav />
        </div>
    );
};
