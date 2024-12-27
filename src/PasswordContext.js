import React, { createContext, useState, useContext } from 'react';
import axios from './axiosConfg';
import { config } from './crud_operation';
import { message } from 'antd';

const PasswordContext = createContext();
const userId = localStorage.getItem('userId');

export const PasswordProvider = ({ children }) => {
    const [passwordItems, setPasswordItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // Add currentPage here


    const fetchPasswords = () => {
        axios.get('/passwords', config)
            .then(response => {
                console.log('Ответ от API:', response.data);
                if (Array.isArray(response.data)) {
                    setPasswordItems(response.data);  // Обновляем состояние
                } else {
                    console.error('Неверный формат, ожидается массив:', response.data);
                }
            })
            .catch(error => {
                console.error('Ошибка при обработке данных:', error);
            });
    };


    const addPassword = (newPassword) => {
        setPasswordItems(prevItems => {
            // Ensure prevItems is an array
            return Array.isArray(prevItems) ? [...prevItems, newPassword] : [newPassword];
        });
    };

    const updatePassword = (updatedPassword) => {
        setPasswordItems(prevItems => {
            return Array.isArray(prevItems)
                ? prevItems.map(item => item.passId === updatedPassword.passId ? updatedPassword : item)
                : [updatedPassword];
        });
    };

    const deletePassword = (passwordId) => {
        setPasswordItems(prevItems => {
            return Array.isArray(prevItems)
                ? prevItems.filter(item => item.passId !== passwordId)
                : [];
        });
    };

    return (
        <PasswordContext.Provider value={{
            passwordItems,
            fetchPasswords,
            addPassword,
            updatePassword,
            deletePassword,
            currentPage,
            setCurrentPage,
        }}>
            {children}
        </PasswordContext.Provider>
    );
};

export const usePasswordContext = () => useContext(PasswordContext);
