from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["service"] == "Orbit Guard"


def test_legacy_pages_redirect_to_frontend() -> None:
    landing = client.get("/", follow_redirects=False)
    assert landing.status_code == 307
    assert landing.headers["location"] == "/app/"

    dashboard = client.get("/dashboard", follow_redirects=False)
    assert dashboard.status_code == 307
    assert dashboard.headers["location"] == "/app/"


def test_status() -> None:
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Orbit Guard"
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
    assert data["risk_reduction_percent"] > 60
    assert data["ignition_window_utc"] == "2026-06-03T13:04:00Z/2026-06-03T13:16:00Z"
    assert data["residual_collision_probability"] < 0.00031


def test_evasion_routing_reduction_varies_with_scenario() -> None:
    critical = client.post(
        "/api/evasion-routing",
        json={
            "satellite_id": "AEO-LEO-104",
            "miss_distance_km": 0.42,
            "relative_velocity_kms": 12.8,
            "collision_probability": 0.00031,
        },
    ).json()
    watch = client.post(
        "/api/evasion-routing",
        json={
            "satellite_id": "AEO-IOT-022",
            "miss_distance_km": 4.6,
            "relative_velocity_kms": 7.1,
            "collision_probability": 0.000015,
        },
    ).json()

    assert critical["risk_reduction_percent"] != watch["risk_reduction_percent"]
    assert critical["risk_reduction_percent"] > watch["risk_reduction_percent"]


def test_evasion_routing_reduction_changes_inside_same_risk_level() -> None:
    base_payload = {
        "satellite_id": "AEO-LEO-104",
        "miss_distance_km": 0.42,
        "relative_velocity_kms": 12.8,
        "collision_probability": 0.00031,
    }
    base = client.post("/api/evasion-routing", json=base_payload).json()
    farther = client.post("/api/evasion-routing", json={**base_payload, "miss_distance_km": 0.55}).json()
    slower = client.post("/api/evasion-routing", json={**base_payload, "relative_velocity_kms": 10.0}).json()

    assert base["risk_level"] == farther["risk_level"] == slower["risk_level"] == "critical"
    assert len(
        {
            base["risk_reduction_percent"],
            farther["risk_reduction_percent"],
            slower["risk_reduction_percent"],
        }
    ) == 3


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
