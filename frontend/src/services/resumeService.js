import axios from 'axios';

const API_URL = 'http://localhost:5000/api/resume';

const analyzeResume = (formData) => {
  return axios.post(`${API_URL}/analyze`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const resumeService = {
  analyzeResume,
};

export default resumeService;