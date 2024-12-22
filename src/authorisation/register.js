import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from '../axiosConfg';
import { message } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'; // Import icons
import { registerUser } from '../api';

import './login.css';

const Register = ({ onLogout }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent the default form submission

        // Clear previous errors
        setErrors({});

        // Check if passwords match
        if (password !== confirmPassword) {
            setErrors((prevErrors) => ({ ...prevErrors, confirmPassword: 'Пароли не совпадают' }));
            return;
        }

        try {
            // Registration request
            const response = await registerUser({ username, email, password });
            message.success('Успешная регистрация! Перенаправляем на вход...');
            navigate('/login'); // Redirect to the login page

        } catch (error) {
            if (error.response) {
                console.log('Response error:', error.response.data);

                // Handle validation errors from the response (e.g., email, password)
                const validationErrors = error.response.data;
                const formattedErrors = {};

                for (const field in validationErrors) {
                    formattedErrors[field] = validationErrors[field].join(' ');
                }

                setErrors(formattedErrors); // Set the field-specific errors
                // message.error('Registration failed. Please check the form for errors.');
            } else if (error.request) {
                console.log('No response received:', error.request);
                message.error('Нет ответа с сервера'); // Error notification
            } else {
                console.log('Error setting up request:', error.message);
                message.error('Ошибка при запросе'); // Error notification
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="form-wrapper">
                <h2>Регистрация</h2>

                {/* Display general form error messages */}
                {/*{Object.keys(errors).length > 0 && (*/}
                {/*    <div className="error-container">*/}
                {/*        {Object.entries(errors).map(([field, errorMessage]) => (*/}
                {/*            <p className="error" key={field}>{field}: {errorMessage}</p>*/}
                {/*        ))}*/}
                {/*    </div>*/}
                {/*)}*/}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Имя пользователя:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        {errors.username && <p className="error">{errors.username}</p>}
                    </div>
                    <div className="input-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {errors.email && <p className="error">{errors.email}</p>}
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
                        {errors.password && <p className="error">{errors.password}</p>}
                    </div>
                    <div className="input-group">
                        <label>Подтвердите пароль:</label>
                        <div className="password-wrapper">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <span
                                className="toggle-password"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{ cursor: 'pointer' }}
                            >
                                {showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            </span>
                        </div>
                        {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
                    </div>
                    <button type="submit" className="submit-btn">Регистрация</button>
                    <div className="old-user">
                        <p className="have-an-acc">
                            Уже есть аккаунт?
                            <span
                                className="login-link"
                                onClick={() => navigate('/login')}
                                style={{ cursor: 'pointer', marginLeft: '5px' }}
                            >
                                Войти
                            </span>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
