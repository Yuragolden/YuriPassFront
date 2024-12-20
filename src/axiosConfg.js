

import axios from 'axios';
import { message } from 'antd';

// Create an Axios instance
const axiosInstance = axios.create({
    // Use the environment variable for the base URL
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/', // Default to localhost in development
});

// Interceptor to add token to headers
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Retrieve token inside the interceptor
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            config.isAuthenticated = true; // Custom flag to track if the request is authenticated
        }
        config.headers['X-Requested-By'] = 'frontend'; // Add the custom header
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const token = localStorage.getItem('token');

        // Only show the "session expired" message if the user was previously logged in
        if (error.response && error.response.status === 401 && token) {
            localStorage.removeItem('token'); // Remove the token if it's expired
            message.error('Session expired, please log in again.');

            if (typeof error.config?.onUnauthorized === 'function') {
                error.config.onUnauthorized(); // Trigger the onUnauthorized callback
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
