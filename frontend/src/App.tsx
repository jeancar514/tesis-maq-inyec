import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './presentation/shared/components/MainLayout';
import { DashboardPage } from './presentation/features/dashboard/pages/DashboardPage';
import { StepCyclePage } from './presentation/features/dashboard/pages/StepCyclePage';
import { TimeMonitorPage } from './presentation/features/dashboard/pages/TimeMonitorPage';
import { ClampPage } from './presentation/features/clamp/pages/ClampPage';
import { OpeningProfilePage } from './presentation/features/clamp/pages/OpeningProfilePage';
import { InjectionProfilePage } from './presentation/features/injection/pages/InjectionProfilePage';
import { GeneralPage } from './presentation/features/injection/pages/GeneralPage';
import { HoldingPage } from './presentation/features/injection/pages/HoldingPage';
import { InjectionGraphsPage } from './presentation/features/injection/pages/InjectionGraphsPage';
import { EjectionProfilePage } from './presentation/features/ejection/pages/EjectionProfilePage';
import { HeatingZonesPage } from './presentation/features/heating/pages/HeatingZonesPage';
import { PIDDiagnosticPage } from './presentation/features/heating/pages/PIDDiagnosticPage';
import { IOMonitorPage } from './presentation/features/maintenance/pages/IOMonitorPage';
import { AlarmHistoryPage } from './presentation/features/maintenance/pages/AlarmHistoryPage';
import { ServoMonitorPage } from './presentation/features/dashboard/pages/ServoMonitorPage';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />

                    <Route path="dashboard">
                        <Route index element={<DashboardPage />} />
                        <Route path="step-cycle" element={<StepCyclePage />} />
                        <Route path="time-monitor" element={<TimeMonitorPage />} />
                        <Route path="servo-monitor" element={<ServoMonitorPage />} />
                    </Route>

                    <Route path="clamp">
                        <Route index element={<ClampPage />} />
                        <Route path="opening-profile" element={<OpeningProfilePage />} />
                    </Route>
                    <Route path="injection">
                        <Route index element={<Navigate to="/injection/general" replace />} />
                        <Route path="general" element={<GeneralPage />} />
                        <Route path="injection-profile" element={<InjectionProfilePage />} />
                        <Route path="holding" element={<HoldingPage />} />
                        <Route path="graphs" element={<InjectionGraphsPage />} />
                    </Route>
                    <Route path="ejection">
                        <Route index element={<Navigate to="/ejection/ejection-profile" replace />} />
                        <Route path="ejection-profile" element={<EjectionProfilePage />} />
                    </Route>
                    <Route path="heating">
                        <Route index element={<Navigate to="/heating/cylinder-zones" replace />} />
                        <Route path="cylinder-zones" element={<HeatingZonesPage />} />
                        <Route path="pid-diagnostic" element={<PIDDiagnosticPage />} />
                    </Route>
                    <Route path="maintenance">
                        <Route index element={<Navigate to="/maintenance/io-monitor" replace />} />
                        <Route path="io-monitor" element={<IOMonitorPage />} />
                        <Route path="alarm-history" element={<AlarmHistoryPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
