import { useEffect, useMemo, useState } from 'react';
import { api, type ConjunctionAlert, type Severity } from '../api';

const severityClass: Record<Severity, string> = {
    critical: 'border-status-critical bg-status-critical/10 text-status-critical',
    high: 'border-status-high bg-status-high/10 text-status-high',
    watch: 'border-status-high bg-status-high/10 text-status-high',
    nominal: 'border-status-nominal bg-status-nominal/10 text-status-nominal',
};

const severityLabel: Record<Severity, string> = {
    critical: 'crítico',
    high: 'alto',
    watch: 'atenção',
    nominal: 'nominal',
};

export const ConjunctionsPage = () => {
    const [items, setItems] = useState<ConjunctionAlert[]>([]);
    const [query, setQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.getConjunctions()
            .then(setItems)
            .catch((reason: Error) => setError(reason.message));
    }, []);

    const filteredItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return items;

        return items.filter((item) =>
            `${item.satellite_id} ${item.object_id} ${item.severity}`.toLowerCase().includes(normalizedQuery),
        );
    }, [items, query]);

    return (
        <main className="flex-1 md:ml-64 mt-16 flex flex-col min-w-0 bg-telemetry-bg overflow-hidden relative h-[calc(100vh-64px)]">
            <div className="border-b border-surface-border bg-surface flex flex-col sm:flex-row justify-between items-start sm:items-center p-gutter gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">radar</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Lista de Conjunções</h2>
                    <span className="bg-surface-container-high text-on-surface-variant font-data-label text-data-label px-2 py-1 rounded-sm border border-surface-border ml-2">
                        {items.length} ATIVOS
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                        <input
                            className="w-full bg-surface-container-low border border-surface-border rounded-sm text-on-surface font-data-label text-data-label pl-9 pr-3 py-2 focus:border-secondary focus:ring-1 focus:outline-none transition-colors"
                            placeholder="Buscar ID..."
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-gutter relative">
                <div className="bg-surface border border-surface-border rounded-sm relative z-10 w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-surface-container-low border-b border-surface-border font-data-label text-data-label text-on-surface-variant uppercase">
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3 font-medium">ID do Ativo</th>
                                <th className="p-3 font-medium">Objeto Envolvido</th>
                                <th className="p-3 font-medium">TCA (UTC)</th>
                                <th className="p-3 font-medium text-right">Dist. Min. (km)</th>
                                <th className="p-3 font-medium text-right">Pc</th>
                            </tr>
                        </thead>
                        <tbody className="font-data-label text-data-label text-on-surface divide-y divide-surface-border">
                            {filteredItems.map((item) => (
                                <tr className="hover:bg-surface-container-high transition-colors group" key={`${item.satellite_id}-${item.object_id}`}>
                                    <td className="p-3">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border ${severityClass[item.severity]}`}>
                                            <span className="material-symbols-outlined text-[14px] filled">warning</span>
                                            {severityLabel[item.severity].toUpperCase()}
                                        </div>
                                    </td>
                                    <td className="p-3 text-secondary">{item.satellite_id}</td>
                                    <td className="p-3 text-outline">{item.object_id}</td>
                                    <td className="p-3 font-data-display text-[14px]">{item.event_time_utc}</td>
                                    <td className="p-3 text-right font-data-display text-[16px]">{item.miss_distance_km.toFixed(3)}</td>
                                    <td className="p-3 text-right font-data-display text-[16px]">{item.collision_probability.toExponential(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {error && <div className="p-4 text-status-critical font-data-label">{error}</div>}
                </div>
            </div>
        </main>
    );
};
