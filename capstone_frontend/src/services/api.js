import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const farmerService = {
    register: (data) => api.post('/farmers', data),
    login: (credentials) => api.post('/login', credentials),
    
    registerFarm: (data) => api.post('/farms', data),
    getFarmerFarms: (farmerId) => api.get(`/farms/${farmerId}`),
    getSingleFarm: (farmId) => api.get(`/farms/single/${farmId}`),
    
    getFarmerHistory: (farmerId) => api.get(`/predictions/${farmerId}`),
    getFarmPredictions: (farmId) => api.get(`/predictions/farm/${farmId}`),
    triggerPrediction: (farmId) => api.post('/predict', { farm_id: farmId }),
    getFarmAdvisory: (farmId) => api.get(`/farms/${farmId}/advisory`),
    triggerGlobalUpdate: () => api.post('/cron/trigger')
};

export default api;