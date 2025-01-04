import axios from './axiosConfg';

export const registerUser = async (data) => {
    try {
        const response = await axios.post('/auth/register', data);
        return response.data;
    } catch (error) {
        console.error('Registration failed:', error.response.data);
        throw error.response.data;
    }
};

export const loginUser = async (data) => {
    try {
        const response = await axios.post('/auth/login', data);
        localStorage.setItem('token', response.data.access_token); // Сохраняем токен
        localStorage.setItem('is_admin', response.data.is_admin);
        return response.data;
    } catch (error) {
        console.error('Login failed:', error.response.data);
        throw error.response.data;
    }
};