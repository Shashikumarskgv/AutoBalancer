import axios from 'axios';
import { CONFIG } from '../config';
import { MLPredictionRequest, MLPredictionResponse } from '@game-ai/shared-types';

export class MLClientService {
  private static baseUrl = CONFIG.ML_SERVICE_URL;

  public static async predict(features: MLPredictionRequest): Promise<MLPredictionResponse> {
    try {
      const response = await axios.post<MLPredictionResponse>(
        `${this.baseUrl}/predict`,
        features,
        { timeout: 3500 }
      );
      return response.data;
    } catch (error: any) {
      console.warn(`[MLClient] Prediction request to ML service failed (${error.message}). Invoking fallback classifier.`);
      return this.fallbackPredict(features);
    }
  }

  public static async getModels(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, { timeout: 3000 });
      return response.data;
    } catch (error: any) {
      console.warn(`[MLClient] Fetch models failed (${error.message})`);
      return null;
    }
  }

  public static async switchModel(modelKey: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/models/switch`,
        { model_key: modelKey },
        { timeout: 3000 }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to switch ML model: ${error.message}`);
    }
  }

  public static async retrain(): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/retrain`, {}, { timeout: 120000 });
      return response.data;
    } catch (error: any) {
      throw new Error(`Retraining request failed: ${error.message}`);
    }
  }

  /**
   * High-reliability fallback rule-based classifier if ML microservice is unreachable
   */
  private static fallbackPredict(features: MLPredictionRequest): MLPredictionResponse {
    const { current_difficulty, accuracy, win_rate, performance_trend, consecutive_wins, consecutive_losses } = features;
    
    let adjustment: -1 | 0 | 1 = 0;
    let reason = "Maintaining current difficulty level";
    let confidence = 0.80;

    if (current_difficulty < 5 && (accuracy > 0.82 || consecutive_wins >= 2 || performance_trend > 0.12)) {
      adjustment = 1;
      confidence = 0.85;
    } else if (current_difficulty > 1 && (accuracy < 0.45 || consecutive_losses >= 2 || performance_trend < -0.15)) {
      adjustment = -1;
      confidence = 0.85;
    }

    const recommended = Math.min(5, Math.max(1, current_difficulty + adjustment));

    return {
      adjustment,
      confidence,
      recommended_difficulty: recommended,
      model_version: 'fallback-rules-1.0.0',
      probabilities: {
        decrease: adjustment === -1 ? 0.8 : 0.1,
        maintain: adjustment === 0 ? 0.8 : 0.1,
        increase: adjustment === 1 ? 0.8 : 0.1,
      },
      features_used: features as any,
    };
  }
}
