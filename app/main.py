from __future__ import annotations

import os
from math import exp, log10
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, Response
from pydantic import BaseModel, Field


APP_NAME = "Orbit Guard"
VERSION = "0.1.0"
TEAM_ID = "RM99781"
ODS = "ODS 9 - Industry, Innovation and Infrastructure"
BASE_IGNITION_TIME = datetime(2026, 6, 3, 12, 0, tzinfo=timezone.utc)
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


class EvasionRoutingRequest(BaseModel):
    satellite_id: str = Field(..., min_length=3, max_length=40, pattern=r"^[A-Za-z0-9_.:-]+$")
    miss_distance_km: float = Field(..., ge=0.01, le=100.0)
    relative_velocity_kms: float = Field(..., ge=0.01, le=20.0)
    collision_probability: float = Field(..., ge=0.0, le=1.0)


class ManeuverRecommendation(BaseModel):
    satellite_id: str
    risk_level: Literal["nominal", "watch", "high", "critical"]
    maneuver_recommendation: str
    ignition_window_utc: str
    estimated_delta_v_ms: float
    risk_reduction_percent: float
    residual_collision_probability: float
    explanation: str


def deterministic_conjunction_alerts() -> list[dict[str, object]]:
    return [
        {
            "satellite_id": "AEO-LEO-104",
            "object_id": "DEBRIS-1998-067QZ",
            "event_time_utc": "2026-06-03T14:35:00Z",
            "miss_distance_km": 0.42,
            "relative_velocity_kms": 12.8,
            "collision_probability": 0.00031,
            "severity": "critical",
        },
        {
            "satellite_id": "AEO-LEO-118",
            "object_id": "ROCKET-BODY-2015-021B",
            "event_time_utc": "2026-06-04T02:10:00Z",
            "miss_distance_km": 1.9,
            "relative_velocity_kms": 9.4,
            "collision_probability": 0.00008,
            "severity": "watch",
        },
        {
            "satellite_id": "AEO-IOT-022",
            "object_id": "DEBRIS-2020-061AF",
            "event_time_utc": "2026-06-04T19:45:00Z",
            "miss_distance_km": 4.6,
            "relative_velocity_kms": 7.1,
            "collision_probability": 0.000015,
            "severity": "nominal",
        },
    ]


def classify_risk(miss_distance_km: float, collision_probability: float) -> str:
    if collision_probability >= 1e-4 or miss_distance_km < 0.75:
        return "critical"
    if collision_probability >= 5e-5 or miss_distance_km < 2.0:
        return "high"
    if collision_probability >= 1e-5 or miss_distance_km < 5.0:
        return "watch"
    return "nominal"


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def estimate_risk_reduction_percent(payload: EvasionRoutingRequest, delta_v_ms: float) -> float:
    pc_pressure = clamp((log10(max(payload.collision_probability, 1e-9)) + 9.0) / 6.0, 0.0, 1.0)
    miss_pressure = clamp((5.0 - payload.miss_distance_km) / 5.0, 0.0, 1.0)
    velocity_pressure = clamp(payload.relative_velocity_kms / 20.0, 0.0, 1.0)

    modeled_miss_gain_km = delta_v_ms * (0.24 + payload.relative_velocity_kms * 0.028)
    required_gain_km = 0.35 + payload.miss_distance_km * 0.42 + velocity_pressure * 1.2 + pc_pressure * 0.75
    maneuver_effectiveness = 1.0 - exp(-modeled_miss_gain_km / required_gain_km)
    scenario_penalty = pc_pressure * 4.5 + miss_pressure * 2.5 + velocity_pressure * 2.0

    return round(clamp(28.0 + maneuver_effectiveness * 72.0 - scenario_penalty, 12.0, 97.5), 1)


def build_recommendation(payload: EvasionRoutingRequest) -> ManeuverRecommendation:
    risk_level = classify_risk(payload.miss_distance_km, payload.collision_probability)
    risk_factor = {
        "nominal": 0.35,
        "watch": 0.55,
        "high": 0.78,
        "critical": 0.92,
    }[risk_level]

    delta_v = round(
        max(0.08, min(4.5, payload.relative_velocity_kms * risk_factor / max(payload.miss_distance_km, 0.2))),
        3,
    )
    reduction = estimate_risk_reduction_percent(payload, delta_v)
    residual_pc = round(payload.collision_probability * (1 - reduction / 100), 10)
    satellite_offset = sum(ord(char) for char in payload.satellite_id) % 90
    urgency_offset = {"critical": 18, "high": 36, "watch": 72, "nominal": 180}[risk_level]
    start = BASE_IGNITION_TIME + timedelta(minutes=urgency_offset + satellite_offset)
    end = start + timedelta(minutes=12)

    if risk_level in {"critical", "high"}:
        maneuver = "Execute along-track prograde avoidance burn with post-burn tracking confirmation."
    elif risk_level == "watch":
        maneuver = "Prepare contingency burn plan and request one more tracking update before ignition."
    else:
        maneuver = "No burn required; keep conjunction under routine SSA monitoring."

    explanation = (
        f"{payload.satellite_id} has {risk_level} conjunction risk from miss distance "
        f"{payload.miss_distance_km:.2f} km, relative velocity {payload.relative_velocity_kms:.2f} km/s, "
        f"and Pc {payload.collision_probability:.2e}. Recommendation minimizes fuel while widening miss distance."
    )

    return ManeuverRecommendation(
        satellite_id=payload.satellite_id,
        risk_level=risk_level,
        maneuver_recommendation=maneuver,
        ignition_window_utc=f"{start.isoformat().replace('+00:00', 'Z')}/{end.isoformat().replace('+00:00', 'Z')}",
        estimated_delta_v_ms=delta_v,
        risk_reduction_percent=reduction,
        residual_collision_probability=residual_pc,
        explanation=explanation,
    )


app = FastAPI(
    title="Orbit Guard SSA API",
    description="Deterministic Space Situational Awareness MVP for orbital conjunction monitoring and evasion routing.",
    version=VERSION,
)


@app.get("/", include_in_schema=False)
def root_app() -> RedirectResponse:
    return RedirectResponse(url="/app/", status_code=307)


@app.get("/dashboard", include_in_schema=False)
def legacy_dashboard_redirect() -> RedirectResponse:
    return RedirectResponse(url="/app/", status_code=307)


def frontend_response(path: str = "index.html") -> Response:
    if not FRONTEND_DIST.exists():
        return HTMLResponse(
            "<h1>Orbit Guard frontend build is not available.</h1><p>Run the frontend build before deployment.</p>",
            status_code=503,
        )

    requested = (FRONTEND_DIST / path).resolve()
    if FRONTEND_DIST not in requested.parents and requested != FRONTEND_DIST:
        requested = FRONTEND_DIST / "index.html"

    if requested.is_file():
        return FileResponse(requested)

    return FileResponse(FRONTEND_DIST / "index.html")


@app.get("/app", include_in_schema=False)
def frontend_app() -> Response:
    return frontend_response()


@app.get("/app/{path:path}", include_in_schema=False)
def frontend_app_path(path: str) -> Response:
    return frontend_response(path)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": APP_NAME, "version": VERSION}


@app.get("/api/status")
def status() -> dict[str, object]:
    return {
        "service": APP_NAME,
        "version": VERSION,
        "team": TEAM_ID,
        "mission": "Space Situational Awareness for orbital conjunction monitoring",
        "ods": ODS,
        "config": {
            "mock_token_secret_name": os.getenv("SSA_API_MOCK_TOKEN_SECRET_NAME", "SSA-API-MOCK-TOKEN"),
            "key_vault_configured": bool(os.getenv("KEY_VAULT_NAME")),
            "application_insights_configured": bool(
                os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING") or os.getenv("APPINSIGHTS_INSTRUMENTATIONKEY")
            ),
            "external_api_mode": "disabled-deterministic-simulation",
        },
        "azure_readiness": {
            "app_service_ready": True,
            "health_endpoint": "/health",
            "startup_command": "startup.sh",
            "managed_identity_expected": True,
        },
        "simulated_alert_count": len(deterministic_conjunction_alerts()),
    }


@app.get("/api/conjunctions")
def conjunctions() -> dict[str, object]:
    return {"items": deterministic_conjunction_alerts(), "source": "deterministic-simulation"}


@app.post("/api/evasion-routing", response_model=ManeuverRecommendation)
def evasion_routing(payload: EvasionRoutingRequest) -> ManeuverRecommendation:
    return build_recommendation(payload)
