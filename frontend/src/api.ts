const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? window.location.origin;
export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, '');

export type Severity = 'nominal' | 'watch' | 'high' | 'critical';

export type ConjunctionAlert = {
  satellite_id: string;
  object_id: string;
  event_time_utc: string;
  miss_distance_km: number;
  relative_velocity_kms: number;
  collision_probability: number;
  severity: Severity;
};

export type StatusResponse = {
  service: string;
  version: string;
  team: string;
  mission: string;
  ods: string;
  config: Record<string, unknown>;
  azure_readiness: Record<string, unknown>;
  simulated_alert_count: number;
};

export type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

export type EvasionRoutingRequest = {
  satellite_id: string;
  miss_distance_km: number;
  relative_velocity_kms: number;
  collision_probability: number;
};

export type ManeuverRecommendation = {
  satellite_id: string;
  risk_level: Severity;
  maneuver_recommendation: string;
  ignition_window_utc: string;
  estimated_delta_v_ms: number;
  risk_reduction_percent: number;
  residual_collision_probability: number;
  explanation: string;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Requisição falhou com status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getHealth: () => requestJson<HealthResponse>('/health'),
  getStatus: () => requestJson<StatusResponse>('/api/status'),
  getConjunctions: async () => {
    const payload = await requestJson<{ items: ConjunctionAlert[]; source: string }>('/api/conjunctions');
    return payload.items;
  },
  calculateEvasion: (payload: EvasionRoutingRequest) =>
    requestJson<ManeuverRecommendation>('/api/evasion-routing', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
