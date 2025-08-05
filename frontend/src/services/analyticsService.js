import axios from 'axios';

const API_URL = 'http://localhost:5000/api/analytics';

const getAnalytics = () => {
  return axios.get(API_URL);
};

const getDashboardStats = () => {
    return axios.get(`${API_URL}/stats`);
};

const analyticsService = {
  getAnalytics,
  getDashboardStats,
};

export default analyticsService;