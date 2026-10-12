"""
Unit Tests for Advisor Domain Logic and API Endpoints
CSC 303: Software Engineering & AI Applications
"""

import pytest
from fastapi.testclient import TestClient
from src.app import app
from src.advisor_engine import AcademicAdvisorEngine


client = TestClient(app)


def test_advisor_engine_curriculum_catalog():
    engine = AcademicAdvisorEngine()
    for level in ["100L", "200L", "300L", "400L"]:
        assert level in engine.CURRICULUM_CATALOG
        assert len(engine.CURRICULUM_CATALOG[level]) >= 4


def test_advisor_retake_prioritization():
    engine = AcademicAdvisorEngine()
    courses = engine._recommend_courses_for_student(
        level="300L",
        track="Software Engineering",
        risk="High Risk",
        failed_count=2
    )
    # Check that retake priority exists
    types = [c["type"] for c in courses]
    assert "Deficiency Remediation" in types


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"


def test_api_default_student_profile():
    res = client.get("/api/student-profile/default")
    assert res.status_code == 200
    data = res.json()
    assert data["student_name"] == "Paul (CSC 303 Student)"
    assert data["academic_level"] == "300L"
    assert data["current_gpa"] > 3.0


def test_api_evaluate_endpoint():
    payload = {
        "academic_level": "300L",
        "specialization_track": "Software Engineering",
        "completed_credits": 78,
        "current_credit_load": 18,
        "current_gpa": 3.52,
        "core_cs_avg_grade": 3.60,
        "attendance_rate": 88.5,
        "study_hours_per_week": 20.0,
        "failed_courses_count": 0,
        "extracurricular_hours": 8.0,
        "stress_level": 2
    }
    res = client.post("/api/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_risk" in data
    assert "projected_next_gpa" in data
    assert "max_recommended_credits" in data
    assert "recommendations" in data
    assert "course_pathway" in data
