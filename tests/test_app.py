from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["service"] == "AegisOrbit"


def test_landing_and_dashboard_pages() -> None:
    landing = client.get("/")
    assert landing.status_code == 200
    assert "AegisOrbit" in landing.text
    assert "RM99781" in landing.text
    assert "ODS 9" in landing.text

    dashboard = client.get("/dashboard")
    assert dashboard.status_code == 200
    assert "AEO-LEO-104" in dashboard.text
    assert "DEBRIS-1998-067QZ" in dashboard.text


def test_status() -> None:
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "AegisOrbit"
    assert data["team"] == "RM99781"
    assert data["config"]["external_api_mode"] == "disabled-deterministic-simulation"
    assert data["azure_readiness"]["app_service_ready"] is True


def test_conjunctions_feed() -> None:
    response = client.get("/api/conjunctions")
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "deterministic-simulation"
    assert len(data["items"]) == 3
    assert data["items"][0]["severity"] == "critical"


def test_evasion_routing_critical() -> None:
    response = client.post(
        "/api/evasion-routing",
        json={
            "satellite_id": "AEO-LEO-104",
            "miss_distance_km": 0.42,
            "relative_velocity_kms": 12.8,
            "collision_probability": 0.00031,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["satellite_id"] == "AEO-LEO-104"
    assert data["risk_level"] == "critical"
    assert data["estimated_delta_v_ms"] > 0
    assert data["risk_reduction_percent"] > 80
    assert data["ignition_window_utc"] == "2026-06-03T13:04:00Z/2026-06-03T13:16:00Z"
    assert data["residual_collision_probability"] < 0.00031


def test_evasion_routing_validation() -> None:
    response = client.post(
        "/api/evasion-routing",
        json={
            "satellite_id": "bad id with spaces",
            "miss_distance_km": -1,
            "relative_velocity_kms": 30,
            "collision_probability": 2,
        },
    )
    assert response.status_code == 422
