import axios from 'axios';
import API_BASE_URL from './config';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


export const registerUser = async (data) => {
    try {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    } catch (error) {
        console.error('Registration failed:', error.response.data);
        throw error.response.data;
    }
};

export const loginUser = async (data) => {
    try {
        const response = await apiClient.post('/auth/login', data);
        localStorage.setItem('token', response.data.access_token); // Сохраняем токен
        return response.data;
    } catch (error) {
        console.error('Login failed:', error.response.data);
        throw error.response.data;
    }
};

// Добавление токена авторизации
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // Сохраняйте токен в localStorage после логина
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;
