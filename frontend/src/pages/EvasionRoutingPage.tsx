import { useMemo, useState, type CSSProperties } from 'react';
import { api, type EvasionRoutingRequest, type ManeuverRecommendation } from '../api';

type NumericField = keyof Omit<EvasionRoutingRequest, 'satellite_id'>;

type SliderConfig = {
    field: NumericField;
    label: string;
    min: number;
    max: number;
    step: number;
    unit: string;
    description: string;
    format: (value: number) => string;
};

type RiskPreview = {
    riskLevel: ManeuverRecommendation['risk_level'];
    riskIndex: number;
    color: string;
    trackColor: string;
    label: string;
    pulseSeconds: number;
    orbitSeconds: number;
    objectRadius: number;
};

const clamp = (value: number, lower: number, upper: number) => Math.max(lower, Math.min(upper, value));

const sliderConfigs: SliderConfig[] = [
    {
        field: 'miss_distance_km',
        label: 'Distância Mínima',
        min: 0.05,
        max: 20,
        step: 0.01,
        unit: 'km',
        description: 'Menor separação prevista entre o satélite protegido e o objeto rastreado. Valores menores aumentam a pressão geométrica de colisão.',
        format: (value) => value.toFixed(2),
    },
    {
        field: 'relative_velocity_kms',
        label: 'Velocidade Relativa',
        min: 0.1,
        max: 20,
        step: 0.1,
        unit: 'km/s',
        description: 'Velocidade de aproximação no encontro orbital. Quanto maior, menor o tempo útil de correção e maior a dificuldade da manobra.',
        format: (value) => value.toFixed(1),
    },
    {
        field: 'collision_probability',
        label: 'Probabilidade de Colisão',
        min: 0,
        max: 0.001,
        step: 0.000001,
        unit: 'Pc',
        description: 'Probabilidade modelada de colisão. A simulação usa escala logarítmica porque valores realistas de Pc são muito pequenos.',
        format: (value) => value.toExponential(2),
    },
];

const classifyRisk = (missDistanceKm: number, collisionProbability: number): ManeuverRecommendation['risk_level'] => {
    if (collisionProbability >= 1e-4 || missDistanceKm < 0.75) {
        return 'critical';
    }
    if (collisionProbability >= 5e-5 || missDistanceKm < 2.0) {
        return 'high';
    }
    if (collisionProbability >= 1e-5 || missDistanceKm < 5.0) {
        return 'watch';
    }
    return 'nominal';
};

const buildRiskPreview = (form: EvasionRoutingRequest): RiskPreview => {
    const pcPressure = clamp((Math.log10(Math.max(form.collision_probability, 1e-9)) + 9) / 6, 0, 1);
    const missPressure = clamp((5 - form.miss_distance_km) / 5, 0, 1);
    const velocityPressure = clamp(form.relative_velocity_kms / 20, 0, 1);
    const riskIndex = Math.round(clamp(pcPressure * 45 + missPressure * 35 + velocityPressure * 20, 0, 100));
    const riskLevel = classifyRisk(form.miss_distance_km, form.collision_probability);

    const severity = {
        nominal: {
            color: '#34C759',
            trackColor: 'rgba(52, 199, 89, 0.22)',
            label: 'Risco prático baixo',
        },
        watch: {
            color: '#FFCC00',
            trackColor: 'rgba(255, 204, 0, 0.24)',
            label: 'Risco exige monitoramento',
        },
        high: {
            color: '#FF9500',
            trackColor: 'rgba(255, 149, 0, 0.24)',
            label: 'Risco elevado',
        },
        critical: {
            color: '#FF3B30',
            trackColor: 'rgba(255, 59, 48, 0.26)',
            label: 'Risco severo',
        },
    }[riskLevel];

    return {
        riskLevel,
        riskIndex,
        color: severity.color,
        trackColor: severity.trackColor,
        label: severity.label,
        pulseSeconds: clamp(3.6 - riskIndex / 34, 0.7, 3.2),
        orbitSeconds: clamp(8.5 - riskIndex / 15, 2.2, 8.5),
        objectRadius: clamp(5 + riskIndex / 18, 6, 11),
    };
};

const resultColorClass: Record<ManeuverRecommendation['risk_level'], string> = {
    nominal: 'text-status-nominal',
    watch: 'text-status-watch',
    high: 'text-status-high',
    critical: 'text-status-critical',
};

const riskLabel: Record<ManeuverRecommendation['risk_level'], string> = {
    nominal: 'nominal',
    watch: 'atenção',
    high: 'alto',
    critical: 'crítico',
};

const recommendationText: Record<ManeuverRecommendation['risk_level'], string> = {
    nominal: 'Manobra não requerida. Mantenha a conjunção em monitoramento SSA de rotina.',
    watch: 'Prepare um plano de queima contingencial e solicite uma nova atualização de rastreio antes da ignição.',
    high: 'Execute uma queima de evasão prograde ao longo da órbita, com confirmação de rastreio pós-manobra.',
    critical: 'Execute uma queima de evasão prograde ao longo da órbita, com confirmação de rastreio pós-manobra.',
};

const RiskOrbitSvg = ({ preview }: { preview: RiskPreview }) => {
    const svgStyle = {
        '--risk-color': preview.color,
        '--risk-track': preview.trackColor,
        '--risk-speed': `${preview.pulseSeconds}s`,
    } as CSSProperties;

    return (
        <svg className="risk-orbit-svg w-full h-full min-h-[260px]" viewBox="0 0 360 260" role="img" aria-label={`${preview.label}, ${preview.riskIndex} por cento de pressão de risco`} style={svgStyle}>
            <defs>
                <radialGradient id="risk-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={preview.color} stopOpacity="0.45" />
                    <stop offset="70%" stopColor={preview.color} stopOpacity="0.08" />
                    <stop offset="100%" stopColor={preview.color} stopOpacity="0" />
                </radialGradient>
                <filter id="risk-blur" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="5" />
                </filter>
            </defs>

            <rect width="360" height="260" fill="#0A0C10" />
            <circle cx="180" cy="130" r="88" fill="url(#risk-glow)" filter="url(#risk-blur)" className="risk-pulse" />
            <ellipse cx="180" cy="130" rx="134" ry="58" fill="none" stroke="#424656" strokeWidth="1" />
            <ellipse cx="180" cy="130" rx="96" ry="96" fill="none" stroke="#2C2E33" strokeWidth="1" strokeDasharray="6 8" />
            <ellipse cx="180" cy="130" rx="138" ry="58" fill="none" stroke={preview.trackColor} strokeWidth="12" opacity="0.5" />
            <ellipse cx="180" cy="130" rx="138" ry="58" fill="none" stroke={preview.color} strokeWidth="2" strokeDasharray="9 12" opacity="0.72" />

            <g className="risk-orbit-plane" transform="translate(180 130) scale(1 0.42)" style={{ '--risk-orbit-speed': `${preview.orbitSeconds}s` } as CSSProperties}>
                <g className="risk-orbiter">
                    <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur={`${preview.orbitSeconds}s`} repeatCount="indefinite" />
                    <g transform="translate(138 0) scale(1 2.381)">
                        <circle r={preview.objectRadius} fill={preview.color} className="risk-debris" />
                    </g>
                </g>
            </g>

            <circle cx="180" cy="130" r="15" fill="#b3c5ff" />
            <circle cx="180" cy="130" r="7" fill="#0066ff" />

            <g transform="translate(24 24)">
                <text x="0" y="0" fill="#c2c6d8" fontFamily="JetBrains Mono, monospace" fontSize="11">CAMPO DE RISCO</text>
                <text x="0" y="26" fill={preview.color} fontFamily="JetBrains Mono, monospace" fontSize="28" fontWeight="700">{preview.riskIndex}</text>
                <text x="58" y="25" fill="#e1e2ee" fontFamily="Geist, sans-serif" fontSize="13">pressão</text>
            </g>
        </svg>
    );
};

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

    const preview = useMemo(() => buildRiskPreview(form), [form]);
    const activeRiskLevel = result?.risk_level ?? preview.riskLevel;

    const updateNumber = (field: NumericField, value: string) => {
        setForm((current) => ({ ...current, [field]: Number(value) }));
        setResult(null);
    };

    const handleCalculate = async () => {
        setCalculating(true);
        setError(null);
        try {
            const recommendation = await api.calculateEvasion(form);
            setResult(recommendation);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Não foi possível calcular a manobra.');
        } finally {
            setCalculating(false);
        }
    };

    return (
        <main className="flex-1 md:ml-64 mt-16 overflow-y-auto p-margin-desktop h-[calc(100vh-64px)]">
            <div className="mb-8">
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Rota de Evasão</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">Calcule manobras delta-v com pontuação ao vivo da API.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                <div className="lg:col-span-4 flex flex-col gap-gutter">
                    <div className="bg-surface-container border border-surface-border p-6 rounded-sm">
                        <h3 className="font-headline-md text-headline-md text-on-surface mb-6 border-b border-surface-border pb-4">Parâmetros da Conjunção</h3>
                        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); void handleCalculate(); }}>
                            <div className="flex flex-col gap-2">
                                <label className="font-data-label text-data-label text-on-surface-variant uppercase">ID do Ativo Alvo</label>
                                <input
                                    className="bg-telemetry-bg border border-surface-border rounded-sm py-2 px-3 font-data-display text-primary"
                                    value={form.satellite_id}
                                    onChange={(event) => {
                                        setForm((current) => ({ ...current, satellite_id: event.target.value }));
                                        setResult(null);
                                    }}
                                />
                            </div>
                            {sliderConfigs.map((config) => (
                                <div className="flex flex-col gap-3" key={config.field}>
                                    <div className="flex items-start justify-between gap-4">
                                        <label className="font-data-label text-data-label text-on-surface-variant uppercase">{config.label}</label>
                                        <span className="font-data-display text-primary text-right whitespace-nowrap">
                                            {config.format(form[config.field])} <span className="text-xs text-on-surface-variant">{config.unit}</span>
                                        </span>
                                    </div>
                                    <input
                                        className="accent-primary-container"
                                        type="range"
                                        min={config.min}
                                        max={config.max}
                                        step={config.step}
                                        value={form[config.field]}
                                        onChange={(event) => updateNumber(config.field, event.target.value)}
                                    />
                                    <p className="font-body-md text-sm leading-5 text-on-surface-variant">{config.description}</p>
                                </div>
                            ))}
                            {error && <div className="text-status-critical font-data-label text-data-label">{error}</div>}
                            <button type="submit" disabled={calculating} className="w-full mt-8 bg-primary-container text-on-primary-container font-headline-md py-4 rounded-sm hover:brightness-110 flex justify-center items-center gap-2 transition-all disabled:opacity-60">
                                {calculating ? <span className="material-symbols-outlined animate-spin">autorenew</span> : <span className="material-symbols-outlined filled">rocket_launch</span>}
                                {calculating ? 'CALCULANDO...' : 'CALCULAR MANOBRA'}
                            </button>
                        </form>
                    </div>
                </div>
                <div className={`lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-gutter content-start transition-opacity duration-300 ${result ? 'opacity-100' : 'opacity-50'}`}>
                    <div className="bg-surface-container border border-surface-border rounded-sm overflow-hidden col-span-1 md:col-span-2">
                        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr]">
                            <div className="min-h-[260px]">
                                <RiskOrbitSvg preview={preview} />
                            </div>
                            <div className="p-5 flex flex-col justify-center gap-4 border-t xl:border-t-0 xl:border-l border-surface-border">
                                <div>
                                    <span className="font-data-label text-on-surface-variant uppercase">Prévia de Severidade</span>
                                    <div className={`mt-2 font-data-display text-3xl uppercase ${resultColorClass[preview.riskLevel]}`}>{riskLabel[preview.riskLevel]}</div>
                                    <p className="font-body-md text-body-md text-on-surface-variant mt-3">{preview.label}. O SVG reage imediatamente a distância mínima, velocidade de aproximação e Pc antes do envio do cálculo de manobra para a API.</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-t border-surface-border pt-4">
                                    <div>
                                        <span className="font-data-label text-data-label text-on-surface-variant">Geometria</span>
                                        <div className="font-data-display text-on-surface mt-1">{Math.round(clamp((5 - form.miss_distance_km) / 5, 0, 1) * 100)}%</div>
                                    </div>
                                    <div>
                                        <span className="font-data-label text-data-label text-on-surface-variant">Velocidade</span>
                                        <div className="font-data-display text-on-surface mt-1">{Math.round(clamp(form.relative_velocity_kms / 20, 0, 1) * 100)}%</div>
                                    </div>
                                    <div>
                                        <span className="font-data-label text-data-label text-on-surface-variant">Carga Pc</span>
                                        <div className="font-data-display text-on-surface mt-1">{Math.round(clamp((Math.log10(Math.max(form.collision_probability, 1e-9)) + 9) / 6, 0, 1) * 100)}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-surface-container border border-surface-border p-4 rounded-sm col-span-1 md:col-span-2">
                        <span className="font-data-label text-on-surface-variant uppercase tracking-widest">Redução de Risco Pós-Manobra</span>
                        <div className="mt-2">
                            <span className="font-headline-lg font-bold text-secondary-container">{result ? `${result.risk_reduction_percent.toFixed(1)}%` : '0.0%'}</span>
                            <div className="w-full bg-telemetry-bg h-4 rounded-sm mt-2 border border-surface-border">
                                <div className="h-full bg-secondary-container transition-all duration-1000" style={{ width: `${result?.risk_reduction_percent ?? 0}%`, boxShadow: '0 0 10px rgba(0,238,252,0.5)' }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-surface-container border border-surface-border p-4 rounded-sm">
                        <span className="font-data-label text-on-surface-variant uppercase">Delta-V Necessário</span>
                        <div className="mt-2 text-primary font-data-display text-3xl">{result ? result.estimated_delta_v_ms.toFixed(3) : '0.000'} <span className="text-sm">m/s</span></div>
                    </div>
                    <div className="bg-surface-container border border-surface-border p-4 rounded-sm">
                        <span className="font-data-label text-on-surface-variant uppercase">Nível de Risco</span>
                        <div className={`mt-2 font-data-display text-3xl uppercase ${resultColorClass[activeRiskLevel]}`}>{riskLabel[result?.risk_level ?? preview.riskLevel]}</div>
                    </div>
                    <div className="bg-surface-container border border-surface-border p-4 rounded-sm md:col-span-2">
                        <span className="font-data-label text-on-surface-variant uppercase">Janela de Ignição</span>
                        <div className="mt-2 text-on-surface font-data-display text-lg">{result?.ignition_window_utc ?? 'Aguardando cálculo'}</div>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-4">{result ? recommendationText[result.risk_level] : 'Ajuste os parâmetros da conjunção para solicitar uma recomendação da API.'}</p>
                        {result && <p className="font-data-label text-data-label text-outline mt-4">Pc residual: {result.residual_collision_probability.toExponential(2)}</p>}
                    </div>
                </div>
            </div>
        </main>
    );
};
