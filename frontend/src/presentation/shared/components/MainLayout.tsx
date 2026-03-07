import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FooterNav } from './FooterNav';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 h-screen flex flex-col font-display overflow-hidden">
            <Header />
            <div className="flex-1 flex overflow-hidden min-h-0">
                <Sidebar />
                <main className="flex-1 overflow-hidden p-4 bg-background-light dark:bg-background-dark relative">
                    <Outlet />
                </main>
            </div>
            {/* <NotificationBar /> */}
            <FooterNav />
        </div>
    );
};
