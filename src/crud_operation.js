import axios from './axiosConfg';
const userId = localStorage.getItem('userId');

export const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }  // Correct usage of token for authorization
};

export function addPasswordItem(newItem, groupId) {
    const payload = { ...newItem };
    for (let key in payload) {
        console.log(key, payload[key]);
    }

    return axios.post(`/passwords/create/${userId}`, payload, config)  // Отправляем POST-запрос с данными
        .then(response => {
            console.log('Пароль успешно добавлен:', response.data);
            const createdPassId = response.data.id;  // Получаем ID нового пароля
            return fetchPasswordById(createdPassId);  // Получаем информацию о добавленном пароле
        })
        .catch(error => {
            if (error.response) {
                console.error('Ответ от сервера:', error.response.data);
            } else if (error.request) {
                console.error('Запрос был отправлен, но нет ответа:', error.request);
            } else {
                console.error('Произошла ошибка:', error.message);
            }
        });
}

// Helper function to fetch a password item by its ID
export const fetchPasswordById = (passId) => {
    console.log(passId)
    return axios.get(`/passwords/user/${passId}/${userId}`, config)
        .then(response => {
            // Return the decrypted password item
            return response.data;
        })
        .catch(error => {
            console.error('Ошибка при получении пароля по ID:', error);
            throw error;
        });
};

export const updatePasswordItem = (id, folder_id, updatedData, setData) => {
    // Adjust URL for unlisted items
    const url = `passwords/${id}`;

    // Remove the groupId from the data if it's for unlisted items
    const dataToSend = { ...updatedData };
    if (dataToSend.folder_id === 'null' || dataToSend.folder_id === 0 || dataToSend.folder_id === undefined) {
        dataToSend.folder_id = null;
    }

    console.log("id")
    console.log(id)

    console.log("dataToSend")
    console.log(dataToSend)

    return axios.put(url, dataToSend, config)
        .then(response => {
            console.log('response')
            console.log(response)
            if (response.data && typeof response.data === 'object') {
                const updatedPasswordItem = {
                    id: response.data.id,
                    name: response.data.name,
                    login: response.data.login,
                    password: response.data.password,
                    folder_id: response.data.folder_id,
                    user_id: response.data.user_id,
                    comment: response.data.comment,
                    url: response.data.url,
                };

                // Call the passed-in setData function to update the state
                if (typeof setData === 'function') {
                    console.log("sosi")
                    setData(prevData =>
                        prevData.map(item =>
                            item.id === updatedPasswordItem.id ? updatedPasswordItem : item
                        )
                    );
                } else {
                    console.error('setData is not a function');
                }
            } else {
                console.error('Unexpected response format:', response.data);
            }

            return response.data;
        })
        .catch(error => {
            console.error('Error updating the password item:', error);
            throw error;
        });
};

function deleteGroup(groupId, setGroupItems) {
    axios.delete(`folders/${groupId}/`, config)
        .then((response) => {
            if (response.status === 204) {
                console.log(`Папка ${groupId} успешно удалена`);

                // Update the sidebar to remove the deleted group
                setGroupItems(prevGroupItems =>
                    prevGroupItems.filter(group => group.key !== `group-${groupId}`)
                );
            } else {
                throw new Error('Failed to delete the group.');
            }
        })
        .catch((error) => {
            console.error('Error deleting the group:', error);
        });
}


function checkAndDeleteGroup(groupId, setData, setGroupItems) {
    // Fetch all password items for this group to see if any are left
    axios.get(`/passwords/folder/${userId}/${groupId}`, config)
        .then(response => {
            const remainingItems = response.data || [];

            if (remainingItems.length === 0) {
                // Group is empty, delete the group
                deleteGroup(groupId, setGroupItems);
            } else {
                // Update state with remaining password items if group is not empty
                setData(remainingItems);
            }
        })
        .catch(error => {
            console.error('Error checking if group is empty:', error);
        });
}


export function deleteData(id, folder_id, setData, onSuccess, setGroupItems) {
    // Delete password item
    return axios.delete(`passwords/${id}`, config)
        .then((response) => {
            if (response.status === 200) {
                console.log('Password item deleted successfully');

                // Update the table by removing the deleted item from the data state
                setData(prevData => prevData.filter(item => item.id !== id));

                // After successful deletion, check if the group is empty
                checkAndDeleteGroup(folder_id, setData, setGroupItems);

                // If deletion was successful, update the UI
                onSuccess();  // Close the modal, update state, etc.
            } else {
                throw new Error('Failed to delete the password item.');
            }
        })
        .catch((error) => {
            console.error('Error during password item deletion:', error);
            throw error;
        });
}

export function fetchAllPasswordItems(setData) {
    axios.get(`/passwords/user/${userId}`, config)
        .then(response => {
            if (response.data && Array.isArray(response.data)) {
                const mappedData = response.data.map(item => ({
                    id: item.id,
                    name: item.name,
                    login: item.login,
                    password: item.password,
                    folder_id: item.folder_id,
                    user_id: item.user_id,
                    comment: item.comment,
                    url: item.url,
                    isPasswordVisible: false,
                }));
                setData(mappedData);
            } else {
                console.error('Неверный формат, ожидается массив:', response.data);
            }
        })
        .catch(error => {
            console.error('Ошибка при обработке записей пользователя: ', error);
        });
}

export function fetchUnlistedPasswordItems(setData) {
    axios.get(`/passwords/folders/unlisted/${userId}`, config)
        .then(response => {
            if (response.data && Array.isArray(response.data)) {
                const mappedData = response.data.map(item => ({
                    id: item.id,
                    name: item.name,
                    login: item.login,
                    password: item.password,
                    folder_id: item.folder_id,
                    user_id: item.user_id,
                    comment: item.comment,
                    url: item.url,
                    isPasswordVisible: false,
                }));
                setData(mappedData);
            } else {
                console.error('Unexpected response format or data is not an array:', response.data);
            }
        })
        .catch(error => {
            console.error('Error fetching unlisted password items:', error);
        });
}

export function dataFetching(groupId, setData) {
    axios.get(`/passwords/folder/${userId}/${groupId}`, config)
        .then(response => {
            console.log(response.data);
            const passwordItemsWithGroupNames = response.data.map(item => ({
                id: item.id,
                name: item.name,
                login: item.login,
                password: item.password,
                folder_id: item.folder_id,
                user_id: item.user_id,
                comment: item.comment,
                url: item.url,
                isPasswordVisible: false,
            }));
            setData(passwordItemsWithGroupNames);
        })
        .catch(error => {
            console.error('Error fetching password items for group:', error);
        });
}


export const fetchHistory = async (passwordId) => {
    try {
        const response = await axios.get(`/passwords/user/${userId}/${passwordId}`);
        console.log('History response:', response.data[0].updated_at); // Log the successful response
        return response.data;
    } catch (error) {
        console.error('Error fetching history:', error.response || error); // Log the entire error object
        throw error;
    }
};
