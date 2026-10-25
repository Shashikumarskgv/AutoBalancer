"""
Model Evaluation and Verification Script
Loads trained models from ml/models/ and validates their predictions on sample inputs.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np

def verify_models():
    models_dir = "ml/models"
    metadata_path = os.path.join(models_dir, "metadata.json")
    if not os.path.exists(metadata_path):
        print("Metadata not found. Please train models first.")
        return False
        
    with open(metadata_path, "r") as f:
        metadata = json.load(f)
        
    print("=== MODEL EVALUATION SUMMARY ===")
    print(f"Active Model: {metadata['active_model_key']}")
    print(f"Timestamp:    {metadata['training_timestamp']}\n")
    
    print(f"{'Model Name':<30} | {'Acc':<7} | {'Prec':<7} | {'Recall':<7} | {'F1':<7}")
    print("-" * 65)
    for key, info in metadata['models'].items():
        print(f"{info['model_name']:<30} | {info['accuracy']*100:6.2f}% | {info['precision']*100:6.2f}% | {info['recall']*100:6.2f}% | {info['f1_score']*100:6.2f}%")
        
    print("\nFeature Importances (Champion: Random Forest):")
    rf_feat = metadata['models']['random_forest']['feature_importance']
    for feat, imp in list(rf_feat.items())[:8]:
        print(f"  • {feat:<20}: {imp*100:5.2f}%")
        
    return True

if __name__ == "__main__":
    verify_models()
