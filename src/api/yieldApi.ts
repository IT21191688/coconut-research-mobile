import api from './axios';
const BASE_URL = 'http://192.168.1.6:7000/api/v1';

export interface MonthlyData {
  month: number;
  sm_10: number;
  sm_20: number;
  sm_30: number;
  age: number;
  soil_type: number;
  "Temperature (°C)": number;
  "Humidity (%)": number;
  "Rainfall (mm)": number;
  "Weather Description": string;
}

export interface YieldPredictionRequest {
  year: number;
  locationId: string;
  monthly_data: MonthlyData[];
}

export interface YieldPrediction {
  year: number;
  average_prediction: number;
  monthly_predictions: {
    confidence_score: number;
    ensemble_prediction: number;
    month: number;
    month_name: string;
    seasonal_factor: number;
    seasonal_prediction: number;
    input_data: {
      humidity: number;
      plant_age: number;
      rainfall: number;
      soil_moisture_10cm: number;
      soil_moisture_20cm: number;
      soil_moisture_30cm: number;
      soil_type: number;
      temperature: number;
      weather_description: string;
    };
    weights: number[];
    _id: string;
  }[];
  status: string;
}

export interface PredictedMonth {
  month: string;
  yield: number;
}

export interface YieldPredictionResponse {
  predictedYield: number;
  confidenceScore: number;
  predictedMonths: PredictedMonth[];
}

export const yieldApi = {
  predictYield: async (data: YieldPredictionRequest) => {
    try {
      const response = await api.post(`${BASE_URL}/yield/yield-prediction`, data);
      console.log('Raw API response:', response.data);
      
      // Check if the response has the expected structure
      if (response.data && (response.data.data || response.data)) {
        // Some APIs nest the actual data under a 'data' property
        const resultData = response.data.data || response.data;
        return resultData;
      } else {
        console.error('Unexpected API response format:', response.data);
        throw new Error('Unexpected API response format');
      }
    } catch (error) {
      console.error('API Error in predictYield:', error);
      throw error;
    }
  },
};