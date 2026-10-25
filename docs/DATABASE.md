# Database Schema & Data Models

## 1. Overview

The persistence layer is managed by **Prisma ORM**.
- **Production / Docker**: PostgreSQL 16
- **Local Dev / Unit Tests**: SQLite (`file:./dev.db`)

---

## 2. Relational Schema Architecture

```text
 ┌───────────────┐          ┌──────────────────┐
 │     User      │──1:1────▶│  PlayerProfile   │
 └───────┬───────┘          └──────────────────┘
         │
         ├──1:N──▶ ┌──────────────────────┐
         │         │     GameSession      │
         │         └──────────┬───────────┘
         │                    │
         ├──1:N──▶ ┌──────────┴───────────┐
         │         │    GameplayEvent     │
         │         └──────────────────────┘
         │
         ├──1:N──▶ ┌──────────────────────┐
         │         │ PerformanceSnapshot  │
         │         └──────────────────────┘
         │
         └──1:N──▶ ┌──────────────────────┐
                   │   DifficultyChange   │
                   └──────────────────────┘

 ┌───────────────┐
 │    MLModel    │
 └───────────────┘
```

---

## 3. Tables & Field Definitions

### `users`
- `id`: CUID (Primary Key)
- `name`: String (Unique Username)
- `email`: String (Unique)
- `passwordHash`: Bcrypt hash (Cost 10)
- `role`: 'PLAYER' | 'ADMIN'
- `createdAt`, `updatedAt`: Timestamps

### `player_profiles`
- `id`: CUID (Primary Key)
- `userId`: Foreign key -> `users.id`
- `displayName`: Display name
- `avatar`: URL string
- `currentDifficulty`: Integer (1 to 5, Default: 3)
- `totalGames`: Cumulative match count
- `totalScore`: Cumulative score accumulated

### `game_sessions`
- `id`: CUID (Primary Key)
- `playerId`: Foreign key -> `users.id`
- `difficulty`: Integer (1 to 5)
- `startedAt`: Timestamp
- `endedAt`: Timestamp (Nullable)
- `score`: Final match score
- `won`: Boolean
- `completed`: Boolean
- `accuracy`: Hits / Attempts ratio
- `targetsHit`: Integer count
- `targetsMissed`: Integer count
- `enemiesKilled`: Integer count
- `damageTaken`: Integer damage taken

### `gameplay_events`
- `id`: CUID (Primary Key)
- `sessionId`: Foreign key -> `game_sessions.id`
- `playerId`: Foreign key -> `users.id`
- `eventType`: String ('GAME_STARTED', 'TARGET_HIT', 'TARGET_MISSED', 'ENEMY_KILLED', 'PLAYER_DAMAGED', 'PLAYER_DIED', 'LEVEL_COMPLETED', 'GAME_COMPLETED', 'GAME_ABANDONED')
- `eventValue`: Numeric telemetry value
- `reactionTime`: Milliseconds from target spawn to click
- `timestamp`: Event ISO string
- `metadata`: JSON string for arbitrary event metadata

### `performance_snapshots`
- `id`: CUID (Primary Key)
- `playerId`: Foreign key -> `users.id`
- `sessionId`: Foreign key -> `game_sessions.id`
- `accuracy`, `winRate`, `deathRate`, `survivalRate`: Floats (0.0 to 1.0)
- `averageScore`, `reactionTime`, `completionTime`: Floats
- `performanceScore`: Composite weighted index (0.0 to 1.0)
- `performanceTrend`: Temporal differential (-1.0 to +1.0)
- `createdAt`: Timestamp

### `difficulty_changes`
- `id`: CUID (Primary Key)
- `playerId`: Foreign key -> `users.id`
- `sessionId`: Foreign key -> `game_sessions.id` (Nullable)
- `previousDifficulty`: Integer (1–5)
- `newDifficulty`: Integer (1–5)
- `adjustment`: -1, 0, or +1
- `confidence`: Float (0.0 to 1.0)
- `reason`: Multi-line explanation string with metric details
- `modelVersion`: Model version string (e.g. `rf-1.0.0`)
- `createdAt`: Timestamp

### `ml_models`
- `id`: CUID (Primary Key)
- `modelName`: Human-readable name
- `version`: Unique version tag
- `algorithm`: Scikit-Learn class name
- `datasetVersion`: Dataset identifier
- `accuracy`, `precision`, `recall`, `f1Score`: Real test evaluation metrics
- `modelPath`: Filepath to serialized joblib model
- `isActive`: Boolean flag for active champion
- `metadata`: JSON string containing confusion matrix & feature importances
