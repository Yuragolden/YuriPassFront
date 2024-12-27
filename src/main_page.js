import React, { useState, useEffect,useRef  } from 'react';
import { Table, Modal, Tabs, Input, Typography, Button, message,Breadcrumb, Switch } from 'antd';
import { MoreOutlined, EyeOutlined, EyeInvisibleOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import {
    config,
    dataFetching,
    deleteData,
    fetchAllPasswordItems,
    fetchHistory,
    fetchUnlistedPasswordItems,
    updatePasswordItem
} from './crud_operation';
import axios from './axiosConfg';
import './styles.css';
import './dark-mode.css'

import { usePasswordContext } from './PasswordContext';

const { Search } = Input;

const { TabPane } = Tabs;
const { Text } = Typography;

const onChange = (checked) => {
    console.log(`switch to ${checked}`); // Logs the state of the switch
};


const MainPage = ({ groupId, userId, setGroupItems, passwordItems, setPasswordItems,breadcrumbItems  }) => {
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

    // Function to fetch data based on the group
    const fetchData = async () => {
        setLoading(true);
        const userId = localStorage.getItem("userId");

        axios.get(`/passwords/user/${userId}`)
            .then((response) => {
                const data = response.data;
                setPasswordItems(data);  // Set the table data
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            })
            .finally(() => {
                setLoading(false);
            });

    };

    // Fetch data when the component mounts or the groupId changes
    useEffect(() => {
        fetchData();
    }, []);

    const onSearch = (value) => {
        const trimmedQuery = value.trim();
        setSearchMode(Boolean(trimmedQuery));

        if (!trimmedQuery) {
            fetchData();  // Просто загружайте все пароли снова
            return;
        }

        // Здесь можно оставить логику поиска без изменения, если у вас есть отдельный эндпоинт для поиска
        const endpoint = `passwords/search/?query=${encodeURIComponent(trimmedQuery)}`;

        axios.get(endpoint)
            .then((response) => {
                const data = response.data;
                setPasswordItems(data);
                // Обновите состояние для пагинации, если используете
            })
            .catch((error) => {
                console.error('Error during search:', error);
            });
    };

    // Change page in search results
    const fetchSearchResults = (url, page) => {
        setLoading(true);
        axios.get(url)
            .then((response) => {
                const data = response.data;
                setPasswordItems(data.passwords);
                setNextPageSearch(data.next_page);
                setPrevPageSearch(data.previous_page);
                setCurrentPageSearch(page);
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

    // Fetch history data for a specific password item with pagination
    const fetchHistoryData = (passId, url = null, page = 1) => {
        setHistoryLoading(true);
        let endpoint = url || `password-history/${passId}/?page=${page}`;

        axios.get(endpoint)
            .then((response) => {
                const data = response.data;
                setHistoryData(data);  // Set history data
                setHistoryNextPage(data.next_page);  // Set next page
                setHistoryPrevPage(data.previous_page);  // Set previous page
                setHistoryCurrentPage(page);  // Update current history page
            })
            .catch((error) => {
                console.error('Error fetching history data:', error);
            })
            .finally(() => {
                setHistoryLoading(false);
            });
    };

    const handleMenuClick = async (record) => {
        setClickedRow(record);
        setIsModalOpen(true);
        fetchHistoryData(record.passId);  // Fetch first page of history when opening the modal
        try {
            const history = await fetchHistory(record.passId);
            // Ensure that if no history exists, historyData is set to an empty array
            if (history && history.length > 0) {
                setHistoryData(history);
            } else {
                setHistoryData([]); // Set to an empty array if no history is found
            }
        } catch (error) {
            //message.error('Failed to fetch history');
            setHistoryData([]); // Ensure we set an empty array in case of an error
        }

        // Set current values in the form
        setEditedItemName(record.itemName);
        setEditedUserName(record.userName);
        setEditedPassword(record.password);
        setEditedGroup(record.groupName);
        setEditedComment(record.comment);
        setEditedUrl(record.url); // Set URL from the record

        // Set original values for comparison
        setOriginalItemName(record.itemName);
        setOriginalUserName(record.userName);
        setOriginalPassword(record.password);
        setOriginalGroup(record.groupName);
        setOriginalComment(record.comment);
        setOriginalUrl(record.url); // Set original URL


    };

    const handleSaveChanges = () => {
        if (!userId) {
            console.error("userId is not defined");
            return;
        }

        const effectiveGroupId = groupId === -1 ? clickedRow.groupId : groupId;

        const updatedData = {
            passId: clickedRow.passId,
            itemName: editedItemName,
            userName: editedUserName,
            password: editedPassword,
            groupId: effectiveGroupId,
            userId: userId,
            comment: editedComment,
            url: editedUrl // Include the URL in the updated data
        };

        updatePasswordItem(clickedRow.passId, effectiveGroupId, updatedData, setData)
            .then((response) => {
                setPasswordItems(prevData =>
                    prevData.map(item =>
                        item.passId === clickedRow.passId ? { ...updatedData, passId: clickedRow.passId } : item
                    )
                );
                message.success('Item updated successfully');
                setIsModalOpen(false);
            })
            .catch((error) => {
                message.error('Failed to update item');
            });
    };

    const handleDelete = () => {
        Modal.confirm({
            title: 'Are you sure you want to delete this?',
            okText: 'Delete',
            onOk() {
                if (clickedRow && clickedRow.passId) {
                    deleteData(clickedRow.passId, clickedRow.groupId, setPasswordItems, () => {
                        message.success('Password item deleted successfully');
                        setIsModalOpen(false);
                    }, setGroupItems)
                        .catch(error => {
                            message.error('Failed to delete password item or group');
                        });
                } else {
                    message.error('No valid item selected for deletion.');
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
            dataIndex: 'itemName',
            key: 'itemName',
        },

        {
            title: 'Логин',
            dataIndex: 'userName',
            key: 'userName',
        },

        {
            title: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Пароль</span>
                    <Button
                        type="link"  // Low-key, link-styled button
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
                            style={{ marginLeft: 8, cursor: 'pointer' }}
                            onClick={() => {
                                console.log("yuraloh")
                                console.log(record)
                                record.isPasswordVisible = !record.isPasswordVisible;
                                setPasswordItems([...passwordItems]);  // Update the table with visibility toggled
                            }}
                        >
                        {record.isPasswordVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
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
                    style={{ cursor: 'pointer', fontSize: '24px' }}
                    onClick={() => handleMenuClick(record)}
                />
            ),
        },
    ];

    const history_columns = [
        {
            title: 'Date',
            dataIndex: 'updatedAt',
            key: 'date',
            render: (updatedAt) => {
                const [date] = updatedAt.split(' ');  // Extract date (before space)
                return <span>{date}</span>;
            },
        },
        {
            title: 'Time',
            dataIndex: 'updatedAt',
            key: 'time',
            render: (updatedAt) => {
                const [, time] = updatedAt.split(' ');  // Extract time (after space)
                return <span>{time}</span>;
            },
        },
        {
            title: 'Password',
            dataIndex: 'oldPassword',
            key: 'password',
            render: (password) => <span>{password}</span>,
        },
    ];

    return (
        <div>
            <Search
                placeholder="Что будем искать?"
                onSearch={onSearch}
                className="custom-search-bar"
                //onBlur={onSearchBlur}

                // ref={searchInputRef}
            />
            {/* Switch on the right side */}
            <div className="right-section">
                <Switch checked={isDarkMode} onChange={toggleDarkMode}/>
            </div>

            <Breadcrumb style={{margin: '16px 0'}} items={breadcrumbItems}>

            </Breadcrumb>
            <Table
                dataSource={passwordItems}
                columns={columns}
                rowKey={(record) => record.id}
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
                    <TabPane tab="Details" key="1">
                        {clickedRow && (
                            <div>
                                <p><strong>Название:</strong> {clickedRow.itemName}</p>
                                <p><strong>Логин:</strong> {clickedRow.userName}</p>
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
                                    <strong>Папка:</strong> {clickedRow.groupName ? clickedRow.groupName : 'Unlisted'}
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
                    <TabPane tab="History" key="2">
                        {historyData.length > 0 ? (
                            <div>
                                <Table
                                    columns={history_columns}
                                    dataSource={historyData}
                                    rowKey={(record) => record.updated_at}
                                    loading={historyLoading}
                                    pagination={false}
                                />
                                <div style={{display: 'flex', justifyContent: 'center', marginTop: 16}}>
                                    <Button
                                        onClick={() => fetchHistoryData(clickedRow.passId, historyPrevPage, historyCurrentPage - 1)}
                                        disabled={!historyPrevPage}
                                        style={{marginRight: 8}}
                                    >
                                        <LeftOutlined />
                                    </Button>
                                    <div
                                        className="pagination-number-box"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            lineHeight: '40px',
                                            textAlign: 'center',
                                            borderRadius: '4px',
                                            margin: '0 12px',
                                            fontSize: '16px',
                                        }}
                                    >
                                        {historyCurrentPage}
                                    </div>
                                    <Button
                                        onClick={() => fetchHistoryData(clickedRow.passId, historyNextPage, historyCurrentPage + 1)}
                                        disabled={!historyNextPage}
                                    >
                                        <RightOutlined />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p>Нет доступной истории.</p>
                        )}
                    </TabPane>
                    <TabPane tab="Изменить" key="3">
                        {clickedRow && (
                            <div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Item Name</label>
                                    <Input
                                        placeholder="Название"
                                        value={editedItemName}
                                        onChange={(e) => setEditedItemName(e.target.value)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>User Name</label>
                                    <Input
                                        placeholder="Логин"
                                        value={editedUserName}
                                        onChange={(e) => setEditedUserName(e.target.value)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Password</label>
                                    <Input.Password
                                        placeholder="Пароль"
                                        value={editedPassword}
                                        onChange={(e) => setEditedPassword(e.target.value)}
                                        iconRender={(visible) => (visible ? <EyeOutlined/> : <EyeInvisibleOutlined/>)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Group</label>
                                    <Input
                                        placeholder="Папка"
                                        value={editedGroup}
                                        onChange={(e) => setEditedGroup(e.target.value)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Comment</label>
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
                                    Save
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
