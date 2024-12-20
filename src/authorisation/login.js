import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfg';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { message } from 'antd';
import './login.css';


const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('/token/',
                { username, password },
                {
                    onUnauthorized: () => navigate('/login') // Handle 401 Unauthorized here
                }
            );
            localStorage.setItem('token', response.data.access);
            message.success('Login successful! Welcome...');
            setError('');
            navigate('/passwords'); // Redirect after login success
        } catch (err) {
            console.log('Full error:', err);  // Log the entire error object
            const errorMessage = err.response?.data?.detail || 'Unknown error occurred.';
            setError(errorMessage);  // Display the error
            // message.error(`Login failed: ${errorMessage}`);
        }
    };

    return (
        <div className="auth-container">
            <div className="form-wrapper">
                <h2>Вход</h2>
                {error && <p className="error">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Имя пользователя:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Пароль:</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ cursor: 'pointer' }}
                            >
                                {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            </span>
                        </div>
                    </div>
                    <button type="submit" className="submit-btn">Войти</button>
                    <div className="new-user">
                        <p className="new-to-yuripass">
                            Впервые в YuriPass?
                            <span
                                className="register-link"
                                onClick={() => navigate('/register')}
                                style={{ cursor: 'pointer', marginLeft: '5px' }}
                            >
                                Зарегистрироваться
                            </span>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
