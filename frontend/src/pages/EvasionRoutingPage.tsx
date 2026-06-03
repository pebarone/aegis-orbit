import { useState } from 'react';
import { api, type EvasionRoutingRequest, type ManeuverRecommendation } from '../api';

export const EvasionRoutingPage = () => {
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<EvasionRoutingRequest>({
        satellite_id: 'AEO-LEO-104',
        miss_distance_km: 0.42,
        relative_velocity_kms: 12.8,
        collision_probability: 0.00031,
    });
    const [result, setResult] = useState<ManeuverRecommendation | null>(null);

    const updateNumber = (field: keyof Omit<EvasionRoutingRequest, 'satellite_id'>, value: string) => {
        setForm((current) => ({ ...current, [field]: Number(value) }));
    };

    const handleCalculate = async () => {
        setCalculating(true);
        setError(null);
        try {
            const recommendation = await api.calculateEvasion(form);
            setResult(recommendation);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Unable to calculate maneuver.');
        } finally {
            setCalculating(false);
        }
    };

    return (
        <main className="flex-1 md:ml-64 mt-16 overflow-y-auto p-margin-desktop h-[calc(100vh-64px)]">
            <div className="mb-8">
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Evasion Routing</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">Calculate delta-V maneuvers from live API scoring.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                <div className="lg:col-span-4 flex flex-col gap-gutter">
                    <div className="bg-surface-container border border-surface-border p-6 rounded-sm">
                        <h3 className="font-headline-md text-headline-md text-on-surface mb-6 border-b border-surface-border pb-4">Conjunction Parameters</h3>
                        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); void handleCalculate(); }}>
                            <div className="flex flex-col gap-2">
                                <label className="font-data-label text-data-label text-on-surface-variant uppercase">Target Asset ID</label>
                                <input
                                    className="bg-telemetry-bg border border-surface-border rounded-sm py-2 px-3 font-data-display text-primary"
                                    value={form.satellite_id}
                                    onChange={(event) => setForm((current) => ({ ...current, satellite_id: event.target.value }))}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-data-label text-data-label text-on-surface-variant uppercase">Miss Distance (km)</label>
                                <input
                                    className="bg-telemetry-bg border border-surface-border rounded-sm py-2 px-3 font-data-display text-on-surface"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.miss_distance_km}
                                    onChange={(event) => updateNumber('miss_distance_km', event.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-data-label text-data-label text-on-surface-variant uppercase">Relative Velocity (km/s)</label>
                                <input
                                    className="bg-telemetry-bg border border-surface-border rounded-sm py-2 px-3 font-data-display text-on-surface"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.relative_velocity_kms}
                                    onChange={(event) => updateNumber('relative_velocity_kms', event.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-data-label text-data-label text-on-surface-variant uppercase">Probability of Collision</label>
                                <input
                                    className="bg-telemetry-bg border border-surface-border rounded-sm py-2 px-3 font-data-display text-status-critical"
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.00001"
                                    value={form.collision_probability}
                                    onChange={(event) => updateNumber('collision_probability', event.target.value)}
                                />
                                <span className="font-data-label text-data-label text-status-critical mt-1">API VALIDATED INPUT</span>
                            </div>
                            {error && <div className="text-status-critical font-data-label text-data-label">{error}</div>}
                            <button type="submit" disabled={calculating} className="w-full mt-8 bg-primary-container text-on-primary-container font-headline-md py-4 rounded-sm hover:brightness-110 flex justify-center items-center gap-2 transition-all disabled:opacity-60">
                                {calculating ? <span className="material-symbols-outlined animate-spin">autorenew</span> : <span className="material-symbols-outlined filled">rocket_launch</span>}
                                {calculating ? 'COMPUTING...' : 'CALCULATE MANEUVER'}
                            </button>
                        </form>
                    </div>
                </div>
                <div className={`lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-gutter content-start transition-opacity duration-300 ${result ? 'opacity-100' : 'opacity-50'}`}>
                    <div className="bg-surface-container border border-surface-border p-4 rounded-sm col-span-1 md:col-span-2">
                        <span className="font-data-label text-on-surface-variant uppercase tracking-widest">Post-Maneuver Risk Reduction</span>
                        <div className="mt-2">
                            <span className="font-headline-lg font-bold text-secondary-container">{result ? `${result.risk_reduction_percent.toFixed(1)}%` : '0.0%'}</span>
                            <div className="w-full bg-telemetry-bg h-4 rounded-sm mt-2 border border-surface-border">
                                <div className="h-full bg-secondary-container transition-all duration-1000" style={{ width: `${result?.risk_reduction_percent ?? 0}%`, boxShadow: '0 0 10px rgba(0,238,252,0.5)' }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-surface-container border border-surface-border p-4 rounded-sm">
                        <span className="font-data-label text-on-surface-variant uppercase">Required Delta-V</span>
                        <div className="mt-2 text-primary font-data-display text-3xl">{result ? result.estimated_delta_v_ms.toFixed(3) : '0.000'} <span className="text-sm">m/s</span></div>
                    </div>
                    <div className="bg-surface-container border border-surface-border p-4 rounded-sm">
                        <span className="font-data-label text-on-surface-variant uppercase">Risk Level</span>
                        <div className="mt-2 text-status-critical font-data-display text-3xl uppercase">{result?.risk_level ?? 'pending'}</div>
                    </div>
                    <div className="bg-surface-container border border-surface-border p-4 rounded-sm md:col-span-2">
                        <span className="font-data-label text-on-surface-variant uppercase">Ignition Window</span>
                        <div className="mt-2 text-on-surface font-data-display text-lg">{result?.ignition_window_utc ?? 'Awaiting calculation'}</div>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-4">{result?.maneuver_recommendation ?? 'Submit conjunction parameters to request an API recommendation.'}</p>
                        {result && <p className="font-data-label text-data-label text-outline mt-4">Residual Pc: {result.residual_collision_probability.toExponential(2)}</p>}
                    </div>
                </div>
            </div>
        </main>
    );
};
