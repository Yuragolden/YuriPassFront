import React, { useState, useEffect } from 'react';
import { PlusOutlined, UserOutlined, EyeInvisibleOutlined, EyeTwoTone, RollbackOutlined , ShareAltOutlined } from '@ant-design/icons';
import { Button, Tooltip, Modal, Input, Select, message, Switch } from 'antd';
import axios from './axiosConfg';
import { usePasswordContext } from './PasswordContext';
import {addPasswordItem} from "./crud_operation";
import './styles.css';
import './save_new_password.css'

const { Option } = Select;

const SaveNewPassword = ({ userId, onPasswordAdd }) => {
    const [open, setOpen] = useState(false);
    const [fieldName, setFieldName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupOptions, setGroupOptions] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [comments, setComments] = useState('');
    const [urlField, setUrlField] = useState('');
    const [urlError, setUrlError] = useState(null);
    const [strengthMessage, setStrengthMessage] = useState('');
    const [strengthScore, setStrengthScore] = useState(0);
    const [loading, setLoading] = useState(false); // Loading state
    const [isSharingEnabled, setIsSharingEnabled] = useState(true);
    const [sharedGroups, setSharedGroups] = useState([]);

    const token = localStorage.getItem('token');
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const token = localStorage.getItem('token');
                console.log("v nachale" + token)
                const response = await axios.get('/folders', {
                    headers: { Authorization: `Bearer ${token}` } // Убедитесь, что токен добавлен в заголовок
                });
                if(!response.data) {
                    console.log("dura ne rabotaent")
                }

                // Добавляем папку "Unlisted" в начало списка
                const groupsWithUnlisted = [
                    { groupId: 'null', groupName: '' }, // Можно добавить "Unlisted"
                    ...response.data.map(group => ({
                        groupId: group.id,    // Используем поле id из ответа
                        groupName: group.name // Используем поле name из ответа
                    })),
                ];

                setGroupOptions(groupsWithUnlisted); // Устанавливаем полученные группы в состояние
            } catch (error) {
                console.error('Error fetching groups:', error);
            }
        };

        fetchGroups();
    },[token]);  // Вызываем, когда меняется токен


    const showModal = () => {
        setFieldName('');
        setUsername('');
        setPassword('');
        setSelectedGroup(null);
        setNewGroupName('');
        setComments('');
        setUrlField('');
        setStrengthMessage('');
        setStrengthScore(0);
        setOpen(true);
    };

   const handleOk = () => {
    if (loading) return; // Prevent multiple clicks while loading

    // Ensure at least a group is selected or a new group is being created
    if (selectedGroup === null && newGroupName.trim() === '') {
        message.error("Please select a group or enter a new group name.");
        return;
    }
       console.log(selectedGroup);

    if (urlField && !isValidUrl(urlField)) {
        setUrlError('Invalid URL');
        return;
    }
       console.log(urlField);


    setLoading(true); // Set loading state to true

    // If a new group name is entered, create the group first
    if (newGroupName.trim() !== '') {
        console.log(newGroupName);
        createNewGroup(newGroupName).then((newGroupId) => {
            console.log("создание папки")

            savePassword(newGroupId); // Use the new groupId to save the password
            console.log("создание папки 2")

        }).catch((error) => {
            console.error('Ошибка при создании папки:', error);
            message.error('Невозмножно создать папку');
            setLoading(false);
        });
    } else {
        const groupIdToUse = selectedGroup === 'null' ? null : selectedGroup;
        console.log(groupIdToUse)
        savePassword(groupIdToUse); // Save password with selected group
    }
    setLoading(false);

};

    const savePassword = (groupIdToUse) => {
        if (!fieldName || !username || !password) {
            message.error('Пожалуйста, заполните все обязательные поля');
            return;
        }

        const newPasswordItem = {
            name: fieldName,          // Убедитесь, что все эти поля содержат корректные значения
            login: username,
            password: password,
            folder_id: groupIdToUse,
            user_id: userId,
            comment: comments || null,    // Можно передавать null, если комментарий пустой
            url: urlField || null,        // Можно передавать null, если URL пустой
        };

        addPasswordItem(newPasswordItem, groupIdToUse)
            .then((newItem) => {
                message.success('Новая запись успешно создана');
                console.log("a tit")
                onPasswordAdd(newItem);
                setOpen(false);
            })
            .catch((error) => {
                console.error('Ошибка при добавлении записи: ', error);
                message.error('Невозможно добавить запись');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleCancel = () => {
        setOpen(false);
        setUrlError(null);
    };

    const generatePassword = () => {
        axios.post('password-items/generate/', {})
            .then(response => {
                if (response.data && response.data.generated_password) {
                    setPassword(response.data.generated_password);
                    message.success('Password generated successfully');
                    updatePasswordStrength(response.data.generated_password);
                } else {
                    message.error('Unexpected response structure');
                }
            })
            .catch(error => {
                console.error('Error generating password:', error);
                message.error('Failed to generate password');
            });
    };

    const getPasswordStrength = (value) => {
        let score = 0;
        const length = value.length;
        const hasUppercase = /[A-Z]/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasNumbers = /[0-9]/.test(value);
        const hasSymbols = /[^0-9a-zA-Z]/.test(value);

        if (length > 5) score++;
        if (hasUppercase ) score++;
        if (hasLowercase) score++;
        if (hasNumbers) score++;
        if (hasSymbols) score++;

        return {
            score,
            message: ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"][score],
        };
    };

    const updatePasswordStrength = (value) => {
        const { score, message } = getPasswordStrength(value);
        setStrengthMessage(message);
        setStrengthScore(score);
    };

    const handlePasswordChange = (e) => {
        const newValue = e.target.value;
        setPassword(newValue);
        updatePasswordStrength(newValue);
    };

    const isValidUrl = (value) => {
        const urlPattern = new RegExp(
            '^(https?:\\/\\/)?' +
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|(\\d{1,3}\\.){3}\\d{1,3})' +
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
            '(\\?[;&a-z\\d%_.~+=-]*)?' +
            '(\\#[-a-z\\d_]*)?$', 'i'
        );
        return !!urlPattern.test(value);
    };

    const handleUrlChange = (e) => {
        const value = e.target.value;
        setUrlField(value);
        if (!isValidUrl(value) && value) {
            setUrlError('Invalid URL');
        } else {
            setUrlError(null);
        }
    };

    const inviteUser = async (groupId, emailOrUsername) => {
        if (!groupId || groupId === 'null') {
            message.error("Please select a valid group before inviting users.");
            return;
        }

        try {
            const response = await axios.post(`http://127.0.0.1:8000/api/groups/${groupId}/invite/`, {
                user: emailOrUsername,
            });

            if (response.status === 200) {
                message.success('User invited successfully');
            }
        } catch (error) {
            console.error('Error inviting user:', error);
            message.error('Failed to invite user. Please try again.');
        }
    };

    async function createNewGroup(groupName) {
        try {
            const response = await fetch('/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: groupName }),
            });

            if (!response.ok) {
                const errorText = await response.text(); // Получаем текст ошибки
                console.error('Error response:', errorText); // Логируем ответ
                throw new Error('Не удалось создать группу');
            }

            const newGroup = await response.json();
            return newGroup.id;
        } catch (error) {
            console.error(error);
            alert('Ошибка при создании группы');
            return null;
        }
    }

    return (
        <>
            <Tooltip title="Add new password">
                <Button
                    type="primary"
                    shape="circle"
                    icon={<PlusOutlined />}
                    onClick={showModal}
                />
            </Tooltip>

            <Modal
                title="Add New Password"
                centered
                open={open}
                onOk={handleOk}
                onCancel={handleCancel}
                width={600}
                className="modal-common"
                okButtonProps={{loading}} // Add loading to the OK button
            >
                <p>Введите данные для нового пароля...</p>

                <Input
                    placeholder="Название"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    style={{marginBottom: '10px'}}
                />
                <Input
                    placeholder="Имя пользователя"
                    prefix={<UserOutlined/>}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}

                />

                <div >
                    <div style={{
                        height: '10px',
                        width: `${strengthScore * 24.75}%`,
                        backgroundColor: ['#D73F40', '#DC6551', '#F2B84F', '#BDE952', '#3ba62f'][strengthScore],
                        transition: 'width 0.3s',
                        borderRadius: '4px',
                        marginTop: '3px',
                        marginBottom: '3px'
                    }}/>
                </div>

                <Input.Password
                    placeholder="Введите пароль"
                    value={password}
                    onChange={handlePasswordChange}
                    iconRender={(visible) => (visible ? <EyeTwoTone/> : <EyeInvisibleOutlined/>)}
                    style={{width: '50%', marginBottom: '10px', height: '31px'}}
                />
                <Button type="primary" style={{width: '45%', marginBottom: '10px', marginLeft: '5%'}}
                        onClick={generatePassword}>
                    Сгенерировать пароль
                </Button>

            <div className={'shared-group'}>
                <div className="group" style={{ width: '50%' }}>

                    <Select
                        style={{ width: '100%', marginBottom: '10px' }}
                        placeholder="Выбрать папку"
                        value={selectedGroup || undefined} // selectedGroup — это выбранный элемент
                        onChange={(value) => {
                            setSelectedGroup(value);  // Устанавливаем выбранную группу
                            setIsSharingEnabled(sharedGroups.includes(value));  // Если это общая группа
                        }}
                        allowClear
                        showSearch
                        notFoundContent="Папки не найдены"
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {groupOptions.map((group) => (
                            <Option key={group.groupId} value={group.groupId}>
                                {group.groupName} {/* Отображаем название группы */}
                                {sharedGroups.includes(group.groupId) && (
                                    <ShareAltOutlined style={{ marginLeft: '10px', color: '#1677ff' }} />
                                )}
                            </Option>
                        ))}
                    </Select>

                    {

                <Input
                    placeholder="Имя для новой папки"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}

                />
                        /* Conditional Rendering of Share Icon */}
                    {selectedGroup && selectedGroup !== 'null' && isSharingEnabled && (
                        <ShareAltOutlined
                            style={{
                                position: 'absolute',
                                right: '-30px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '18px',
                                color: '#1677ff'
                            }}
                        />
                    )}

                </div>
                <div className={'share-box'} style={{borderRadius: '5px',height:'auto'}}>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: '5px', width: '100%'}}>
                        <span style={{fontWeight: '500', marginRight: 'auto'}}>Share Password</span>
                        <Switch
                            defaultChecked={false}
                            onChange={(checked) => {
                                setIsSharingEnabled(checked);
                                if (selectedGroup && selectedGroup !== 'null') {
                                    if (checked) {
                                        // Add the group to the sharedGroups list if not already present
                                        setSharedGroups((prevSharedGroups) => {
                                            if (!prevSharedGroups.includes(selectedGroup)) {
                                                return [...prevSharedGroups, selectedGroup];
                                            }
                                            return prevSharedGroups;
                                        });
                                    } else {
                                        // Remove the group from the sharedGroups list if unchecked
                                        setSharedGroups((prevSharedGroups) =>
                                            prevSharedGroups.filter((groupId) => groupId !== selectedGroup)
                                        );
                                    }
                                }
                            }}
                            className="share-switch"
                        />

                    </div>
                    <Input
                        placeholder="Введите email"
                        style={{width: '100%', height:'31px'}}
                        disabled={!isSharingEnabled}
                    />

                </div>

            </div>
                <Input
                    placeholder="Комментарии (опционально)"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}

                />

                <Input
                    placeholder="URL (опционально)"
                    value={urlField}
                    onChange={handleUrlChange}

                    status={urlError ? 'error' : ''}
                />
                {urlError && <span style={{color: 'red'}}>{urlError}</span>}


            </Modal>
        </>
    );
};

export default SaveNewPassword;

