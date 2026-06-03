import { useEffect, useMemo, useState } from 'react';
import { api, type ConjunctionAlert, type StatusResponse } from '../api';

export const DashboardPage = () => {
    const [alerts, setAlerts] = useState<ConjunctionAlert[]>([]);
    const [status, setStatus] = useState<StatusResponse | null>(null);

    useEffect(() => {
        void api.getConjunctions().then(setAlerts);
        void api.getStatus().then(setStatus);
    }, []);

    const criticalAlert = useMemo(() => alerts.find((alert) => alert.severity === 'critical') ?? alerts[0], [alerts]);
    const highRiskCount = alerts.filter((alert) => alert.severity === 'critical' || alert.severity === 'high').length;

    return (
        <main className="flex-1 md:ml-64 mt-16 overflow-y-auto no-scrollbar p-gutter bg-background relative h-[calc(100vh-64px)]">
            <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-gutter">
                <div className="col-span-12 bg-surface-container border border-status-critical flex items-center justify-between p-6 relative overflow-hidden rounded-sm">
                    <div className="scanline absolute inset-0 z-10"></div>
                    <div className="absolute -left-10 top-0 bottom-0 w-24 bg-status-critical/10 -skew-x-12 blur-xl"></div>
                    <div className="flex items-center gap-6 relative z-20">
                        <div className="w-16 h-16 rounded-full border-4 border-status-critical flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
                            <span className="material-symbols-outlined text-[32px] text-status-critical filled">gavel</span>
                        </div>
                        <div>
                            <div className="font-data-label text-data-label text-status-critical uppercase tracking-widest mb-1">Global Threat Indicator</div>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface uppercase">
                                {criticalAlert ? `${criticalAlert.severity} conjunction risk` : 'Loading conjunction risk'}
                            </h2>
                        </div>
                    </div>
                    <div className="text-right relative z-20 hidden sm:block">
                        <div className="font-data-label text-data-label text-on-surface-variant uppercase mb-1">Primary Event</div>
                        <div className="font-data-display text-xl text-status-critical">{criticalAlert?.satellite_id ?? 'AEO'}</div>
                    </div>
                </div>

                <div className="col-span-12 md:col-span-4 bg-surface-container border border-surface-border p-4 flex flex-col justify-between h-32 hover:border-outline-variant transition-colors group rounded-sm">
                    <div className="flex justify-between items-start">
                        <span className="font-data-label text-data-label text-on-surface-variant uppercase">Simulated Alerts</span>
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">satellite_alt</span>
                    </div>
                    <div>
                        <div className="font-data-display text-data-display text-primary text-3xl">{status?.simulated_alert_count ?? alerts.length}</div>
                        <div className="font-label-sm text-label-sm text-status-nominal flex items-center gap-1 mt-1">Deterministic API feed</div>
                    </div>
                </div>

                <div className="col-span-12 md:col-span-4 bg-surface-container border border-status-high p-4 flex flex-col justify-between h-32 hover:border-status-critical transition-colors group relative overflow-hidden rounded-sm">
                    <div className="absolute inset-0 bg-status-high/5 group-hover:bg-status-high/10 transition-colors"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <span className="font-data-label text-data-label text-status-high uppercase">High-Risk Conjunctions</span>
                        <span className="material-symbols-outlined text-status-high">warning_amber</span>
                    </div>
                    <div className="relative z-10">
                        <div className="font-data-display text-data-display text-on-surface text-3xl">{highRiskCount}</div>
                        <div className="font-label-sm text-label-sm text-status-high flex items-center gap-1 mt-1">Critical or high severity</div>
                    </div>
                </div>

                <div className="col-span-12 md:col-span-4 bg-surface-container border border-surface-border p-4 flex flex-col justify-between h-32 hover:border-outline-variant transition-colors group rounded-sm">
                    <div className="flex justify-between items-start">
                        <span className="font-data-label text-data-label text-on-surface-variant uppercase">API Health</span>
                        <span className="material-symbols-outlined text-status-nominal">health_and_safety</span>
                    </div>
                    <div>
                        <div className="font-data-display text-data-display text-on-surface text-3xl">{status?.version ?? '0.1.0'}</div>
                        <div className="w-full bg-surface-container-highest h-1 mt-2 rounded-sm">
                            <div className="bg-status-nominal h-1 w-full rounded-sm"></div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-8 bg-surface-container border border-surface-border min-h-[400px] relative overflow-hidden flex flex-col rounded-sm">
                    <div className="p-3 border-b border-surface-border flex justify-between items-center bg-surface-container-high">
                        <span className="font-data-label text-data-label text-primary uppercase">Orbital Density Matrix</span>
                        <div className="flex gap-2">
                            <button className="px-2 py-1 text-[10px] uppercase font-data-label border border-primary text-primary hover:bg-primary/10 rounded-sm">LEO</button>
                            <button className="px-2 py-1 text-[10px] uppercase font-data-label border border-surface-border text-on-surface-variant hover:border-outline rounded-sm">MEO</button>
                            <button className="px-2 py-1 text-[10px] uppercase font-data-label border border-surface-border text-on-surface-variant hover:border-outline rounded-sm">GEO</button>
                        </div>
                    </div>
                    <div className="flex-1 bg-telemetry-bg relative flex items-center justify-center overflow-hidden">
                        <div className="scanline absolute inset-0 z-10"></div>
                        <div className="absolute w-[80%] aspect-square rounded-full border border-surface-border/50"></div>
                        <div className="absolute w-[60%] aspect-square rounded-full border border-surface-border/50"></div>
                        <div className="absolute w-[40%] aspect-square rounded-full border border-surface-border/50"></div>
                        <div className="absolute w-[20%] aspect-square rounded-full border border-primary/30"></div>
                        <div className="absolute w-full h-[1px] bg-surface-border/50"></div>
                        <div className="absolute h-full w-[1px] bg-surface-border/50"></div>
                        <div className="absolute w-2 h-2 bg-status-nominal rounded-full top-1/4 left-1/3 shadow-[0_0_8px_rgba(52,199,89,0.8)]"></div>
                        <div className="absolute w-3 h-3 bg-status-critical rounded-full top-1/3 left-1/2 shadow-[0_0_12px_rgba(255,59,48,0.8)] animate-ping"></div>
                        <div className="absolute w-1/2 h-[1px] bg-primary/40 origin-left top-1/2 left-1/2 animate-[spin_4s_linear_infinite]" style={{ transformOrigin: 'left center' }}>
                            <div className="absolute bottom-0 right-0 w-full h-32 bg-gradient-to-t from-primary/20 to-transparent -rotate-90 origin-bottom-right opacity-30"></div>
                        </div>
                        <div className="absolute bottom-4 left-4 bg-surface-container-high/80 backdrop-blur-md border border-surface-border p-2 rounded-sm z-20">
                            <div className="font-data-label text-[10px] text-on-surface-variant">TARGET REF: <span className="text-primary">{criticalAlert?.object_id ?? 'OBJ'}</span></div>
                            <div className="font-data-label text-[10px] text-on-surface-variant">MISS: <span className="text-on-surface">{criticalAlert?.miss_distance_km ?? '-'} km</span></div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-surface-container border border-surface-border flex flex-col h-[400px] rounded-sm">
                    <div className="p-3 border-b border-surface-border flex justify-between items-center bg-surface-container-high">
                        <span className="font-data-label text-data-label text-on-surface uppercase">System Event Log</span>
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">list_alt</span>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar bg-telemetry-bg">
                        <table className="w-full text-left border-collapse">
                            <tbody>
                                {alerts.map((alert) => (
                                    <tr className="border-b border-surface-border/50 hover:bg-surface-container-high/50 transition-colors" key={`${alert.satellite_id}-${alert.object_id}`}>
                                        <td className="p-2 font-data-label text-[10px] text-status-critical w-20">{alert.severity.toUpperCase()}</td>
                                        <td className="p-2 font-data-label text-[11px] text-on-surface">
                                            <span className="text-status-nominal">[API]</span> {alert.satellite_id} vs {alert.object_id}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
};
