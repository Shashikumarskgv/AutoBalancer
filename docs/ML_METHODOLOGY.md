# Machine Learning Methodology & Evaluation

## 1. Problem Formulation

The core machine learning challenge is formulated as a **3-class classification problem**:

```text
INPUT FEATURES:
Current Difficulty Level (1 to 5)
+ Aggregate Performance Metrics (Accuracy, Win Rate, Death Rate, Survival Rate, Score)
+ Telemetry Timing (Reaction Time, Completion Time)
+ Temporal Context (Recent Accuracy, Recent Win Rate, Recent Score, Performance Trend)
+ Streak History (Consecutive Wins, Consecutive Losses, Total Games)

OUTPUT ADJUSTMENT:
-1 : Decrease difficulty (player is overwhelmed or frustrated)
 0 : Maintain difficulty (player is in the optimal flow channel)
+1 : Increase difficulty (player is dominating and under-challenged)
```

By predicting a step adjustment `{-1, 0, +1}` rather than an absolute level, the model functions as a dynamic rate-of-change controller, allowing fine-grained control and stable convergence.

---

## 2. Feature Engineering

The 14 engineered features fed into the model are:

| Feature Name | Type | Description |
|---|---|---|
| `current_difficulty` | Integer (1–5) | Current game difficulty level |
| `accuracy` | Float (0.0–1.0) | Ratio of hits to total attempts across historical sessions |
| `win_rate` | Float (0.0–1.0) | Ratio of matches won to total completed matches |
| `death_rate` | Float (0.0–1.0) | Normalized rate of player core breaches |
| `survival_rate` | Float (0.0–1.0) | `1.0 - death_rate` |
| `average_score` | Integer | Mean score across matches |
| `reaction_time` | Integer (ms) | Mean target reaction time (180ms–1000ms) |
| `completion_time` | Integer (s) | Mean session survival duration |
| `performance_trend` | Float (-1.0–1.0) | Recent 3-game performance score minus previous 5-game performance |
| `consecutive_wins` | Integer | Active consecutive victory streak |
| `consecutive_losses`| Integer | Active consecutive loss streak |
| `recent_accuracy` | Float (0.0–1.0) | Hit accuracy across last 3 games |
| `recent_win_rate` | Float (0.0–1.0) | Win rate across last 3 games |
| `recent_score` | Integer | Average score across last 3 games |

---

## 3. Dataset Generation

The dataset was generated using `ml/datasets/generate_dataset.py`, producing **12,000 gameplay records** modeling player archetypes:
- Novice players (high death rate, slower reaction times >600ms, negative trends)
- Intermediate players (stable win rate ~50%, balanced reaction times ~400ms)
- Expert players (high accuracy >85%, fast reaction times <280ms, positive trends)

A fixed random seed (`42`) guarantees full reproducibility.

---

## 4. Model Training & Comparison

The dataset was partitioned into:
- **70% Training Set** (8,399 samples)
- **15% Validation Set** (1,801 samples)
- **15% Test Set** (1,800 samples)

All machine learning models underwent rigorous **5-Fold Stratified Cross-Validation (`StratifiedKFold(n_splits=5)`)** across the full dataset:

| Model | 5-Fold CV Accuracy | 5-Fold CV F1-Score | Test Accuracy | Precision (Weighted) | Recall (Weighted) | F1-Score (Weighted) | Status |
|---|---|---|---|---|---|---|---|
| **Rule-based Baseline** | — | — | 76.89% | 77.11% | 76.89% | 76.67% | Baseline Reference |
| **Logistic Regression** | 97.32% ± 0.30% | 97.32% ± 0.30% | 96.28% | 96.28% | 96.28% | 96.28% | Linear Multi-class |
| **Random Forest Classifier** | 97.06% ± 0.47% | 97.06% ± 0.47% | 96.89% | 96.94% | 96.89% | 96.89% | Challenger Ensemble |
| **Gradient Boosting Classifier** | **98.19% ± 0.27%** | **98.19% ± 0.27%** | **98.33%** | **98.34%** | **98.33%** | **98.33%** | **Champion Model (`gb-1.0.0`)** |

The **Gradient Boosting Classifier (`gb-1.0.0`)** was designated as the official champion model because it achieved both the highest out-of-fold generalization (98.19% CV accuracy with the lowest variance ±0.27%) and the highest test set performance (98.33% test accuracy and 98.33% F1-score).

---

## 5. Dataset Class Distribution & Balance

Class proportions across the 12,000 synthesized gameplay records reflect realistic player performance patterns:

- **Decrease (-1)**: 3,034 records (**25.28%**) — Players struggling, suffering core breaches or prolonged loss streaks.
- **Maintain (0)**: 5,148 records (**42.90%**) — Players in their optimal flow channel matching current difficulty.
- **Increase (+1)**: 3,818 records (**31.82%**) — Players outperforming current difficulty with high accuracy and win streaks.

This balanced class distribution prevents majority-class bias and ensures the model acts as a neutral rate-of-change regulator rather than biasing toward aggressive escalation.

---

## 6. Feature Importance Breakdown

Feature importance analysis across tree-based ensembles reveals the primary decision drivers:

1. `recent_win_rate`: **17.89%** — Immediate short-term momentum
2. `consecutive_losses`: **17.04%** — Immediate frustration detection
3. `accuracy`: **12.51%** — Lifetime mechanical aiming skill
4. `recent_accuracy`: **11.75%** — Active session accuracy
5. `consecutive_wins`: **9.91%** — Mastery streak identification
6. `win_rate`: **7.62%** — Historical baseline performance
7. `survival_rate`: **5.46%** — Core health maintenance
8. `death_rate`: **4.77%** — Hazard vulnerability

---

## 7. Data Leakage Transparency & Synthetic Environment Disclosure

1. **Synthetic Data Considerations**:
   - The current training dataset of 12,000 samples was procedurally synthesized using realistic player archetype distributions and behavioral heuristics.
   - High evaluation metrics (>98%) are typical when validating on synthetic datasets generated from deterministic archetype rules.
   - Before deploying into large-scale production, human player playtest sessions should be logged to construct an empirical test split that verifies real-world generalization without domain shift.

2. **Feature Leakage Prevention**:
   - Temporal features (`recent_accuracy`, `recent_win_rate`, `performance_trend`) are computed strictly from preceding events in the player's timeline and never include future match states.
   - Cross-validation splits (`StratifiedKFold`) ensure all evaluation metrics are derived out-of-fold.
   - Guardrails (e.g. `CONFIDENCE_THRESHOLD = 0.65`, 30s cooldown) safeguard against overconfident model outliers in real-time execution.

