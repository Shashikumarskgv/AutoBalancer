"""
Synthetic Gameplay Dataset Generator for Game Difficulty Auto-Balancing System
Generates >= 10,000 realistic player gameplay records across difficulty levels 1 to 5.
"""

import os
import numpy as np
import pandas as pd

np.random.seed(42)

def generate_synthetic_gameplay_data(num_samples=12000, output_path="ml/datasets/gameplay_dataset_10k.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 3 player archetypes: Novice (30%), Intermediate (45%), Expert (25%)
    records = []
    
    for _ in range(num_samples):
        # Current difficulty 1 to 5
        current_diff = np.random.choice([1, 2, 3, 4, 5], p=[0.20, 0.25, 0.25, 0.18, 0.12])
        
        # Player skill level: 0.1 (low) to 0.95 (high)
        base_skill = np.random.beta(a=3, b=3) # Centered around 0.5
        
        # Difficulty penalty: higher difficulty makes performance harder
        diff_penalty = (current_diff - 3) * 0.12
        effective_skill = np.clip(base_skill - diff_penalty + np.random.normal(0, 0.05), 0.05, 0.98)
        
        # Performance trend: previous skill vs recent skill
        trend = np.clip(np.random.normal(loc=0.0, scale=0.12), -0.5, 0.5)
        recent_effective = np.clip(effective_skill + trend * 0.5, 0.02, 0.99)
        
        # Accuracy: strongly correlated with effective skill
        accuracy = np.clip(effective_skill * 0.85 + np.random.uniform(0.05, 0.15), 0.10, 0.98)
        recent_accuracy = np.clip(recent_effective * 0.85 + np.random.uniform(0.05, 0.15), 0.10, 0.98)
        
        # Win rate
        win_rate = np.clip(effective_skill * 1.05 - 0.05 + np.random.normal(0, 0.05), 0.0, 1.0)
        recent_win_rate = np.clip(recent_effective * 1.05 - 0.05 + np.random.normal(0, 0.05), 0.0, 1.0)
        
        # Death rate & survival rate
        death_rate = np.clip((1.0 - effective_skill) * 0.9 + np.random.normal(0, 0.05), 0.0, 1.0)
        survival_rate = np.clip(1.0 - death_rate, 0.0, 1.0)
        
        # Reaction time (ms): faster (200ms) for high skill, slower (800ms) for low skill
        reaction_time = int(np.clip(750 - (effective_skill * 450) + np.random.normal(0, 30), 180, 1000))
        
        # Score & Normalized score
        base_score = int(effective_skill * 1000 + (current_diff * 100) + np.random.normal(0, 50))
        average_score = max(50, base_score)
        recent_score = max(50, int(average_score * (1 + trend)))
        normalized_score = np.clip(average_score / 1500.0, 0.0, 1.0)
        
        # Completion time (seconds): faster when skilled, slower or timed out when struggling
        completion_time = int(np.clip(180 - (effective_skill * 90) + np.random.normal(0, 15), 45, 300))
        
        # Consecutive wins / losses
        if recent_win_rate > 0.7:
            consecutive_wins = int(np.random.choice([2, 3, 4, 5], p=[0.4, 0.35, 0.15, 0.10]))
            consecutive_losses = 0
        elif recent_win_rate < 0.3:
            consecutive_wins = 0
            consecutive_losses = int(np.random.choice([2, 3, 4, 5], p=[0.4, 0.35, 0.15, 0.10]))
        else:
            consecutive_wins = int(np.random.choice([0, 1], p=[0.6, 0.4]))
            consecutive_losses = int(np.random.choice([0, 1], p=[0.6, 0.4]))
            
        games_played = int(np.random.exponential(scale=20) + 5)
        difficulty_history = float(np.clip(current_diff + np.random.normal(0, 0.3), 1.0, 5.0))
        
        # Ground truth adjustment logic:
        # +1 if player performance is too high for current difficulty
        # -1 if player performance is too low for current difficulty
        # 0 if player is in balanced "flow" zone
        
        # Performance index
        perf_index = (
            0.30 * accuracy +
            0.20 * win_rate +
            0.15 * survival_rate +
            0.15 * normalized_score +
            0.10 * (1.0 - (reaction_time - 180) / 820.0) +
            0.10 * (1.0 - (completion_time - 45) / 255.0)
        )
        
        # Adjust with trend & streaks
        effective_perf = perf_index + 0.15 * trend + (consecutive_wins * 0.03) - (consecutive_losses * 0.03)
        
        # Thresholds relative to current difficulty
        # For Level 1: easier to upgrade, hard to downgrade
        # For Level 5: impossible to upgrade, easier to downgrade
        if current_diff == 1:
            if effective_perf > 0.60:
                target = 1
            else:
                target = 0
        elif current_diff == 5:
            if effective_perf < 0.45:
                target = -1
            else:
                target = 0
        else:
            # Difficulty levels 2, 3, 4
            # Target range is centered around 0.50
            upper_bound = 0.68 + (current_diff - 3) * 0.04
            lower_bound = 0.40 + (current_diff - 3) * 0.04
            
            if effective_perf > upper_bound and consecutive_losses == 0:
                target = 1
            elif effective_perf < lower_bound and consecutive_wins == 0:
                target = -1
            else:
                target = 0
                
        records.append({
            "current_difficulty": current_diff,
            "accuracy": round(float(accuracy), 4),
            "win_rate": round(float(win_rate), 4),
            "death_rate": round(float(death_rate), 4),
            "survival_rate": round(float(survival_rate), 4),
            "average_score": int(average_score),
            "normalized_score": round(float(normalized_score), 4),
            "reaction_time": int(reaction_time),
            "completion_time": int(completion_time),
            "recent_accuracy": round(float(recent_accuracy), 4),
            "recent_win_rate": round(float(recent_win_rate), 4),
            "recent_score": int(recent_score),
            "performance_trend": round(float(trend), 4),
            "games_played": int(games_played),
            "difficulty_history": round(float(difficulty_history), 2),
            "consecutive_wins": int(consecutive_wins),
            "consecutive_losses": int(consecutive_losses),
            "target": int(target)
        })
        
    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} gameplay records saved to {output_path}")
    print("Class distribution:")
    print(df['target'].value_counts(normalize=True))
    return df

if __name__ == "__main__":
    generate_synthetic_gameplay_data()
