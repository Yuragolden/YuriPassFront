import React, { useState, useEffect } from 'react';
import { PlusOutlined, UserOutlined, EyeInvisibleOutlined, EyeTwoTone, RollbackOutlined , ShareAltOutlined } from '@ant-design/icons';
import { Button, Tooltip, Modal, Input, Select, message, Switch } from 'antd';
import axios from './axiosConfg';
import { usePasswordContext } from './PasswordContext';
import {addPasswordItem, addPasswordItemByAdmin} from "./crud_operation";
import './styles.css';
import './save_new_password.css'

const { Option } = Select;
const user_id = localStorage.getItem('userId');

const SaveNewPassword = ({ userId, onPasswordAdd, onSetGroupItems }) => {
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
    const [newPasswordForUser, setNewPasswordForUser] = useState('');
    const [strengthMessage, setStrengthMessage] = useState('');
    const [strengthScore, setStrengthScore] = useState(0);
    const [loading, setLoading] = useState(false);
    // const [isSharingEnabled, setIsSharingEnabled] = useState(false);
    const [isAdmin, setIsAdmin] = useState();
    const [isSwitchEnabled, setIsSwitchEnabled] = useState(false);
    const token = localStorage.getItem('token');

    const [isSharingEnabled, setIsSharingEnabled] = useState(true);
    const [sharedGroups, setSharedGroups] = useState([]);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`/folders/user/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` } // Убедитесь, что токен добавлен в заголовок
                });
                if(!response.data) {
                    console.log("dura ne rabotaent")
                }

                // Добавляем папку "Unlisted" в начало списка
                const groupsWithUnlisted = [
                    { groupId: 'null', groupName: 'Без папки' },
                    ...response.data.map(group => ({
                        groupId: group.id,
                        groupName: group.name
                    })),
                ];
                setGroupOptions(groupsWithUnlisted);
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
    if (loading) return;

    if (selectedGroup === null && newGroupName.trim() === '') {
        message.error("Пожалуйста выберите группу или введите название для новой.");
        return;
    }

    if (urlField && !isValidUrl(urlField)) {
        setUrlError('Неверный URL');
        return;
    }


    setLoading(true);

    // If a new group name is entered, create the group first
    if (newGroupName.trim() !== '') {

        console.log("newGroupName");
        console.log(newGroupName);

        createNewGroup(newGroupName).then((newGroupId) => {
            savePassword(newGroupId);

        }).catch((error) => {
            console.error('Ошибка при создании папки:', error);
            message.error('Невозможно создать папку');
            setLoading(false);
        });
    } else {
        const groupIdToUse = selectedGroup === 'null' ? null : selectedGroup;
        savePassword(groupIdToUse);
    }
    setLoading(false);

};

    const savePassword = (groupIdToUse) => {
        if (!fieldName || !username || !password) {
            message.error('Пожалуйста, заполните все обязательные поля');
            return;
        }

        const newPasswordItem = {
            name: fieldName,
            login: username,
            password: password,
            folder_id: groupIdToUse,
            user_id: userId,
            comment: comments || null,
            url: urlField || null,
        };

        console.log("pered add password item")

        if(!isSwitchEnabled){
            addPasswordItem(newPasswordItem, userId)
            .then((newItem) => {
                message.success('Новая запись успешно создана');
                onPasswordAdd(newItem);
                onSetGroupItems(newItem[0])
                setOpen(false);
            })
            .catch((error) => {
                console.error('Ошибка при добавлении записи: ', error);
                message.error('Невозможно добавить запись');
            })
            .finally(() => {
                setLoading(false);
            });
        } else {
            console.log(newPasswordForUser);
            addPasswordItemByAdmin(newPasswordItem, newPasswordForUser)
                .then((data) => {
                message.success("Пароль успешно добавлен")})
                .catch((error) => {
                    console.error('Ошибка при добавлении записи администратором: ', error);
                    message.error('Не удалось добавить пароль для пользователя.');
                });
        }
    };

    const handleCancel = () => {
        setOpen(false);
        setUrlError(null);
    };

    const generatePassword = () => {
        axios.post('passwords/generate', {})
            .then(response => {
                if (response.data && response.data) {
                    setPassword(response.data);
                    message.success('Пароль успешно сгенерирован');
                    updatePasswordStrength(response.data);
                } else {
                    message.error('Неверный ответ от сервера');
                }
            })
            .catch(error => {
                console.error('Ошибка при генерации пароля: ', error);
                message.error('Ошибка при генерации пароля');
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
            message: ["Очень простой", "Простой", "Средний", "Сложный", "Очень сложный"][score],
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

    const inviteUser = async (groupId, emailOrUsername, ) => {
        if (!groupId || groupId === 'null') {
            message.error("Пожалуйста выберите доступную папку.");
            return;
        }

        try {
            const response = await axios.post(`companies/passwords/admin-add`, {
                user: emailOrUsername,
                admin_id: user_id,
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
            console.log("user_id")
            console.log(user_id)
            console.log("groupName")
            console.log(groupName)
            const response = await fetch(`http://127.0.0.1:8000/folders/${user_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: groupName }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error('Не удалось создать группу');
            }

            const newGroup = await response.json();
            console.log("newGroup v konce")
            console.log(newGroup)
            return newGroup.id;
        } catch (error) {
            console.error(error);
            alert('Ошибка при создании группы');
            return null;
        }
    }

    useEffect(() => {
        // Проверяем статус администратора из localStorage
        const adminStatus = localStorage.getItem('is_admin') === 'true';
        setIsAdmin(adminStatus);

    }, []);

    const handleSwitchChange = (checked) => {
        if (!isAdmin) {
            message.error('Вы не имеете прав для выполнения этого действия');
            return;
        }
        setIsSwitchEnabled(checked);
        console.log(isSwitchEnabled);
        message.success(`Кнопка ${checked ? 'включена' : 'выключена'}`);
    };

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
                    <div className="group" style={{width: '50%'}}>
                        <Select
                            style={{width: '100%', marginBottom: '10px'}}
                            placeholder="Выбрать папку"
                            value={selectedGroup || null} // selectedGroup — это выбранный элемент
                            onChange={(value) => {
                                setSelectedGroup(value);  // Устанавливаем выбранную группу
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
                                        <ShareAltOutlined style={{marginLeft: '10px', color: '#1677ff'}}/>
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
                    <div className={'share-box'} style={{borderRadius: '5px', height: 'auto'}}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '5px',
                                width: '100%',
                            }}
                        >
                            <span style={{fontWeight: '500', marginRight: 'auto'}}>
                              Поделиться паролем
                            </span>
                            <Switch
                                checked={isSwitchEnabled}
                                onChange={handleSwitchChange}
                                className="share-switch"
                            />
                        </div>
                        <Input
                            placeholder="Введите email"
                            style={{width: '100%', height: '31px'}}
                            disabled={!isSwitchEnabled}
                            onChange={(e) => setNewPasswordForUser(e.target.value)}
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

