# REST & Real-Time API Documentation

## 1. Base URLs
- Express API: `http://localhost:4000`
- ML Microservice: `http://localhost:8000`
- Frontend: `http://localhost:3000`

---

## 2. Authentication Endpoints

### Register
`POST /api/auth/register`
- Request:
```json
{
  "username": "shadow_striker",
  "email": "shadow@gameai.io",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "displayName": "Shadow Striker"
}
```
- Response (201):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "cm123...",
      "name": "shadow_striker",
      "email": "shadow@gameai.io",
      "role": "PLAYER",
      "profile": {
        "displayName": "Shadow Striker",
        "currentDifficulty": 3,
        "totalGames": 0,
        "totalScore": 0
      }
    }
  }
}
```

### Login
`POST /api/auth/login`
- Request:
```json
{
  "email": "shadow@gameai.io",
  "password": "Password123!"
}
```
- Response (200): Returns JWT token and user profile.

### Current User
`GET /api/auth/me`
- Headers: `Authorization: Bearer <token>`
- Response (200): Returns current authenticated profile and roles.

---

## 3. Player Endpoints

### Get Player Profile
`GET /api/player/profile`
- Headers: `Authorization: Bearer <token>`

### Update Player Profile
`PUT /api/player/profile`
- Request:
```json
{
  "displayName": "Apex Striker",
  "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Apex"
}
```

### Player Dashboard
`GET /api/player/dashboard`
- Response: Returns current difficulty tier, computed performance metrics, ML recommendation, confidence, and metric-backed reasoning explanation.

### Player Difficulty History
`GET /api/player/difficulty-history`
- Response: List of all past adjustments, timestamps, and model versions for the player.

---

## 4. Game Simulator Endpoints

### Start Session
`POST /api/game/session`
- Request: `{ "difficulty": 3 }` (optional override)
- Response: Returns initialized session ID and configuration for the level.

### Post Gameplay Event
`POST /api/game/event`
- Request:
```json
{
  "sessionId": "cm321...",
  "eventType": "TARGET_HIT",
  "difficulty": 3,
  "reactionTime": 240,
  "metadata": { "combo": 4, "points": 120 }
}
```
- Response: Persists event, triggers difficulty evaluation via ML & guardrails, and broadcasts to WebSocket if difficulty changes.

### End Session
`POST /api/game/session/:id/end`
- Request:
```json
{
  "score": 850,
  "won": true,
  "completed": true,
  "targetsHit": 28,
  "targetsMissed": 4,
  "enemiesKilled": 10,
  "damageTaken": 25
}
```
- Response: Finalizes session stats, increments player profile score/matches, and records performance snapshot.

---

## 5. ML Microservice Endpoints

### Predict Difficulty Adjustment
`POST /predict` (FastAPI)
- Request:
```json
{
  "current_difficulty": 3,
  "accuracy": 0.84,
  "win_rate": 0.75,
  "death_rate": 0.20,
  "survival_rate": 0.80,
  "average_score": 720,
  "reaction_time": 350,
  "completion_time": 140,
  "performance_trend": 0.12,
  "consecutive_wins": 3,
  "consecutive_losses": 0
}
```
- Response (200):
```json
{
  "adjustment": 1,
  "confidence": 0.87,
  "recommended_difficulty": 4,
  "model_version": "rf-1.0.0",
  "model_name": "Random Forest Classifier",
  "probabilities": {
    "decrease": 0.05,
    "maintain": 0.12,
    "increase": 0.83
  }
}
```

### Models & Evaluation
`GET /models` (FastAPI)
- Returns test accuracy, precision, recall, F1, and confusion matrices for all 4 trained models.

---

## 6. Socket.IO Real-Time Events

- **Client Connection**: Connect with `auth: { token: "<jwt>" }`.
- **Rooms**: Automatically joins `player:<playerId>`.
- **Event `DIFFICULTY_UPDATED`**:
```json
{
  "type": "DIFFICULTY_UPDATED",
  "previousDifficulty": 3,
  "newDifficulty": 4,
  "adjustment": 1,
  "confidence": 0.89,
  "reason": "Difficulty increased from Level 3 → 4.\n• Accuracy: 88%\n• Win Rate: 80%...",
  "modelVersion": "rf-1.0.0",
  "timestamp": "2026-09-24T18:00:00.000Z",
  "sessionId": "cm321..."
}
```
