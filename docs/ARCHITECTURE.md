# System Architecture Specification

## 1. System Overview

The **Game Difficulty Auto-Balancing System** is an end-to-end intelligent platform that continuously analyzes player performance in an interactive browser arena and dynamically adapts game difficulty between **Level 1 and Level 5** in real time.

---

## 2. Core Feedback Loop Architecture

The heart of the system is a closed feedback loop connecting gameplay events, feature engineering, machine learning inference, safety guardrails, real-time WebSockets, and persistent analytics:

```text
                  ┌───────────────────────────────┐
                  │      GAME SIMULATOR           │
                  │   Target Survival Arena       │
                  └───────────────┬───────────────┘
                                  │ Gameplay Telemetry
                                  │ (TARGET_HIT, reactionTime, ...)
                                  ▼
                  ┌───────────────────────────────┐
                  │    PERFORMANCE PROCESSOR      │
                  │  Accuracy, Win Rate, Trend    │
                  └───────────────┬───────────────┘
                                  │ 14-Feature Input Vector
                                  ▼
                  ┌───────────────────────────────┐
                  │       ML MICROSERVICE         │
                  │  Champion Model (FastAPI)     │
                  └───────────────┬───────────────┘
                                  │ Prediction: -1 / 0 / +1
                                  │ Calibrated Confidence Score
                                  ▼
                  ┌───────────────────────────────┐
                  │ DYNAMIC DIFFICULTY CONTROLLER │
                  │  Guardrails & Hysteresis      │
                  └───────┬───────────────┬───────┘
                          │               │
      WebSocket Broadcast │               │ Persist Audit
                          ▼               ▼
                  ┌───────────────┐   ┌───────────────┐
                  │   BROWSER UI  │   │  POSTGRESQL   │
                  │ Real-Time HUD │   │   DATABASE    │
                  └───────────────┘   └───────┬───────┘
                                              │
                                              ▼
                                      ┌───────────────┐
                                      │   ANALYTICS   │
                                      │  DASHBOARDS   │
                                      └───────────────┘
```

---

## 3. Microservice Components

### Apps
1. **`apps/web` (Next.js 14 + React + TypeScript + Tailwind CSS)**
   - Interactive Target Survival Arena Canvas
   - Player Dashboard with metric-backed explanations
   - Real-Time Difficulty Notification Modal (via Socket.IO)
   - Detailed Recharts Analytics & Difficulty Progression curves
   - Admin Model Console & Player Management

2. **`apps/api` (Node.js + Express + TypeScript + Prisma ORM + Socket.IO)**
   - RESTful endpoints for Auth, Player, Game Sessions, Events, Analytics, and Admin
   - JWT authentication & Bcrypt password hashing
   - In-memory & DB-backed Performance Engine
   - Dynamic Difficulty Controller with 5 production guardrails
   - WebSocket broadcast to player rooms (`player:<playerId>`)

3. **`services/ml-service` (Python 3.13 + FastAPI + Scikit-Learn + Pandas)**
   - High-throughput REST API serving the 3-class classification champion model
   - Exposes `/predict`, `/models`, `/models/switch`, `/retrain`, and `/health`
   - Dynamically loads serialized `.joblib` models and `metadata.json`

4. **`packages/shared-types` & `packages/validation`**
   - Shared TypeScript interfaces, types, and Zod schemas across frontend and backend

---

## 4. Guardrail Pipeline

To ensure gameplay stability, ML predictions are filtered through a multi-stage controller:

1. **Guardrail 1: Boundaries**: Clamped strictly to `1 <= difficulty <= 5`. Level 5 cannot increase; Level 1 cannot decrease.
2. **Guardrail 2: Max Step**: Maximum `±1` level per adjustment (`MAX_DIFFICULTY_STEP=1`). Disallows sudden jumps like `2 → 5`.
3. **Guardrail 3: Cooldown**: Configurable refractory period (`DIFFICULTY_COOLDOWN_SECONDS=30`) between adjustments.
4. **Guardrail 4: Minimum Sample Size**: Minimum actions (`MIN_ACTIONS_FOR_ADJUSTMENT=10`) before evaluating an adjustment.
5. **Guardrail 5: Hysteresis**: Suppresses minor oscillations (`HYSTERESIS_THRESHOLD=0.15`) caused by temporary micro-fluctuations.
6. **Guardrail 6: Confidence Threshold**: Predictions with probability below `CONFIDENCE_THRESHOLD=0.65` are rejected with explicit audit reason `LOW_CONFIDENCE`.

---

## 5. Viewport Coordinate Mapping Architecture

To eliminate click desynchronization and pointer skew across responsive viewports:

```text
  Client Pointer Event (clientX, clientY)
              │
              ▼
  canvas.getBoundingClientRect()
  [rect.left, rect.top, rect.width, rect.height]
              │
              ├─ scaleX = canvas.width  / rect.width
              └─ scaleY = canvas.height / rect.height
              │
              ▼
  Internal Arena Coordinate Space (900 x 520)
  x = (clientX - rect.left) * scaleX
  y = (clientY - rect.top)  * scaleY
              │
              ▼
  Exact Euclidean Hit-Testing:
  distance = sqrt((x - target.x)^2 + (y - target.y)^2) <= target.radius
```

- Target rendering, reticle tracking, and raycast hit detection all operate within the exact same `900 x 520` coordinate space.
- Verified under mobile, tablet, 1080p, and 4K display scaling without hardcoded pixel offsets.

