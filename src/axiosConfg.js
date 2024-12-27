// import axios from 'axios';
// import { message } from 'antd';
//
// // Create an Axios instance
// const axiosInstance = axios.create({
//     // Use the environment variable for the base URL
//     baseURL: 'http://127.0.0.1:8000',
//     headers:{
//         "Content-Type": "application/json"
//     }
// });
//
// // Interceptor to add token to headers
// axiosInstance.interceptors.request.use(
//     (config) => {
//         const token = localStorage.getItem('token'); // Retrieve token inside the interceptor
//         if (token) {
//             config.headers['Authorization'] = `Bearer ${token}`;
//             config.isAuthenticated = true; // Custom flag to track if the request is authenticated
//         }
//         config.headers['X-Requested-By'] = 'frontend'; // Add the custom header
//         return config;
//     },
//     (error) => Promise.reject(error)
// );
//
// // Response interceptor to handle errors
// axiosInstance.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         const token = localStorage.getItem('token');
//
//         // Only show the "session expired" message if the user was previously logged in
//         if (error.response && error.response.status === 401 && token) {
//             localStorage.removeItem('token'); // Remove the token if it's expired
//             message.error('Session expired, please log in again.');
//
//             if (typeof error.config?.onUnauthorized === 'function') {
//                 error.config.onUnauthorized(); // Trigger the onUnauthorized callback
//             }
//         }
//         return Promise.reject(error);
//     }
// );
//
// export default axiosInstance;
import axios from 'axios';
import { message } from 'antd';
import {jwtDecode} from 'jwt-decode';

// Create an Axios instance
const axiosInstance = axios.create({
    // Use the environment variable for the base URL
    baseURL: 'http://127.0.0.1:8000',
    headers:{
        "Content-Type": "application/json"
    }
});

// Interceptor to add token to headers and decode userId
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const userId = decodedToken.user_id; // Извлечение user_id из токена
                config.headers['Authorization'] = `Bearer ${token}`;
                config.isAuthenticated = true;
                config.userId = userId;  // Добавьте userId к конфигу запроса
            } catch (error) {
                console.error("Error decoding the token", error);
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                message.error("Invalid token. Please log in again.");
            }
        }
        config.headers['X-Requested-By'] = 'frontend';
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
