# Game Difficulty Auto-Balancing System 🎮🤖

An intelligent, full-stack adaptive gaming platform that continuously captures real-time player telemetry and dynamically adjusts difficulty between **Level 1 and Level 5** using a 3-class machine learning classification engine and safety guardrails.

---

## 🚀 Key Features

1. **Interactive Target Survival Arena Simulator**  
   Browser-based Canvas game featuring dynamic enemy velocities, target speeds, reaction windows, and core defense health.
2. **Empirical Telemetry Event Stream**  
   Sub-second event streaming (`TARGET_HIT`, `TARGET_MISSED`, `ENEMY_KILLED`, `PLAYER_DAMAGED`, `PLAYER_DIED`) with millisecond reaction times.
3. **Champion 3-Class ML Model**  
   FastAPI microservice serving a Scikit-Learn Random Forest Classifier trained on **12,000+ realistic records** predicting `{-1, 0, +1}` with 96.89% test accuracy.
4. **Multi-Stage Guardrail Controller**  
   Enforces boundary clamps (1–5), max 1-level steps, cooldown refractory periods, minimum sample sizes, and hysteresis anti-oscillation.
5. **Real-Time WebSocket Synchronization**  
   Live updates via Socket.IO push difficulty adjustments, confidence scores, and metric-based explanations directly to the game HUD without page refreshes.
6. **Telemetry & Model Dashboards**  
   Comprehensive Recharts analytics for performance trends, difficulty progression, win rates, reaction speeds, confusion matrices, and feature importance.

---

## 🏗️ Architecture

```text
                 GAME SIMULATOR (Next.js + HTML5 Canvas)
                                   │
                                   ▼
                       Gameplay Telemetry Events
                                   │
                                   ▼
                     EXPRESS API & PERFORMANCE ENGINE
                      (Aggregates 14 Feature Vector)
                                   │
                                   ▼
                      FASTAPI ML MICROSERVICE
                       (Random Forest Champion)
                                   │
                                   ▼
                     DYNAMIC DIFFICULTY CONTROLLER
                  (Boundary, Cooldown, Hysteresis)
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                     ▼                           ▼
            SOCKET.IO BROADCAST          POSTGRES / SQLITE
              (Live Game HUD)             (Audit Trails)
                                                 │
                                                 ▼
                                        ANALYTICS DASHBOARDS
```

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Socket.IO Client
- **Backend API**: Node.js, Express.js, TypeScript, Prisma ORM, Socket.IO Server, JWT, Bcrypt, Zod, Helmet
- **Machine Learning**: Python 3.13, FastAPI, Scikit-learn, Pandas, NumPy, Joblib, Uvicorn
- **Persistence**: PostgreSQL 16 (Production/Docker) & SQLite (Local Zero-Config Dev/Test)
- **Containerization**: Docker, Docker Compose

---

## ⚡ Quickstart

### 1. Prerequisites
- Node.js >= 18
- Python >= 3.10
- npm >= 9

### 2. Installation
```bash
# Install all workspace dependencies
npm install

# Build shared packages
npm run build --workspace=@game-ai/shared-types
npm run build --workspace=@game-ai/validation

# Install Python requirements
python -m pip install -r services/ml-service/requirements.txt
```

### 3. Database Initialization & Seeding
```bash
# Push schema to SQLite database (dev.db)
npx prisma db push --schema=apps/api/prisma/schema.prisma

# Seed initial admin, demo player, realistic sessions, and ML model records
npx ts-node apps/api/src/database/seed.ts
```

### 4. Running the System Locally

Run each service in separate terminals (or concurrently):

```bash
# Terminal 1: ML Microservice (FastAPI on Port 8000)
python -m uvicorn services.ml-service.app.main:app --port 8000 --reload

# Terminal 2: Backend API (Express on Port 4000)
npm run dev --workspace=@game-ai/api

# Terminal 3: Frontend Web (Next.js on Port 3000)
npm run dev --workspace=@game-ai/web
```

Open `http://localhost:3000` in your browser.

---

## 🐳 Docker Compose Deployment

To run the entire multi-container stack (Postgres, ML API, Express API, Next.js Web):

```bash
docker-compose up --build
```

- **Web UI**: http://localhost:3000
- **Express API**: http://localhost:4000
- **FastAPI ML Service**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| **Demo Player** | `player1@gameai.io` | `PlayerPass123!` |
| **System Admin** | `admin@gameai.io` | `AdminPass123!` |

*(One-click login buttons are also available on the Login screen).*

---

## 🧪 Automated Testing

### 1. Run Backend & Guardrail Tests
```bash
npm test --workspace=@game-ai/api
```
Includes:
- Dynamic Difficulty Guardrail unit tests (Boundaries, Step Clamp, Hysteresis, Reasons)
- Auth integration tests (Registration, Login, Duplicate handling)
- Primary End-to-End Gameplay Loop integration tests

### 2. Run ML Model Tests
```bash
python -m unittest ml/tests/test_ml_service.py
```
Includes:
- Health check & metadata verification
- Prediction test for promotion (`+1`)
- Prediction test for demotion (`-1`)
- Prediction test for maintenance (`0`)
- Level 5 boundary clamping test

---

## 📊 ML Evaluation Summary

Evaluated on 1,800 stratified test samples (Random seed 42):

| Model | Accuracy | Precision | Recall | F1-Score |
|---|---|---|---|---|
| Rule-Based Baseline | 76.89% | 77.11% | 76.89% | 76.67% |
| Logistic Regression | 96.28% | 96.28% | 96.28% | 96.28% |
| **Random Forest (Champion)** | **96.89%** | **96.94%** | **96.89%** | **96.89%** |
| Gradient Boosting | 98.33% | 98.34% | 98.33% | 98.33% |

---

## 📜 Documentation Index

- [Architecture Specification](docs/ARCHITECTURE.md)
- [REST & Real-Time API Reference](docs/API.md)
- [Machine Learning Methodology](docs/ML_METHODOLOGY.md)
- [Database Schema & Models](docs/DATABASE.md)
