import React, { useEffect, useState, useRef } from 'react';

import { Breadcrumb, Layout, Menu, theme, Input, Button, Modal, message } from 'antd';
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
import { dataFetching, config, fetchAllPasswordItems, fetchUnlistedPasswordItems } from './crud_operation';
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
    const [userId, setUserId] = useState(1);
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




    // Update login status when location changes (e.g., after login/logout)
    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoggedIn(!!token); // Update loggedIn state based on token presence
        if (!token) {
            setSelectedKey('login'); // Set the selected key to 'login' when logged out
        }
    }, [location]);

    // Focus on the input when the component mounts

    useEffect(() => {
        if (searchInputRef.current || (loggedIn && !isLoginPage && !isRegisterPage && !isAboutUsPage && searchInputRef.current)) {
            searchInputRef.current.focus();
        }
    }, [selectedGroupId,loggedIn, isLoginPage, isRegisterPage, isAboutUsPage]);



    const {
        token: { colorBgContainer },
    } = theme.useToken();

    // This effect will set the selected key based on the current path
    useEffect(() => {
        const path = location.pathname;

        if (path === '/about') {
            setSelectedKey('1'); // '1' for "About Us"
        } else if (path === '/passwords' && loggedIn) {
            setSelectedKey('2'); // '2' for "Passwords"
        } else if (path === '/login') {
            setSelectedKey('login'); // 'login' for Login page
        } else {
            setSelectedKey('login'); // Default to 'login' if no other match
        }
    }, [location, loggedIn]);

    // Check if the user is logged in and automatically fetch groups after login
    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoggedIn(!!token);

        if (token) {
            axios
                .get('groups/', { headers: { Authorization: `Bearer ${token}` } })
                .then((response) => {
                    if (Array.isArray(response.data)) {

                        const unlistedGroup = getItem('Unlisted', 'group-X');

                        const fetchedGroups = [
                            unlistedGroup,
                            ...response.data.map((group) => getItem(group.groupName, `group-${group.groupId}`))
                        ];

                        setGroupItems(fetchedGroups);
                    } else {
                        console.error('API response is not an array', response.data);
                        setGroupItems([]);
                    }
                })
                .catch((error) => {
                    console.error('Error fetching groups:', error);
                    setGroupItems([]);
                });
        }
    }, [loggedIn]);

    const fetchData = () => {
        if (selectedGroupId === -1) {
            fetchAllPasswordItems(setPasswordItems);
        } else if (selectedGroupId) {
            dataFetching(selectedGroupId, setPasswordItems);
        } else {
            fetchUnlistedPasswordItems(setPasswordItems);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedGroupId]);

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
                    {title: 'Group'},
                    {title: 'All'},
                ]);
                fetchDataForAllGroups();
            } else if (key.startsWith('group-')) {
                const groupId = key.split('-')[1];
                setSelectedGroupId(groupId);

                if (groupId === 'X') {
                    setSelectedGroupId(null);
                    setBreadcrumbItems([
                        {title: 'Group'},
                        {title: 'Unlisted'},
                    ]);
                    fetchDataForUnlistedGroups();
                } else {
                    setSelectedGroupId(groupId);
                    const clickedGroup = groupItems.find(item => item.key === key);

                    if (clickedGroup) {
                        const groupName = clickedGroup.label;
                        setBreadcrumbItems([
                            {title: 'Group'},
                            {title: groupName},
                        ]);
                    }


                }
            }
        }
    };

    const fetchDataForAllGroups = () => {
        axios
            .get('password-items/', config)
            .then((response) => {
                setPasswordItems(response.data.passwords);
            })
            .catch((error) => {
                console.error('Error fetching all password items:', error);
            });
    };

    const fetchDataForUnlistedGroups = () => {
        axios
            .get('password-items/unlisted/', config)
            .then((response) => {
                setPasswordItems(response.data.passwords);
            })
            .catch((error) => {
                console.error('Error fetching unlisted password items:', error);
            });
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
                children: groupItems.length > 0 ? groupItems : [{ label: 'Loading...', key: 'loading' }],
            }
        ] : []),
        {
        label: loggedIn ? 'Выйти' : 'Войти',
        key: loggedIn ? 'выйти' : 'войти',
        icon: loggedIn ? <LogoutOutlined /> : <LoginOutlined />,
        onClick: () => loggedIn ? showLogoutConfirmation() : navigate('/login')  // Show confirmation modal for logout
    }
];


    const [breadcrumbItems, setBreadcrumbItems] = useState([
        { title: 'Group' },
        { title: 'All' },
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
        setPasswordItems((prevItems) => [...prevItems, newItem]);  // Add the new password to the current state
    };

    useEffect(() => {
        if (selectedKey === '2') {
            fetchDataForAllGroups(); // Fetch all password items for the default "Passwords" selection
        }
    }, [selectedKey]);

const showLogoutConfirmation = () => {
    setShowLogoutConfirm(true); // Show the logout confirmation modal
};

const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token
    setLoggedIn(false); // Update the login state
    message.success('Успешный выход из аккаунта. До скорой встречи..');
    setShowLogoutConfirm(false); // Close the logout confirmation modal
    setSelectedKey('login'); // Reset selected key to 'login'
    navigate('/login'); // Redirect to the login page
};

    // Handle blur (unfocus) from the search input
    const onSearchBlur = () => {
        fetchData();  // Fetch normal group data when the search bar loses focus
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
    setIsModalVisible(false); // Hide the modal
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
                            src="https://icon-library.com/images/password-icon-png/password-icon-png-28.jpg"
                            alt="Expanded Logo"
                            style={{width: '100%', maxHeight: '64px', objectFit: 'contain', }}
                        />
                    ) : (
                        <img
                            src="https://i.imgur.com/5rgYyOW.png"
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

                        <Route path="/" element={<Navigate to="/about"/>}/>

                        <Route path="/passwords" element={

                                <MainPage
                                    groupId={selectedGroupId}
                                    userId={userId}
                                    setGroupItems={setGroupItems}
                                    passwordItems={passwordItems} // Pass down the password items
                                    setPasswordItems={setPasswordItems}
                                    breadcrumbItems={breadcrumbItems}  // Pass breadcrumb items as props
                                />
                        }

                        />
                    </Routes>


                </Content>
                <Footer style={{ textAlign: 'center' }}>© 2024 YuriPass</Footer>
            </Layout>

            {/* Plus Button at the bottom-right corner under the table */}
            {/* Conditionally render the "Add New Password" button */}

            {!isLoginPage && !isRegisterPage && !isAboutUsPage && loggedIn && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 9999,
                }}
                >
                    <SaveNewPassword
                        groupId={selectedGroupId}
                        userId={userId}
                        comment={comment}
                        url={url}
                        onPasswordAdd={(newItem) => {
                            setPasswordItems((prevItems) => [...prevItems, newItem]);  // Add new password to the table
                        }}
                        setGroupItems={setGroupItems}
                    />
                </div>

            )}
            <Modal
                title="Authentication"
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
                title="Confirm Logout"
                visible={showLogoutConfirm}
                onOk={handleLogout}
                onCancel={handleCancelLogout}
                okText="Yes"
                cancelText="No"
            >
                <p>Are you sure you want to log out?</p>
            </Modal>
            <Modal
                title="Password Details"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null} // You can add footer actions if needed
            >
                {selectedPasswordItem ? (
                    <div>
                        <p><strong>Item Name:</strong> {selectedPasswordItem.itemName}</p>
                        <p><strong>Username:</strong> {selectedPasswordItem.userName}</p>
                        <p><strong>Password:</strong> {selectedPasswordItem.password}</p>
                        <p><strong>URL:</strong> {selectedPasswordItem.url}</p>
                        <p><strong>Comment:</strong> {selectedPasswordItem.comment}</p>
                    </div>
                ) : (
                    <p>No details available</p>
                )}
            </Modal>

        </Layout>
        </PasswordProvider>
    );
};



export default App;
