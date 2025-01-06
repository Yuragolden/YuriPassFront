import React, { useEffect, useState, useRef } from 'react';

import AboutUsContainer from './AboutUsContainer';


import { Layout, Menu, Input, Button, Modal, message } from 'antd';
import {
    DesktopOutlined,
    PieChartOutlined,
    UserOutlined,
    AudioOutlined,
    LogoutOutlined,
    LoginOutlined
} from '@ant-design/icons';
import axios from './axiosConfg';
import fuzzysort from 'fuzzysort';
import MainPage from './main_page';
import SaveNewPassword from './save_new_password';
import { dataFetching, config } from './crud_operation';
import './styles.css';
import {Navigate, Route, Routes, useNavigate} from 'react-router-dom';
import Login from './authorisation/login';
import Register from './authorisation/register';
import PrivateRoute from './authorisation/PrivateRoute';
import AboutUs from "./aboutUs";
import { useLocation } from 'react-router-dom';
import { PasswordProvider } from './PasswordContext';

const { Search } = Input;
const { Header, Content, Footer, Sider } = Layout;

const suffix = (
    <AudioOutlined style={{ fontSize: 16, color: '#1677ff' }} />
);

function getItem(label, key, icon, children) {
    return {
        key,
        icon,
        children,
        label,
    };
}

const App = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [passwordItems, setPasswordItems] = useState([]);
    const [groupItems, setGroupItems] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(-1);
    // const [userId, setUserId] = useState(1);
    const [comment, setCommentId] = useState(null);
    const [url, setUrlId] = useState(null);
    const [openKeys, setOpenKeys] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);
    const initialLoggedInState = !!localStorage.getItem('token');

    const [loggedIn, setLoggedIn] = useState(initialLoggedInState); // Initialize loggedIn state correctly    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const navigate = useNavigate();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedPasswordItem, setSelectedPasswordItem] = useState(null);
    const location = useLocation();
    const [selectedKey, setSelectedKey] = useState(initialLoggedInState ? '2' : 'login'); // Based on loggedIn, decide selected key
    const isLoginPage = location.pathname === '/login';
    const isRegisterPage = location.pathname === '/register';
    const isAboutUsPage = location.pathname === '/about';
    const [showAuthModal, setShowAuthModal] = useState(false); // Add state for auth modal
    const user_id = localStorage.getItem('userId');
    const token = localStorage.getItem('token');


    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoggedIn(!!token);
        if (!token) {
            setSelectedKey('login');
        }
    }, [location]);

    useEffect(() => {
        const path = location.pathname;
        const keyMap = {
            '/about': '1',
            '/passwords': loggedIn ? '2' : 'login',
            '/login': 'login'
        };
        setSelectedKey(keyMap[path] || 'login');
    }, [location, loggedIn]);

    // Check if the user is logged in and automatically fetch groups after login
    useEffect( () => {
        const token = localStorage.getItem('token');
        setLoggedIn(!!token);

        if (token) {
            axios
                .get(`/folders/user/${user_id}`, { headers: { Authorization: `Bearer ${token}` } })
                .then((response) => {
                    if (Array.isArray(response.data)) {
                        const unlistedGroup = getItem('Без папки', 'group-X');
                        const fetchedGroups = [
                            unlistedGroup,
                            ...response.data.map((group) => getItem(group.name, `group-${group.id}`))
                        ];
                        setGroupItems(fetchedGroups);
                        fetchDataForAllGroups()
                        console.log(fetchedGroups);
                    } else {
                        console.error('API вернул не массив', response.data);
                        setGroupItems([]);
                    }
                })
                .catch((error) => {
                    console.error('Ошибка при получении папок:', error);
                    setGroupItems([]);
                });
        }
    }, [loggedIn === true, token === true]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearching(false);
                setFilteredItems([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    const fetchData =  () => {
        if (selectedGroupId === null || selectedGroupId === -1) return;
        dataFetching(selectedGroupId, setPasswordItems);
    }

    useEffect( () => {
         fetchData();
    }, [selectedGroupId]);


    const handleMenuClick = (key) => {
        setSelectedKey(key);
        setIsSearching(false);

        if (key === 'logout') {
            showLogoutConfirmation();
        }
        else {

            if (key === '2') {
                setSelectedGroupId(-1);
                setBreadcrumbItems([
                    {title: 'Папки'},
                    {title: 'Все'},
                ]);
                fetchDataForAllGroups();
            } else if (key.startsWith('group-')) {
                const groupId = key.split('-')[1];
                setSelectedGroupId(groupId);

                if (groupId === 'X') {
                    setSelectedGroupId(null);
                    setBreadcrumbItems([
                        // {title: 'Папки'},
                        {title: 'Без папки'},
                    ]);
                    fetchDataForUnlistedGroups();
                } else {
                    setSelectedGroupId(groupId);
                    const clickedGroup = groupItems.find(item => item.key === key);

                    if (clickedGroup) {
                        const groupName = clickedGroup.label;
                        setBreadcrumbItems([
                            {title: 'Папки'},
                            {title: groupName},
                        ]);
                    }
                }
            }
        }
    };

// Функции для загрузки данных
    const fetchDataForAllGroups =  () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (token && userId) {
            axios.get(`/passwords/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
                .then((response) => {
                    console.log('Все пароли:', response.data);
                    setPasswordItems(response.data); // Обновление состояния всех паролей
                })
                .catch((error) => {
                    console.error('Ошибка при получении всех паролей:', error);
                    setPasswordItems([]);
                });
        }
    };

    const fetchDataForUnlistedGroups =  () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (token && userId) {
            axios.get(`/passwords/folders/unlisted/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
                .then((response) => {
                    console.log('Пароли "Без папки":', response.data);
                    setPasswordItems(response.data); // Обновление состояния паролей для "Без папки"
                })
                .catch((error) => {
                    console.error('Ошибка при получении паролей для "Без папки":', error);
                    setPasswordItems([]);
                });
        }
    };

    const onOpenChange = (keys) => {
        setOpenKeys(keys);
    };

    const groupMenuItems = [
        {
            label: 'О нас',
            key: '1',
            icon: <DesktopOutlined />,
            onClick: () => navigate('/about'),
        },
        ...(loggedIn ? [
            {
                label: 'Пароли',
                key: '2',
                icon: <PieChartOutlined />,
                onClick: () => navigate('/passwords'),
            },
            {
                label: 'Папки',
                key: 'sub1',
                icon: <UserOutlined />,
                children: groupItems.length > 0 ? groupItems : [{ label: 'Загрузка...', key: 'loading' }],
            }
        ] : []),
        {
            label: loggedIn ? 'Выйти' : 'Войти',
            key: loggedIn ? 'logout' : 'login',
            icon: loggedIn ? <LogoutOutlined /> : <LoginOutlined />,
            onClick: () => loggedIn ? showLogoutConfirmation() : navigate('/login'),
        }
    ];


    useEffect(() => {
        if (searchInputRef.current && (loggedIn && !isLoginPage && !isRegisterPage && !isAboutUsPage)) {
            searchInputRef.current.focus();
        }
    }, [selectedGroupId, loggedIn]);


    const [breadcrumbItems, setBreadcrumbItems] = useState([
        { title: 'Без папки' },
    ]);

    const onMenuSelect = ({ key }) => {
        handleMenuClick(key);
    };

    const handleLogin = () => {
        navigate('/login');
        setShowAuthModal(false);
    };

    const handleRegister = () => {
        navigate('/register');
        setShowAuthModal(false);
    };
    // User menu items for the bottom of the sidebar
    const userItem = [getItem('User', '3', <DesktopOutlined />)];

    const onPasswordAdd = (newItem) => {
        setPasswordItems((prevItems) => {return [...prevItems, newItem[0]]});
    };

    const onSetGroupItems = (newGroup) =>{
        setGroupItems((prevItems) => {
            console.log([...prevItems, getItem(newGroup.name, `group-${newGroup.id}`)])
            return [...prevItems, getItem(newGroup.name, `group-${newGroup.id}`)]});
    }

    const showLogoutConfirmation = () => {
        setShowLogoutConfirm(true); // Show the logout confirmation modal
    };

    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        console.log(token)
        console.log(config)

        try {
            // Отправляем запрос на отзыв токена
            await axios.post(
                "/auth/logout",
                {"token": token},

            );
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('id_admin');
            setLoggedIn(false);
            setPasswordItems([]); // Очистка паролей
            setGroupItems([]); // Очистка папок
            setSelectedGroupId(-1); // Сброс выбранной группы
            setSelectedKey('login'); // Установка ключа на страницу входа
            setShowLogoutConfirm(false);
            navigate('/login');
        } catch (error) {
            console.error("Ошибка при выходе:", error);
        }
    };


    const handleCancelLogout = () => {
        setShowLogoutConfirm(false); // Close the confirmation modal without logging out
        setSelectedKey('2');
    };

    const showModal = (item) => {
        setSelectedPasswordItem(item); // Set the selected password item
        setIsModalVisible(true); // Show the modal
    };

    const handleCancel = () => {
    setIsModalVisible(false);
    };

    return (
        <PasswordProvider>
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible
                   collapsed={collapsed}
                   onCollapse={(value) => setCollapsed(value)}>
                <div style={{padding: '20px', textAlign: 'center', marginTop: '10px', position:'sticky', top: '2%'}}>
                    {!collapsed ? (
                        <img
                            src="https://drive.google.com/file/d/1zfnE_d6fsfpM_7L6i3S4-L3H2G-EfMOJ/view?usp=drive_link"
                            alt="Expanded Logo"
                            style={{width: '100%', maxHeight: '64px', objectFit: 'contain', }}
                        />
                    ) : (
                        <img
                            src="https://drive.google.com/file/d/1zfnE_d6fsfpM_7L6i3S4-L3H2G-EfMOJ/view?usp=drive_link"
                            alt="Collapsed Logo"
                            style={{width: '100%', maxHeight: '60px', objectFit: 'contain'}}
                        />
                    )}
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    openKeys={openKeys}
                    onClick={onMenuSelect}
                    onOpenChange={onOpenChange}
                    items={groupMenuItems}
                />
            </Sider>

            <Layout>
                <Content style={{margin: '0 16px'}}>
                    <Routes>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/register" element={<Register/>}/>
                        <Route path="/about" element={<AboutUs/>}/>
                        {/*<Route path="/about" element={<AboutUsContainer/>}/>*/}

                        <Route path="/" element={<Navigate to="/about"/>}/>

                        <Route path="/passwords" element={
                            <PrivateRoute>
                                {/*<Breadcrumb style={{ margin: '16px 0' }} items={breadcrumbItems} />*/}
                                <MainPage
                                    groupId={selectedGroupId}
                                    userId={user_id}
                                    setGroupItems={setGroupItems}
                                    passwordItems={passwordItems} // Pass down the password items
                                    setPasswordItems={setPasswordItems}
                                    breadcrumbItems={breadcrumbItems}  // Pass breadcrumb items as props
                                    selectedGroupId={selectedGroupId}
                                />
                            </PrivateRoute>
                        }
                        />
                    </Routes>
                </Content>
                <Footer style={{ textAlign: 'center' }}>© 2024 YuriPass</Footer>
            </Layout>


            {!isLoginPage && !isRegisterPage && !isAboutUsPage &&(
                <div style={{
                    position: 'absolute',
                    bottom: 24,
                    right: 24,
                }}
                >
                    <SaveNewPassword
                        groupId={selectedGroupId}
                        userId={user_id}
                        comment={comment}
                        url={url}
                        onPasswordAdd={onPasswordAdd}
                        onSetGroupItems={onSetGroupItems}
                    />
                </div>

            )}
            <Modal
                title="Авторизация"
                open={showAuthModal}
                onCancel={() => setShowAuthModal(false)}
                footer={null}
            >
                {loggedIn ? (
                    <p>Вы уже авторизованы.</p>
                ) : (
                    <div>
                        <p>Please log in to continue.</p>
                        <Button type="primary" onClick={handleLogin} style={{ marginRight: 8 }}>
                            Войти
                        </Button>
                        <Button type="default" onClick={handleRegister}>
                            Создать аккаунт
                        </Button>
                    </div>
                )}
            </Modal>
            <Modal
                title="Подтвердить выход"
                visible={showLogoutConfirm}
                onOk={handleLogout}
                onCancel={handleCancelLogout}
                okText="Yes"
                cancelText="No"
            >
                <p>Действительно хотите выйти?</p>
            </Modal>
            <Modal
                title="Детали записи"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null} // You can add footer actions if needed
            >
                {selectedPasswordItem ? (
                    <div>
                        <p><strong>Название:</strong> {selectedPasswordItem.name}</p>
                        <p><strong>Логин:</strong> {selectedPasswordItem.login}</p>
                        <p><strong>Пароль:</strong> {selectedPasswordItem.password}</p>
                        <p><strong>URL:</strong> {selectedPasswordItem.url}</p>
                        <p><strong>Комментарии:</strong> {selectedPasswordItem.comment}</p>
                    </div>
                ) : (
                    <p>Нет доступных деталей</p>
                )}
            </Modal>

        </Layout>
        </PasswordProvider>
    );
};
export default App;
