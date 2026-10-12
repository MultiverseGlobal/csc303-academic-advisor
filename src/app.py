"""
CSC 303: Software Engineering & AI Applications
Project: Academic Advisor System
Module: Web Application Server (FastAPI Framework with .PKL Model Deployment)
Author: Paul (Student Academic Advisor System)
"""

import os
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.advisor_engine import AcademicAdvisorEngine
from src.model_trainer import main as train_model_pipeline

app = FastAPI(
    title="CSC 303 Academic Advisor AI System",
    description="Intelligent student advising system combining standard software engineering and AI techniques.",
    version="1.0.0"
)

# Enable CORS for local testing and web integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Advisor Engine with .pkl artifact
engine = AcademicAdvisorEngine()

# Path to static web assets
WEB_DIR = os.path.join(os.path.dirname(__file__), "..", "web")
os.makedirs(WEB_DIR, exist_ok=True)


class StudentProfileInput(BaseModel):
    academic_level: str = Field(default="300L", description="Current academic year level")
    specialization_track: str = Field(default="Software Engineering", description="Degree concentration")
    completed_credits: int = Field(default=78, ge=0, le=160, description="Cumulative credit units passed")
    current_credit_load: int = Field(default=18, ge=6, le=30, description="Credits registered this term")
    current_gpa: float = Field(default=4.18, ge=0.0, le=5.0, description="Cumulative Grade Point Average (5.0 Scale)")
    core_cs_avg_grade: float = Field(default=4.25, ge=0.0, le=5.0, description="Average grade in core CS courses")
    attendance_rate: float = Field(default=88.5, ge=0.0, le=100.0, description="Lecture & lab attendance percentage")
    study_hours_per_week: float = Field(default=20.0, ge=0.0, le=60.0, description="Weekly independent study hours")
    failed_courses_count: int = Field(default=0, ge=0, le=10, description="Outstanding unpassed courses")
    extracurricular_hours: float = Field(default=8.0, ge=0.0, le=40.0, description="Weekly clubs, sports, work hours")
    stress_level: int = Field(default=2, ge=1, le=5, description="Subjective stress rating (1-5)")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CSC 303 Academic Advisor System",
        "grading_scale": "5.0 CGPA",
        "model_loaded": engine.is_model_loaded(),
        "model_file": engine.pkl_model_path
    }


@app.get("/api/model-info")
def get_model_info():
    """Retrieve metadata, accuracy metrics, and feature importances from deployed .pkl model."""
    return engine.get_model_metadata()


@app.get("/api/student-profile/default")
def get_default_student_profile():
    """Returns a realistic default profile for Paul (CSC 303 student) calibrated on 5.0 scale."""
    return {
        "student_name": "Paul (CSC 303 Student)",
        "matric_number": "CSC/2022/303",
        "department": "Computer Science",
        "academic_level": "300L",
        "specialization_track": "Software Engineering",
        "completed_credits": 78,
        "current_credit_load": 18,
        "current_gpa": 4.18,
        "core_cs_avg_grade": 4.25,
        "attendance_rate": 88.5,
        "study_hours_per_week": 20.0,
        "failed_courses_count": 0,
        "extracurricular_hours": 8.0,
        "stress_level": 2
    }


@app.post("/api/evaluate")
def evaluate_student(profile: StudentProfileInput):
    """
    Main advising inference endpoint:
    Processes student data through Scikit-learn .pkl pipeline and returns risk tier,
    GPA projection, diagnostic analysis, and course pathway recommendations.
    """
    try:
        results = engine.evaluate_student(profile.model_dump())
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/api/retrain")
def retrain_model():
    """Trigger model training pipeline and hot-reload the .pkl artifact into memory."""
    try:
        train_model_pipeline()
        engine.reload_model()
        return {
            "status": "success",
            "message": "Model retrained and reloaded into active memory.",
            "metrics": engine.get_model_metadata().get("metrics")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")


@app.get("/api/curriculum")
def get_curriculum():
    """Returns full curriculum course catalog."""
    return {
        "catalog": engine.CURRICULUM_CATALOG,
        "electives": engine.TRACK_RECOMMENDED_ELECTIVES
    }


# Static web assets routing
@app.get("/")
def serve_index():
    index_file = os.path.join(WEB_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return JSONResponse({"message": "Academic Advisor API is running. UI file is being generated."})


# Mount remaining static files if directory exists
app.mount("/static", StaticFiles(directory=WEB_DIR), name="static")
