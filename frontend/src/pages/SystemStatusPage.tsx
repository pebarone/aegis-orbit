import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, api, type HealthResponse, type StatusResponse } from '../api';

export const SystemStatusPage = () => {
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [status, setStatus] = useState<StatusResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([api.getHealth(), api.getStatus()])
            .then(([healthPayload, statusPayload]) => {
                setHealth(healthPayload);
                setStatus(statusPayload);
            })
            .catch((reason: Error) => setError(reason.message));
    }, []);

    const rawPayload = useMemo(() => JSON.stringify({ health, status }, null, 2), [health, status]);

    return (
        <main className="flex-1 md:ml-64 mt-16 bg-telemetry-bg relative overflow-y-auto w-full p-gutter md:p-margin-desktop h-[calc(100vh-64px)]">
            <div className="absolute inset-0 scanline z-0"></div>
            <div className="max-w-7xl mx-auto relative z-10 flex flex-col gap-gutter">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-gutter border-b border-surface-border pb-gutter">
                    <div>
                        <h1 className="font-headline-lg text-headline-lg text-on-surface">API & Service Health</h1>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-unit">{API_BASE_URL}</p>
                    </div>
                    <div className="flex items-center gap-control-density bg-surface-container border border-surface-border px-gutter py-2 rounded-sm">
                        <span className={`w-3 h-3 rounded-full glowing-dot pulse ${health?.status === 'healthy' ? 'bg-status-nominal text-status-nominal' : 'bg-status-high text-status-high'}`}></span>
                        <span className="font-data-label text-data-label text-on-surface uppercase">{health?.status ?? 'Checking API'}</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mt-gutter">
                    <div className="md:col-span-4 flex flex-col gap-gutter">
                        <div className="bg-surface border border-surface-border rounded-sm p-gutter flex flex-col gap-control-density relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                            <span className="font-data-label text-data-label text-on-surface-variant uppercase">Service Name</span>
                            <span className="font-data-display text-data-display text-on-surface">{status?.service ?? 'OrbitGuard'}</span>
                        </div>
                        <div className="bg-surface border border-surface-border rounded-sm p-gutter flex flex-col gap-gutter">
                            <span className="font-data-label text-data-label text-on-surface-variant uppercase border-b border-surface-border pb-unit">Deployment Status</span>
                            <div className="flex justify-between items-center"><span className="text-on-surface">Version</span><span className="text-status-nominal font-data-label">{status?.version ?? '-'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-on-surface">Team</span><span className="text-status-nominal font-data-label">{status?.team ?? '-'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-on-surface">Alerts</span><span className="text-status-high font-data-label">{status?.simulated_alert_count ?? '-'}</span></div>
                        </div>
                    </div>
                    <div className="md:col-span-8 bg-[#0b0e16] border border-surface-border rounded-sm flex flex-col relative overflow-hidden group">
                        <div className="flex items-center justify-between px-gutter py-2 border-b border-surface-border bg-surface">
                            <div className="flex items-center gap-control-density text-on-surface-variant">
                                <span className="material-symbols-outlined text-[16px]">terminal</span>
                                <span className="font-data-label text-data-label">/health + /api/status</span>
                            </div>
                        </div>
                        <div className="p-gutter overflow-y-auto max-h-[500px] font-data-label text-data-label text-[#b8bdcc] leading-relaxed">
                            {error ? <pre className="m-0 text-status-critical">{error}</pre> : <pre className="m-0">{rawPayload}</pre>}
                            <div className="mt-4 flex items-center gap-2 text-secondary-fixed pulse"><span>_</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};
