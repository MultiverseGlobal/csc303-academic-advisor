"""
CSC 303: Software Engineering & AI Applications
Project: Academic Advisor System
Module: Advisor Engine (Domain Logic, Curriculum Pathway & Personalized Recommendations)
Author: Paul (Student Academic Advisor System)
"""

import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional


class AcademicAdvisorEngine:
    """
    Intelligent Academic Advisor Domain Engine combining machine learning inference (.pkl)
    with rule-based degree progression and prerequisite audits.
    """

    CURRICULUM_CATALOG = {
        "100L": [
            {"code": "CSC 101", "title": "Introduction to Computer Science", "credits": 3, "prereq": []},
            {"code": "CSC 102", "title": "Algorithmic Problem Solving", "credits": 3, "prereq": ["CSC 101"]},
            {"code": "MAT 101", "title": "Calculus for Computing I", "credits": 3, "prereq": []},
            {"code": "MAT 102", "title": "Linear Algebra for CS", "credits": 3, "prereq": []},
            {"code": "GST 101", "title": "Use of English & Communication", "credits": 2, "prereq": []},
            {"code": "PHY 101", "title": "General Physics for Engineers", "credits": 3, "prereq": []}
        ],
        "200L": [
            {"code": "CSC 201", "title": "Data Structures & Algorithms", "credits": 4, "prereq": ["CSC 102"]},
            {"code": "CSC 202", "title": "Computer Architecture & Organization", "credits": 3, "prereq": ["CSC 101"]},
            {"code": "CSC 205", "title": "Object-Oriented Programming (Java/Python)", "credits": 3, "prereq": ["CSC 102"]},
            {"code": "MAT 201", "title": "Discrete Mathematics & Graph Theory", "credits": 3, "prereq": ["MAT 102"]},
            {"code": "CSC 204", "title": "Web Technologies & Internet Computing", "credits": 3, "prereq": ["CSC 101"]}
        ],
        "300L": [
            {"code": "CSC 301", "title": "Operating Systems & Concurrency", "credits": 4, "prereq": ["CSC 201", "CSC 202"]},
            {"code": "CSC 303", "title": "Software Engineering Methodologies", "credits": 4, "prereq": ["CSC 201", "CSC 205"]},
            {"code": "CSC 305", "title": "Database Management Systems & SQL", "credits": 3, "prereq": ["CSC 201"]},
            {"code": "CSC 307", "title": "Introduction to Artificial Intelligence", "credits": 3, "prereq": ["CSC 201", "MAT 201"]},
            {"code": "CSC 309", "title": "Computer Networks & Protocol Design", "credits": 3, "prereq": ["CSC 202"]}
        ],
        "400L": [
            {"code": "CSC 401", "title": "Distributed Systems & Cloud Computing", "credits": 3, "prereq": ["CSC 301", "CSC 309"]},
            {"code": "CSC 403", "title": "Compiler Construction & Formal Languages", "credits": 3, "prereq": ["CSC 201", "CSC 301"]},
            {"code": "CSC 499", "title": "Final Year Capstone Research Project", "credits": 6, "prereq": ["CSC 303"]},
            {"code": "CSC 411", "title": "Machine Learning & Neural Networks (Elective)", "credits": 3, "prereq": ["CSC 307"]},
            {"code": "CSC 415", "title": "Cybersecurity & Cryptography (Elective)", "credits": 3, "prereq": ["CSC 309"]}
        ]
    }

    TRACK_RECOMMENDED_ELECTIVES = {
        "Software Engineering": [
            {"code": "CSC 303", "title": "Software Engineering (Core)", "credits": 4},
            {"code": "SWE 302", "title": "Software Design Patterns & Clean Architecture", "credits": 3},
            {"code": "SWE 404", "title": "DevOps, CI/CD & Microservices Engineering", "credits": 3}
        ],
        "Artificial Intelligence & Data Science": [
            {"code": "CSC 307", "title": "Intro to Artificial Intelligence (Core)", "credits": 3},
            {"code": "DSC 302", "title": "Data Mining & Predictive Modeling", "credits": 3},
            {"code": "CSC 411", "title": "Deep Learning & NLP Systems", "credits": 3}
        ],
        "Cybersecurity": [
            {"code": "CSC 309", "title": "Computer Networks (Core)", "credits": 3},
            {"code": "CYB 301", "title": "Ethical Hacking & Network Defense", "credits": 3},
            {"code": "CSC 415", "title": "Applied Cryptography & Secure Coding", "credits": 3}
        ],
        "Networking & Systems": [
            {"code": "CSC 301", "title": "Operating Systems (Core)", "credits": 4},
            {"code": "NET 304", "title": "Network Administration & Cloud Virtualization", "credits": 3},
            {"code": "CSC 401", "title": "Distributed Systems & Scalability", "credits": 3}
        ]
    }

    def __init__(self, pkl_model_path: Optional[str] = None):
        self.pkl_model_path = pkl_model_path or os.path.join(
            os.path.dirname(__file__), "..", "models", "academic_advisor_model.pkl"
        )
        self.model_artifact: Optional[Dict[str, Any]] = None
        self._load_model()

    def _load_model(self):
        """Load trained Scikit-learn pipeline from serialized .pkl file."""
        if os.path.exists(self.pkl_model_path):
            with open(self.pkl_model_path, "rb") as f:
                self.model_artifact = pickle.load(f)
            print(f"[AcademicAdvisorEngine] Model successfully loaded from {self.pkl_model_path}")
        else:
            print(f"[AcademicAdvisorEngine] Warning: .pkl model not found at {self.pkl_model_path}. Running with heuristics until model is trained.")

    def reload_model(self):
        """Hot reload .pkl model after training."""
        self._load_model()

    def is_model_loaded(self) -> bool:
        return self.model_artifact is not None

    def get_model_metadata(self) -> Dict[str, Any]:
        if not self.model_artifact:
            return {"status": "Model not loaded", "model_path": self.pkl_model_path}
        return {
            "status": "Ready",
            "model_path": self.pkl_model_path,
            "metadata": self.model_artifact.get("metadata", {}),
            "metrics": self.model_artifact.get("metrics", {})
        }

    def evaluate_student(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive evaluation running AI inference (.pkl pipeline) and generating
        actionable advice, feature explanations, and degree trajectory.
        """
        # Format input DataFrame
        input_row = {
            "academic_level": student_data.get("academic_level", "300L"),
            "specialization_track": student_data.get("specialization_track", "Software Engineering"),
            "completed_credits": int(student_data.get("completed_credits", 75)),
            "current_credit_load": int(student_data.get("current_credit_load", 18)),
            "current_gpa": float(student_data.get("current_gpa", 3.45)),
            "core_cs_avg_grade": float(student_data.get("core_cs_avg_grade", 3.40)),
            "attendance_rate": float(student_data.get("attendance_rate", 85.0)),
            "study_hours_per_week": float(student_data.get("study_hours_per_week", 18.0)),
            "failed_courses_count": int(student_data.get("failed_courses_count", 0)),
            "extracurricular_hours": float(student_data.get("extracurricular_hours", 8.0)),
            "stress_level": int(student_data.get("stress_level", 2))
        }

        df_input = pd.DataFrame([input_row])

        # Inference via .pkl pipelines
        if self.model_artifact:
            clf = self.model_artifact["classifier_pipeline"]
            reg = self.model_artifact["regressor_pipeline"]

            predicted_risk = str(clf.predict(df_input)[0])
            probabilities = clf.predict_proba(df_input)[0]
            classes = list(clf.classes_)
            prob_dict = {cls: round(float(p) * 100, 1) for cls, p in zip(classes, probabilities)}

            projected_gpa = float(reg.predict(df_input)[0])
            projected_gpa = max(1.0, min(4.0, round(projected_gpa, 2)))
        else:
            # Fallback heuristic if .pkl not yet trained
            gpa = input_row["current_gpa"]
            att = input_row["attendance_rate"]
            fc = input_row["failed_courses_count"]
            if gpa < 2.3 or att < 65 or fc >= 2:
                predicted_risk = "High Risk"
                prob_dict = {"High Risk": 85.0, "Moderate Risk": 12.0, "Low Risk": 3.0}
            elif gpa >= 3.3 and att >= 80 and fc == 0:
                predicted_risk = "Low Risk"
                prob_dict = {"Low Risk": 88.0, "Moderate Risk": 10.0, "High Risk": 2.0}
            else:
                predicted_risk = "Moderate Risk"
                prob_dict = {"Moderate Risk": 75.0, "Low Risk": 15.0, "High Risk": 10.0}
            projected_gpa = max(1.0, min(4.0, round(gpa + 0.05, 2)))

        gpa_delta = round(projected_gpa - input_row["current_gpa"], 2)

        # Max recommended credit load calculation
        if predicted_risk == "High Risk":
            max_recommended_credits = 15
            risk_badge_class = "danger"
            standing_summary = "Urgent Academic Intervention Required"
        elif predicted_risk == "Moderate Risk":
            max_recommended_credits = 18
            risk_badge_class = "warning"
            standing_summary = "Good Progress, Targeted Optimization Needed"
        else:
            max_recommended_credits = 22
            risk_badge_class = "success"
            standing_summary = "Exemplary Academic Standing (Dean's List Track)"

        # Diagnostic Risk Factor Identification
        diagnostics = []
        if input_row["attendance_rate"] < 75.0:
            diagnostics.append({
                "factor": "Low Attendance Rate",
                "severity": "High",
                "detail": f"Class attendance is {input_row['attendance_rate']}%. Department standard requires >= 75% for exam eligibility."
            })
        if input_row["study_hours_per_week"] < 12.0:
            diagnostics.append({
                "factor": "Insufficient Self-Study Time",
                "severity": "Medium",
                "detail": f"Logged {input_row['study_hours_per_week']} hrs/week. Recommended ratio is 2 hours of private study per lecture unit."
            })
        if input_row["current_credit_load"] > max_recommended_credits:
            diagnostics.append({
                "factor": "Course Overload Warning",
                "severity": "High",
                "detail": f"Current load of {input_row['current_credit_load']} credits exceeds recommended safety threshold ({max_recommended_credits} units)."
            })
        if input_row["failed_courses_count"] > 0:
            diagnostics.append({
                "factor": "Outstanding Deficiencies / Retakes",
                "severity": "High",
                "detail": f"{input_row['failed_courses_count']} failed course(s) require immediate remediation to prevent graduation deferral."
            })
        if input_row["stress_level"] >= 4:
            diagnostics.append({
                "factor": "High Academic Stress & Burnout Risk",
                "severity": "Medium",
                "detail": "Elevated cognitive stress can degrade semester retention and test performance."
            })
        if not diagnostics:
            diagnostics.append({
                "factor": "Optimal Metrics",
                "severity": "Low",
                "detail": "All key academic indices (attendance, study pacing, credit balance) are within target ranges."
            })

        # Actionable Advising Recommendations
        recommendations = self._generate_recommendations(input_row, predicted_risk, max_recommended_credits)

        # Course Pathway Recommendations
        recommended_courses = self._recommend_courses_for_student(
            input_row["academic_level"],
            input_row["specialization_track"],
            predicted_risk,
            input_row["failed_courses_count"]
        )

        return {
            "student_profile": input_row,
            "predicted_risk": predicted_risk,
            "risk_badge_class": risk_badge_class,
            "risk_probabilities": prob_dict,
            "standing_summary": standing_summary,
            "projected_next_gpa": projected_gpa,
            "gpa_delta": gpa_delta,
            "max_recommended_credits": max_recommended_credits,
            "diagnostics": diagnostics,
            "recommendations": recommendations,
            "course_pathway": recommended_courses
        }

    def _generate_recommendations(self, data: Dict[str, Any], risk: str, max_credits: int) -> List[str]:
        recs = []
        if risk == "High Risk":
            recs.append(f"Cap enrollment for the upcoming semester at {max_credits} units to focus on core remediation.")
            recs.append("Schedule a mandatory bi-weekly 1-on-1 check-in with your assigned faculty advisor (Dr. Felix).")
            if data["failed_courses_count"] > 0:
                recs.append("Prioritize re-registering failed core prerequisites (e.g. CSC 201) immediately before taking 300L/400L electives.")
            if data["study_hours_per_week"] < 15:
                recs.append("Boost dedicated independent study hours to at least 18-20 hours/week, utilizing department peer-tutoring circles.")
        elif risk == "Moderate Risk":
            recs.append(f"Keep upcoming semester enrollment balanced at no more than {max_credits} credits.")
            recs.append("Strengthen core CS programming foundations (CSC 303 Software Engineering & CSC 301 Operating Systems).")
            if data["attendance_rate"] < 80:
                recs.append("Target at least 85% attendance across all technical lecture and lab modules.")
            recs.append("Form study groups for practical coursework and system design assignments.")
        else:
            recs.append(f"You qualify for maximum term load ({max_credits} credits) and advanced specialized electives.")
            recs.append("Consider early undergraduate research, open-source portfolio development, or teaching assistantship.")
            recs.append("Apply for summer engineering internships aligned with your track (" + data["specialization_track"] + ").")

        return recs

    def _recommend_courses_for_student(self, level: str, track: str, risk: str, failed_count: int) -> List[Dict[str, Any]]:
        base_courses = self.CURRICULUM_CATALOG.get(level, self.CURRICULUM_CATALOG["300L"]).copy()
        track_electives = self.TRACK_RECOMMENDED_ELECTIVES.get(track, [])

        recommendations = []
        # If student has failed courses, suggest retake priority
        if failed_count > 0:
            recommendations.append({
                "code": "RETAKE-CORE",
                "title": "[Priority Retake] Carry-over / Prerequisite Deficiency",
                "credits": 3,
                "type": "Deficiency Remediation",
                "status": "Required"
            })

        for course in base_courses[:4]:
            recommendations.append({
                "code": course["code"],
                "title": course["title"],
                "credits": course["credits"],
                "type": "Core Requirement",
                "status": "Recommended"
            })

        if risk != "High Risk" and track_electives:
            for elective in track_electives[:2]:
                recommendations.append({
                    "code": elective["code"],
                    "title": elective["title"],
                    "credits": elective["credits"],
                    "type": f"{track} Track Elective",
                    "status": "Optional"
                })

        return recommendations
