"""
Unit and integration tests for ML Model & FastAPI prediction logic
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath("services/ml-service"))
from app.main import app

class TestMLService(unittest.TestCase):
    def setUp(self):
        # We can test app endpoints using FastAPI TestClient or direct function calls
        from starlette.testclient import TestClient
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue("random_forest" in data["models_loaded"])

    def test_models_metadata_endpoint(self):
        response = self.client.get("/models")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("models", data)
        self.assertIn("random_forest", data["models"])
        # Check actual real metrics are present and not zero
        rf = data["models"]["random_forest"]
        self.assertGreater(rf["accuracy"], 0.85)
        self.assertGreater(rf["f1_score"], 0.85)

    def test_predict_increase_difficulty(self):
        payload = {
            "current_difficulty": 3,
            "accuracy": 0.94,
            "win_rate": 0.90,
            "death_rate": 0.05,
            "survival_rate": 0.95,
            "average_score": 950,
            "reaction_time": 250,
            "completion_time": 85,
            "performance_trend": 0.22,
            "consecutive_wins": 4,
            "consecutive_losses": 0
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertEqual(res["adjustment"], 1)
        self.assertEqual(res["recommended_difficulty"], 4)
        self.assertGreaterEqual(res["confidence"], 0.5)

    def test_predict_decrease_difficulty(self):
        payload = {
            "current_difficulty": 4,
            "accuracy": 0.25,
            "win_rate": 0.10,
            "death_rate": 0.85,
            "survival_rate": 0.15,
            "average_score": 180,
            "reaction_time": 750,
            "completion_time": 220,
            "performance_trend": -0.28,
            "consecutive_wins": 0,
            "consecutive_losses": 4
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertEqual(res["adjustment"], -1)
        self.assertEqual(res["recommended_difficulty"], 3)
        self.assertGreaterEqual(res["confidence"], 0.5)

    def test_predict_maintain_difficulty(self):
        payload = {
            "current_difficulty": 3,
            "accuracy": 0.65,
            "win_rate": 0.55,
            "death_rate": 0.35,
            "survival_rate": 0.65,
            "average_score": 600,
            "reaction_time": 440,
            "completion_time": 130,
            "performance_trend": 0.01,
            "consecutive_wins": 1,
            "consecutive_losses": 1
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertEqual(res["adjustment"], 0)
        self.assertEqual(res["recommended_difficulty"], 3)

    def test_guardrail_boundary_at_level_5(self):
        payload = {
            "current_difficulty": 5,
            "accuracy": 0.99,
            "win_rate": 0.95,
            "death_rate": 0.05,
            "survival_rate": 0.95,
            "average_score": 1200,
            "reaction_time": 210,
            "completion_time": 70,
            "performance_trend": 0.25,
            "consecutive_wins": 5,
            "consecutive_losses": 0
        }
        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertEqual(res["adjustment"], 0)
        self.assertEqual(res["recommended_difficulty"], 5)

if __name__ == "__main__":
    unittest.main()
