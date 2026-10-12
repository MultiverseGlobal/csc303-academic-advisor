"""
Unit Tests for Machine Learning Pipeline & Model Serialization
CSC 303: Software Engineering & AI Applications
"""

import os
import pytest
import numpy as np
import pandas as pd
from src.model_trainer import (
    generate_synthetic_academic_dataset,
    build_and_train_advising_models,
    save_artifact_pkl
)
from src.advisor_engine import AcademicAdvisorEngine


def test_synthetic_dataset_generation():
    df = generate_synthetic_academic_dataset(n_samples=200, random_state=42)
    assert len(df) == 200
    assert "current_gpa" in df.columns
    assert "attendance_rate" in df.columns
    assert "risk_status" in df.columns
    assert "projected_next_gpa" in df.columns
    
    # Check boundaries
    assert df["current_gpa"].min() >= 1.0
    assert df["current_gpa"].max() <= 4.0
    assert df["attendance_rate"].min() >= 0.0
    assert df["attendance_rate"].max() <= 100.0
    assert set(df["risk_status"].unique()).issubset({"Low Risk", "Moderate Risk", "High Risk"})


def test_model_training_and_serialization(tmp_path):
    df = generate_synthetic_academic_dataset(n_samples=300, random_state=42)
    artifact, metrics = build_and_train_advising_models(df)
    
    assert "classifier_pipeline" in artifact
    assert "regressor_pipeline" in artifact
    assert metrics["classification_accuracy"] > 0.80
    assert metrics["regression_r2"] > 0.60

    # Save to temp path
    test_pkl = os.path.join(tmp_path, "test_model.pkl")
    save_artifact_pkl(artifact, test_pkl)
    assert os.path.exists(test_pkl)

    # Test loading via engine
    engine = AcademicAdvisorEngine(pkl_model_path=test_pkl)
    assert engine.is_model_loaded() is True


def test_model_inference_logic(tmp_path):
    df = generate_synthetic_academic_dataset(n_samples=300, random_state=42)
    artifact, _ = build_and_train_advising_models(df)
    test_pkl = os.path.join(tmp_path, "inference_model.pkl")
    save_artifact_pkl(artifact, test_pkl)

    engine = AcademicAdvisorEngine(pkl_model_path=test_pkl)

    # High performing student
    star_student = {
        "academic_level": "300L",
        "specialization_track": "Software Engineering",
        "completed_credits": 80,
        "current_credit_load": 18,
        "current_gpa": 3.90,
        "core_cs_avg_grade": 3.95,
        "attendance_rate": 96.0,
        "study_hours_per_week": 26.0,
        "failed_courses_count": 0,
        "stress_level": 1
    }
    eval_star = engine.evaluate_student(star_student)
    assert eval_star["predicted_risk"] == "Low Risk"
    assert eval_star["max_recommended_credits"] >= 20

    # At-risk student
    struggling_student = {
        "academic_level": "200L",
        "specialization_track": "Networking & Systems",
        "completed_credits": 30,
        "current_credit_load": 24,
        "current_gpa": 1.85,
        "core_cs_avg_grade": 1.70,
        "attendance_rate": 45.0,
        "study_hours_per_week": 4.0,
        "failed_courses_count": 3,
        "stress_level": 5
    }
    eval_struggling = engine.evaluate_student(struggling_student)
    assert eval_struggling["predicted_risk"] == "High Risk"
    assert eval_struggling["max_recommended_credits"] <= 15
    assert len(eval_struggling["diagnostics"]) >= 2
