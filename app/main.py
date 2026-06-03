from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse, Response
from pydantic import BaseModel, Field


APP_NAME = "AegisOrbit"
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
    reduction = round(min(96.5, 45.0 + risk_factor * 45.0), 1)
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
    title="AegisOrbit SSA API",
    description="Deterministic Space Situational Awareness MVP for orbital conjunction monitoring and evasion routing.",
    version=VERSION,
)


def page_shell(title: str, body: str) -> str:
    return f"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    body {{ margin: 0; font-family: Arial, sans-serif; color: #e8eef8; background: #07111f; }}
    header, main {{ max-width: 1080px; margin: 0 auto; padding: 28px; }}
    nav a {{ color: #8fd3ff; margin-right: 18px; text-decoration: none; font-weight: 700; }}
    .hero {{ padding: 56px 28px 18px; background: linear-gradient(135deg, #0a223d, #123024); border-bottom: 1px solid #28435f; }}
    h1 {{ font-size: 44px; margin: 0 0 12px; }}
    h2 {{ color: #b8dcff; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }}
    .card {{ border: 1px solid #2b4866; border-radius: 8px; padding: 18px; background: #0b1b2e; }}
    .metric {{ font-size: 28px; font-weight: 700; color: #9ff0c8; }}
    .critical {{ color: #ff9c9c; }}
    .watch {{ color: #ffd37a; }}
    code {{ background: #10243b; padding: 2px 6px; border-radius: 4px; }}
  </style>
</head>
<body>
  <div class="hero">
    <header>
      <nav><a href="/">Landing</a><a href="/dashboard">Dashboard</a><a href="/docs">API Docs</a></nav>
      <h1>{title}</h1>
    </header>
  </div>
  <main>{body}</main>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
def landing() -> str:
    body = """
<section class="grid">
  <div class="card">
    <h2>Purpose</h2>
    <p>AegisOrbit is a Space Situational Awareness MVP for satellite operators and SSA teams. It simulates orbital catalog ingestion, conjunction risk scoring, and evasion-routing recommendations for LEO assets.</p>
  </div>
  <div class="card">
    <h2>Team</h2>
    <p>Team identifier: <strong>RM99781</strong>.</p>
  </div>
  <div class="card">
    <h2>Problem</h2>
    <p>Growing satellite constellations and debris increase collision risk, fuel waste, and Kessler Syndrome exposure. Operators need fast, explainable maneuver support.</p>
  </div>
  <div class="card">
    <h2>ODS 9</h2>
    <p>Protects critical orbital infrastructure through resilient software, monitoring, and realistic cloud deployment on Azure App Service.</p>
  </div>
</section>
"""
    return page_shell(APP_NAME, body)


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard() -> str:
    rows = ""
    for alert in deterministic_conjunction_alerts():
        severity = str(alert["severity"])
        rows += f"""
  <div class="card">
    <h2>{alert["satellite_id"]}</h2>
    <p>Conjunction object: <code>{alert["object_id"]}</code></p>
    <p>Event: {alert["event_time_utc"]}</p>
    <p class="metric {severity}">{alert["miss_distance_km"]} km miss distance</p>
    <p>{alert["relative_velocity_kms"]} km/s relative velocity | Pc {alert["collision_probability"]}</p>
    <p>Severity: <strong class="{severity}">{severity}</strong></p>
  </div>
"""
    body = f"""
<p>Deterministic simulated conjunction alerts for LEO assets. Data is fixed for demos and tests; no external API required.</p>
<section class="grid">{rows}</section>
"""
    return page_shell("AegisOrbit Operations Dashboard", body)


def frontend_response(path: str = "index.html") -> Response:
    if not FRONTEND_DIST.exists():
        return HTMLResponse(
            "<h1>AegisOrbit frontend build is not available.</h1><p>Run the frontend build before deployment.</p>",
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
