import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';

const getAllUsers = () => {
    return axios.get(`${API_URL}/users`);
};

const getAllDocuments = (page = 1) => {
    return axios.get(`${API_URL}/documents?page=${page}`);
};

const adminService = {
    getAllUsers,
    getAllDocuments,
};

export default adminService;