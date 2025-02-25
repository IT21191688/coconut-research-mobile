import api from './axios';

export interface CreateReadingParams {
  batchId: string;
  deviceId?: string;
  moistureLevel: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  startTime: Date;
  status: string;
  notes?: string;
}

export interface BatchInfo {
  batchId: string;
  readingsCount: number;
  lastUpdated: string;
}

export const copraApi = {
  createReading: async (params: CreateReadingParams) => {
    const response = await api.post('/copra/readings', params);
    return response.data;
  },

  getBatchHistory: async (batchId: string) => {
    try {
      const response = await api.get(`/copra/batch/${batchId}`);
      return response.data;
    } catch (error) {
      console.error('API Error in getBatchHistory:', error);
      throw error;
    }
  },
  
  
};