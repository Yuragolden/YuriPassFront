import React, { useState, useEffect,useRef  } from 'react';
import { Table, Modal, Tabs, Input, Typography, Button, message,Breadcrumb, Switch } from 'antd';
import { MoreOutlined, EyeOutlined, EyeInvisibleOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import {
    config,
    deleteData,
    fetchHistory,
    updatePasswordItem
} from './crud_operation';
import axios from './axiosConfg';
import './styles.css';
import './dark-mode.css'

const { Search } = Input;

const { TabPane } = Tabs;

const { Text } = Typography;

const onChange = (checked) => {
    console.log(`switch to ${checked}`); // Logs the state of the switch
};


const MainPage = ({ groupId, userId, setGroupItems, passwordItems, setPasswordItems,breadcrumbItems, selectedGroupId }) => {
    const [data, setData] = useState([]);
    const [clickedRow, setClickedRow] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [editedItemName, setEditedItemName] = useState('');
    const [editedUserName, setEditedUserName] = useState('');
    const [editedPassword, setEditedPassword] = useState('');
    const [editedGroup, setEditedGroup] = useState('');
    const [editedComment, setEditedComment] = useState('');
    const [editedUrl, setEditedUrl] = useState(''); // Added for URL field

    const [originalItemName, setOriginalItemName] = useState('');
    const [originalUserName, setOriginalUserName] = useState('');
    const [originalPassword, setOriginalPassword] = useState('');
    const [originalGroup, setOriginalGroup] = useState('');
    const [originalComment, setOriginalComment] = useState('');
    const [originalUrl, setOriginalUrl] = useState(''); // Added for original URL

    const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const [loading, setLoading] = useState(false);
    const [searchMode, setSearchMode] = useState(false); // To track if we are in search mode
    const [historyLoading, setHistoryLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const [filteredItems, setFilteredItems] = useState([]); // Отфильтрованные записи
    const [isSearching, setIsSearching] = useState(false); // Индикатор состояния поиска




    const toggleDarkMode = (checked) => {
        console.log(`Switch toggled: ${checked ? "Dark Mode ON" : "Light Mode ON"}`);
        if (checked) {
            document.body.classList.add("dark-mode");
            console.log("Dark mode enabled.");
        } else {
            document.body.classList.remove("dark-mode");
            console.log("Dark mode disabled.");
        }
        localStorage.setItem("darkMode", checked);
        setIsDarkMode(checked);
    };
    useEffect(() => {
        const savedPreference = localStorage.getItem("darkMode") === "true";
        console.log(`Restoring dark mode preference: ${savedPreference ? "ON" : "OFF"}`);
        if (savedPreference) {
            document.body.classList.add("dark-mode");
            setIsDarkMode(true);
        }
    }, []);

    const onSearch = (value) => {
        const trimmedQuery = value.trim().toLowerCase();
        setSearchMode(Boolean(trimmedQuery));

        if (!trimmedQuery) {
            fetchDataForCurrentGroup();
            return;
        }

        // Локальная фильтрация данных
        const filteredItems = passwordItems.filter((item) =>
            item.name.toLowerCase().includes(trimmedQuery)
        );

        setPasswordItems(filteredItems);
    };

    const fetchDataForCurrentGroup = () => {
        if (selectedGroupId === null || selectedGroupId === -1) {
            fetchDataForAllGroups(); // Все записи
        } else if (selectedGroupId === 'X') {
            fetchDataForUnlistedGroups(); // Записи "Без папки"
        } else {
            dataFetching(selectedGroupId, setPasswordItems); // Записи для конкретной папки
        }
    };




    const fetchSearchResults = (url, page) => {
        setLoading(true);
        axios.get(url)
            .then((response) => {
                const data = response.data;
                setPasswordItems(data.passwords);
            })
            .catch((error) => {
                console.error('Error fetching search results:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    };


    useEffect(() => {
        const isUnchanged =
            editedItemName === originalItemName &&
            editedUserName === originalUserName &&
            editedPassword === originalPassword &&
            editedGroup === originalGroup &&
            editedComment === originalComment &&
            editedUrl === originalUrl; // Include URL in the check

        setIsSaveButtonDisabled(isUnchanged);
    }, [editedItemName, editedUserName, editedPassword, editedGroup, editedComment, editedUrl, originalItemName, originalUserName, originalPassword, originalGroup, originalComment, originalUrl]);


    const handleMenuClick = async (record) => {
        setClickedRow(record);
        setIsModalOpen(true);
        console.log("record clicked");
        console.log(record)

        try {

            let history = await fetchHistory(record.id);

            // Ensure that if no history exists, historyData is set to an empty array
            if (history && history[0].updated_at.length > 0) {
                setHistoryData(history);
            } else {
                setHistoryData([]);
            }
        } catch (error) {
            setHistoryData([]);
        }

        //новые значения
        setEditedItemName(record.name);
        setEditedUserName(record.login);
        setEditedPassword(record.password);
        setEditedGroup(record.folder_name);
        setEditedComment(record.comment);
        setEditedUrl(record.url);

        //начальные значения
        setOriginalItemName(record.name);
        setOriginalUserName(record.login);
        setOriginalPassword(record.password);
        setOriginalGroup(record.folder_name);
        setOriginalComment(record.comment);
        setOriginalUrl(record.url);
    };

    const handleSaveChanges = () => {
        if (!userId) {
            console.error("Пользователь с таким id не найден");
            return;
        }

        const effectiveGroupId = groupId === -1 ? clickedRow.groupId : groupId;

        console.log("clickedRow.id")
        console.log(clickedRow.id)

        const updatedData = {
            id: clickedRow.id,
            name: editedItemName,
            login: editedUserName,
            password: editedPassword,
            folder_name: editedGroup,
            folder_id: null,
            user_id: userId,
            comment: editedComment,
            url: editedUrl // Include the URL in the updated data
        };


        updatePasswordItem(clickedRow.id, updatedData, setData)
            .then((response) => {
                console.log("updatedData");
                console.log(updatedData);
                console.log("clickedRow.id")
                console.log(clickedRow.id)

                setPasswordItems((prevData) =>
                    prevData.map(item =>
                        item.id === clickedRow.id ? { ...updatedData, id: clickedRow.id } : item
                    )
                );
                message.success('Запись успешно обновлена');
                setIsModalOpen(false);
            })
            .catch((error) => {
                message.error('Ошибка при обновлении записи');
            });
    };

    const handleDelete = () => {
        Modal.confirm({
            title: 'Вы уверены что хотите удалить?',
            okText: 'Удалить',
            onOk() {
                if (clickedRow && clickedRow.id) {
                    deleteData(clickedRow.id, clickedRow.groupId, setPasswordItems, () => {
                        message.success('Запись успешно удалена');
                        setIsModalOpen(false);
                    }, setGroupItems)
                        .catch(error => {
                            message.error('Ошибка при удалении');
                        });
                } else {
                    message.error('Не выбран элемент для удаления.');
                }
            },
        });
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setClickedRow(null);
    };

    const toggleAllPasswordsVisibility = () => {
        const newVisibility = !isPasswordVisible;
        setIsPasswordVisible(newVisibility);

        // Update each password item's visibility state
        setPasswordItems(prevData =>
            prevData.map(item => ({
                ...item,
                isPasswordVisible: newVisibility,
            }))
        );
    };

     const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
        },

        {
            title: 'Логин',
            dataIndex: 'login',
            key: 'login',
        },

        {
            title: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Пароль</span>
                    <Button
                        type="link"
                        onClick={toggleAllPasswordsVisibility}
                        style={{ fontSize: '14px', color: '#4b6584' }}  // Adjust style to blend in
                    >
                        {isPasswordVisible ? 'Скрыть все' : 'Показать все'}
                    </Button>
                </div>
            ),
            dataIndex: 'password',
            key: 'password',
            render: (text, record) => {
                const passwordMasked = record.password ? '*'.repeat(record.password.length) : '';
                return (
                    <span>
                    {record.isPasswordVisible ? record.password : passwordMasked}
                        <span
                            style={{marginLeft: 8, cursor: 'pointer'}}
                            onClick={() => {
                                record.isPasswordVisible = !record.isPasswordVisible;
                                setPasswordItems([...passwordItems]);
                            }}
                        >
                            {record.isPasswordVisible ? <EyeInvisibleOutlined/> : <EyeOutlined/>}
                        </span>
                    </span>
                );
            },
        },

         {
             title: '',
             key: 'actions',
             render: (_, record) => (
                 <MoreOutlined
                     className="action-icon"
                     style={{cursor: 'pointer', fontSize: '24px'}}
                     onClick={() => handleMenuClick(record)}
                 />
             ),
         },
     ];

    const history_columns = [
        {
            title: 'Date',
            dataIndex: 'updated_at',
            key: 'Дата',
            render: (updatedAt) => {
                const [date] = updatedAt.split('T');
                return <span>{date}</span>;
            },
        },
        {
            title: 'Time',
            dataIndex: 'updated_at',
            key: 'Время',
            render: (updatedAt) => {
                let [, time] = updatedAt.split('T')
                time = time.slice(0, 8);
                return <span>{time}</span>;
            },
        },

    ];

    const filteredPasswordItems = passwordItems.filter(item => item !== undefined);

    const handleSearch = (query) => {
        if (!query) {
            // Если строка поиска пуста, показываем все записи
            setFilteredItems(passwordItems);
            setIsSearching(false);
            return;
        }

        const results = passwordItems.filter(item => {
            // Проверяем, что поля не null и приводим их к строке перед использованием toLowerCase
            return (
                (item.name && item.name.toLowerCase().includes(query.toLowerCase())) ||
                (item.login && item.login.toLowerCase().includes(query.toLowerCase())) ||
                (item.url && item.url.toLowerCase().includes(query.toLowerCase()))
            );
        });

        setFilteredItems(results); // Сохраняем результаты
        setIsSearching(true); // Указываем, что идет поиск
    };



    useEffect(() => {
        setFilteredItems([]); // Сброс фильтров
        setIsSearching(false); // Установка состояния "поиск выключен"
    }, [selectedGroupId]);

    useEffect(() => {
        setFilteredItems(passwordItems); // При изменении passwordItems обновляем filteredItems
    }, [passwordItems]);



    return (
        <div>
            <Search
                placeholder="Что будем искать?"
                onChange={(e) => handleSearch(e.target.value)}
                className="custom-search-bar"
            />

            <Breadcrumb style={{margin: '16px 0'}} items={breadcrumbItems}></Breadcrumb>

            <Table
                dataSource={filteredItems} // Исправляем с filteredPasswordItems на filteredItems
                columns={columns}
                rowKey={(record) => record.id ?? record.passId}
                loading={loading}
                pagination={false}
            />

            <Modal
                title="Детали записи"
                open={isModalOpen}
                onCancel={handleModalClose}
                footer={null}
                className="password-details-modal"
            >
                <Tabs defaultActiveKey="1">
                    <TabPane tab="Детали" key="1">
                        {clickedRow && (
                            <div>
                                <p><strong>Название:</strong> {clickedRow.name}</p>
                                <p><strong>Логин:</strong> {clickedRow.login}</p>
                                <p>
                                    <strong style={{marginRight: '10px'}}>Password:</strong>
                                    {isPasswordVisible ? clickedRow.password : '*'.repeat(clickedRow.password.length)}
                                    <Button
                                        type="link"
                                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                        icon={isPasswordVisible ? <EyeInvisibleOutlined/> : <EyeOutlined/>}
                                    />
                                </p>
                                <p>
                                    <strong>Папка:</strong> {clickedRow.folder_name ? clickedRow.folder_name : 'Без папки'}
                                </p>
                                {clickedRow.comment && (
                                    <p>
                                        <strong>Комментарии:</strong> {clickedRow.comment}
                                    </p>
                                )}
                                <p>
                                    <strong>URL:</strong> {clickedRow.url ? (
                                    <a href={clickedRow.url} target="_blank" rel="noopener noreferrer">
                                        {clickedRow.url}
                                    </a>
                                ) : (
                                    'Нет URL'
                                )}
                                </p>
                            </div>
                        )}
                    </TabPane>
                    <TabPane tab="История" key="2">
                        {historyData.length === 0 ? (
                            <p>Нет доступной истории.</p>
                        ) : (
                            <Table
                                columns={history_columns}
                                dataSource={Array.isArray(historyData) ? historyData : []}
                                rowKey={(record) => record.updated_at}
                                loading={historyLoading}
                                pagination={false}
                            />
                        )}
                    </TabPane>
                    <TabPane tab="Изменить" key="3">
                        {clickedRow && (
                            <div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Название</label>
                                    <Input
                                        placeholder="Название"
                                        value={editedItemName}
                                        onChange={(e) => setEditedItemName(e.target.value)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Логин</label>
                                    <Input
                                        placeholder="Логин"
                                        value={editedUserName}
                                        onChange={(e) => setEditedUserName(e.target.value)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Пароль</label>
                                    <Input.Password
                                        placeholder="Пароль"
                                        value={editedPassword}
                                        onChange={(e) => setEditedPassword(e.target.value)}
                                        iconRender={(visible) => (visible ? <EyeOutlined/> : <EyeInvisibleOutlined/>)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Папка</label>
                                    <Input
                                        placeholder="Папка"
                                        value={editedGroup}
                                        onChange={(e) => setEditedGroup(e.target.value)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Комментарий</label>
                                    <Input
                                        placeholder="Комментарий"
                                        value={editedComment}
                                        onChange={(e) => setEditedComment(e.target.value)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>URL</label>
                                    <Input
                                        placeholder="URL"
                                        value={editedUrl}
                                        onChange={(e) => setEditedUrl(e.target.value)}
                                    />
                                </div>
                                <Button
                                    type="primary"
                                    onClick={handleSaveChanges}
                                    disabled={isSaveButtonDisabled}
                                >
                                    Сохранить
                                </Button>
                                <Button danger onClick={handleDelete} style={{marginLeft: 8}}>
                                    Удалить
                                </Button>
                            </div>
                        )}
                    </TabPane>
                </Tabs>
            </Modal>
        </div>
    );

};

export default MainPage;
