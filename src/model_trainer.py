"""
CSC 303: Software Engineering & AI Applications
Project: Academic Advisor System
Module: Model Trainer & Pipeline Serializer (.pkl)
Author: Paul (Student Academic Advisor System)
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import classification_report, accuracy_score, mean_squared_error, r2_score


def generate_synthetic_academic_dataset(n_samples: int = 2500, random_state: int = 42) -> pd.DataFrame:
    """
    Synthesize realistic academic data modeling Computer Science undergraduate performance.
    Reflects authentic pedagogical dynamics: attendance correlation, credit load strain,
    study hours impact, and core course prerequisites.
    """
    np.random.seed(random_state)

    levels = ["100L", "200L", "300L", "400L"]
    tracks = [
        "Software Engineering",
        "Artificial Intelligence & Data Science",
        "Cybersecurity",
        "Networking & Systems"
    ]

    level_choices = np.random.choice(levels, size=n_samples, p=[0.25, 0.28, 0.27, 0.20])
    track_choices = np.random.choice(tracks, size=n_samples, p=[0.40, 0.30, 0.18, 0.12])

    # Completed credits based on level
    completed_credits = []
    for lvl in level_choices:
        if lvl == "100L":
            completed_credits.append(np.random.randint(0, 24))
        elif lvl == "200L":
            completed_credits.append(np.random.randint(24, 64))
        elif lvl == "300L":
            completed_credits.append(np.random.randint(64, 104))
        else:
            completed_credits.append(np.random.randint(104, 140))

    study_hours = np.clip(np.random.normal(loc=16, scale=7, size=n_samples), 2, 45)
    attendance_rate = np.clip(np.random.normal(loc=82, scale=14, size=n_samples), 35, 100)
    current_credit_load = np.random.choice([12, 15, 18, 21, 24], size=n_samples, p=[0.10, 0.25, 0.40, 0.18, 0.07])
    extracurricular_hours = np.clip(np.random.exponential(scale=6, size=n_samples), 0, 30)
    stress_level = np.clip(
        np.round(1 + (current_credit_load / 6) + (extracurricular_hours / 10) - (study_hours / 15) + np.random.normal(0, 0.8, n_samples)),
        1, 5
    ).astype(int)

    # Core CS GPA foundation
    base_ability = (study_hours / 35.0) * 1.5 + (attendance_rate / 100.0) * 1.8 - (stress_level / 5.0) * 0.5 + np.random.normal(0, 0.3, n_samples)
    current_gpa = np.clip(np.round(base_ability + 0.8, 2), 1.20, 4.00)
    core_cs_avg_grade = np.clip(np.round(current_gpa + np.random.normal(-0.1, 0.25, n_samples), 2), 1.00, 4.00)

    # Failed courses correlated with low attendance and low core grade
    failed_prob = np.clip((4.0 - core_cs_avg_grade) * 0.25 + (100 - attendance_rate) * 0.015, 0, 0.9)
    failed_courses = np.random.binomial(n=4, p=failed_prob / 4)

    # Target 1: Academic Standing / Risk Status
    # Low Risk (0): GPA >= 3.2, attendance >= 75%, failed == 0
    # Moderate Risk (1): GPA 2.4 - 3.19 or attendance 65-74% or failed == 1
    # High Risk (2): GPA < 2.4 or attendance < 65% or failed >= 2
    risk_labels = []
    projected_gpas = []

    for i in range(n_samples):
        g = current_gpa[i]
        att = attendance_rate[i]
        sh = study_hours[i]
        fc = failed_courses[i]
        load = current_credit_load[i]
        stress = stress_level[i]

        # Calculate projected next-term GPA
        delta = (sh - 15) * 0.03 + (att - 80) * 0.015 - (load - 18) * 0.04 - (fc * 0.15) - (stress - 3) * 0.05
        proj_gpa = np.clip(round(g + delta + np.random.normal(0, 0.12), 2), 1.00, 4.00)
        projected_gpas.append(proj_gpa)

        # Risk categorization
        if g < 2.30 or att < 65.0 or fc >= 2 or (load > 21 and g < 2.70):
            risk_labels.append("High Risk")
        elif g >= 3.30 and att >= 80.0 and fc == 0 and load <= 21:
            risk_labels.append("Low Risk")
        else:
            risk_labels.append("Moderate Risk")

    df = pd.DataFrame({
        "academic_level": level_choices,
        "specialization_track": track_choices,
        "completed_credits": completed_credits,
        "current_credit_load": current_credit_load,
        "current_gpa": current_gpa,
        "core_cs_avg_grade": core_cs_avg_grade,
        "attendance_rate": np.round(attendance_rate, 1),
        "study_hours_per_week": np.round(study_hours, 1),
        "failed_courses_count": failed_courses,
        "extracurricular_hours": np.round(extracurricular_hours, 1),
        "stress_level": stress_level,
        "risk_status": risk_labels,
        "projected_next_gpa": projected_gpas
    })

    return df


def build_and_train_advising_models(df: pd.DataFrame) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Construct, validate, and package the Scikit-learn AI pipelines.
    Uses ColumnTransformer and ensemble learning for optimal generalization.
    """
    categorical_features = ["academic_level", "specialization_track"]
    numeric_features = [
        "completed_credits",
        "current_credit_load",
        "current_gpa",
        "core_cs_avg_grade",
        "attendance_rate",
        "study_hours_per_week",
        "failed_courses_count",
        "extracurricular_hours",
        "stress_level"
    ]

    features = categorical_features + numeric_features
    X = df[features]
    y_class = df["risk_status"]
    y_reg = df["projected_next_gpa"]

    # Preprocessing Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features)
        ]
    )

    # 1. Classification Pipeline: Predicts Student Risk Tier
    classifier_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(
            n_estimators=160,
            max_depth=10,
            min_samples_split=4,
            random_state=42,
            class_weight="balanced"
        ))
    ])

    # 2. Regression Pipeline: Forecasts Next-Semester Projected GPA
    regressor_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", GradientBoostingRegressor(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=4,
            random_state=42
        ))
    ])

    # Train / Test Splitting (shared stratified indices)
    X_train, X_test, y_train_cls, y_test_cls, y_train_reg, y_test_reg = train_test_split(
        X, y_class, y_reg, test_size=0.20, random_state=42, stratify=y_class
    )

    # Fit models
    print("[*] Training Academic Risk Classifier (Random Forest)...")
    classifier_pipeline.fit(X_train, y_train_cls)

    print("[*] Training GPA Trajectory Regressor (Gradient Boosting)...")
    regressor_pipeline.fit(X_train, y_train_reg)

    # Evaluations
    cls_preds = classifier_pipeline.predict(X_test)
    cls_acc = float(accuracy_score(y_test_cls, cls_preds))
    cls_report = classification_report(y_test_cls, cls_preds, output_dict=True)

    reg_preds = regressor_pipeline.predict(X_test)
    reg_r2 = float(r2_score(y_test_reg, reg_preds))
    reg_rmse = float(np.sqrt(mean_squared_error(y_test_reg, reg_preds)))

    # Feature importances from random forest
    rf_model = classifier_pipeline.named_steps["classifier"]
    cat_encoder = classifier_pipeline.named_steps["preprocessor"].named_transformers_["cat"]
    encoded_cat_features = list(cat_encoder.get_feature_names_out(categorical_features))
    all_feature_names = numeric_features + encoded_cat_features
    importances = rf_model.feature_importances_

    feature_importance_dict = {
        name: round(float(imp), 4)
        for name, imp in sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)
    }

    metrics = {
        "classification_accuracy": round(cls_acc, 4),
        "classification_report": cls_report,
        "regression_r2": round(reg_r2, 4),
        "regression_rmse": round(reg_rmse, 4),
        "feature_importances": feature_importance_dict,
        "total_training_samples": len(df)
    }

    # Package payload for .pkl serialization
    model_artifact = {
        "metadata": {
            "course": "CSC 303: Software Engineering / AI Applications",
            "assignment": "Dr. Felix Academic Advisor System",
            "model_version": "1.0.0",
            "model_type": "Composite Ensemble (RandomForest + GradientBoosting)",
            "classes": list(classifier_pipeline.classes_),
            "numeric_features": numeric_features,
            "categorical_features": categorical_features
        },
        "classifier_pipeline": classifier_pipeline,
        "regressor_pipeline": regressor_pipeline,
        "metrics": metrics
    }

    return model_artifact, metrics


def save_artifact_pkl(artifact: Dict[str, Any], output_path: str) -> str:
    """Save the serialized pipeline artifact to .pkl file."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        pickle.dump(artifact, f, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"[+] Model artifact successfully exported to: {output_path}")
    return output_path


def main():
    print("==================================================================")
    print(" CSC 303: Academic Advisor AI Model Training Pipeline ")
    print("==================================================================")
    
    # 1. Generate & Save Dataset
    print("[1/4] Generating authentic academic advising dataset...")
    df = generate_synthetic_academic_dataset(n_samples=2500, random_state=42)
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    data_csv_path = os.path.join(data_dir, "academic_advising_dataset.csv")
    df.to_csv(data_csv_path, index=False)
    print(f"      Dataset saved to: {data_csv_path} ({len(df)} records)")

    # 2. Train Models & Compile Metrics
    print("[2/4] Training AI pipelines & calculating evaluation metrics...")
    artifact, metrics = build_and_train_advising_models(df)

    # 3. Export .pkl file
    print("[3/4] Serializing model pipeline to .PKL artifact...")
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    pkl_path = os.path.join(models_dir, "academic_advisor_model.pkl")
    save_artifact_pkl(artifact, pkl_path)

    # Also save metrics as readable JSON
    metrics_path = os.path.join(models_dir, "model_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"      Metrics metadata saved to: {metrics_path}")

    # 4. Summary
    print("[4/4] Validation Summary:")
    print(f"      - Classification Accuracy: {metrics['classification_accuracy'] * 100:.2f}%")
    print(f"      - GPA Regression R^2:      {metrics['regression_r2']:.4f}")
    print(f"      - Top Predictive Factors:  {list(metrics['feature_importances'].keys())[:4]}")
    print("==================================================================")
    print(" Training pipeline completed successfully.")


if __name__ == "__main__":
    main()
