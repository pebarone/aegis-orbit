
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ConjunctionsPage } from './pages/ConjunctionsPage';
import { EvasionRoutingPage } from './pages/EvasionRoutingPage';
import { SystemStatusPage } from './pages/SystemStatusPage';

export const App = () => {
    return (
        <BrowserRouter basename="/app">
            <div className="flex flex-col h-full w-full">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/conjunctions" element={<ConjunctionsPage />} />
                        <Route path="/evasion" element={<EvasionRoutingPage />} />
                        <Route path="/status" element={<SystemStatusPage />} />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
};

export default App;
