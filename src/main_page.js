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

import { usePasswordContext } from './PasswordContext';  // Import the context

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

    const { currentPage, setCurrentPage } = usePasswordContext();
    const [originalItemName, setOriginalItemName] = useState('');
    const [originalUserName, setOriginalUserName] = useState('');
    const [originalPassword, setOriginalPassword] = useState('');
    const [originalGroup, setOriginalGroup] = useState('');
    const [originalComment, setOriginalComment] = useState('');
    const [originalUrl, setOriginalUrl] = useState(''); // Added for original URL

    const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchMode, setSearchMode] = useState(false); // To track if we are in search mode

    // Pagination state for search results
    const [currentPageSearch, setCurrentPageSearch] = useState(1);
    const [nextPageSearch, setNextPageSearch] = useState(null);
    const [prevPageSearch, setPrevPageSearch] = useState(null);

    // Pagination state for the history table
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
    const [historyNextPage, setHistoryNextPage] = useState(null);
    const [historyPrevPage, setHistoryPrevPage] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);  // History loading state

    // OTP related
    const [secretKey, setSecretKey] = useState('');
    const [otp, setOtp] = useState('000000');
    const pollingRef = useRef(null); // To manage the polling interval
    const [initialRequestFailed, setInitialRequestFailed] = useState(false); // Track initial request failure

    // Start polling the OTP endpoint when the modal opens
    useEffect(() => {
        if (isModalOpen) {
            fetchOtp(); // Try fetching OTP immediately
            if (!initialRequestFailed) {
                pollingRef.current = setInterval(fetchOtp, 5000); // Start polling only if the initial request is successful
            }
        } else {
            clearInterval(pollingRef.current); // Stop polling when modal closes
        }

        return () => clearInterval(pollingRef.current); // Cleanup on unmount or modal closure
    }, [isModalOpen, initialRequestFailed]);

    // Save secret key
    const handleSaveKey = async () => {
        try {
            const response = await axios.post(`/password-items-otp/${clickedRow.passId}/update-otp/`, {
                otpKey: secretKey,
            });
            message.success(response.data.responseKey);
            setInitialRequestFailed(false); // Reset failure state
            fetchOtp(); // Fetch OTP immediately
            pollingRef.current = setInterval(fetchOtp, 5000); // Restart polling
        } catch (error) {
            message.error('Failed to save the OTP key');
        }
    };
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


    // Delete secret key
    const handleDeleteKey = async () => {
        try {
            await axios.delete(`/password-items-otp/${clickedRow.passId}/delete-otp/`);
            setSecretKey('');
            message.success('OTP key deleted successfully');
        } catch (error) {
            message.error('Failed to delete the OTP key');
        }
    };

    // Function to fetch OTP from the endpoint
    const fetchOtp = async () => {
        try {
            const response = await axios.get(`/password-items-otp/${clickedRow.passId}/generate-otp/`);
            const responseKey = response.data.responseKey;

            if (responseKey === "No OTP key found for this item") {
                setOtp('000000'); // Fallback OTP
                setInitialRequestFailed(false); // No error in this case
            } else {
                setOtp(responseKey.toString().padStart(6, '0')); // Format OTP as 6 digits
                setInitialRequestFailed(false); // Mark as successful
            }
        } catch (error) {
            setInitialRequestFailed(true); // Mark failure
            setOtp('000000'); // Fallback in case of an error

            clearInterval(pollingRef.current); // Stop polling if the request fails
        }
    };


    // Copy OTP to clipboard
    const handleCopyOtp = () => {
        navigator.clipboard.writeText(otp);
        message.success('OTP copied to clipboard');
    };

    // Function to fetch data based on the group
    const fetchData = (url = null, page = 1) => {
        setLoading(true);

        // Determine the appropriate endpoint based on the groupId
        let endpoint;
        if (url) {
            // If a URL is provided, use it for pagination (next/previous page)
            endpoint = url;
        } else if (groupId === -1) {
            // Case 1: Fetch all passwords (default "Passwords" option)
            endpoint = '/password-items/?page=' + page;
        } else if (groupId === null) {
            // Case 2: Fetch unlisted passwords (groupId is 'null')
            endpoint = '/groups/null/password-items/?page=' + page;
        } else {
            // Case 3: Fetch passwords for a specific group
            endpoint = `/groups/${groupId}/password-items/?page=` + page;
        }

        // Ensure the endpoint starts with the full base URL
        if (!endpoint.startsWith('http')) {
            endpoint = `${process.env.REACT_APP_API_BASE_URL}${endpoint}`;
        }


        // Use Axios to fetch the data from the determined endpoint
        axios.get(endpoint)
            .then((response) => {
                const data = response.data;
                setPasswordItems(data.passwords);  // Set the table data
                setNextPage(data.next_page);       // Set the next page URL
                setPrevPage(data.previous_page);   // Set the previous page URL
                setCurrentPage(page);
                setSearchMode(false);  // Not in search mode
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
    }, [groupId]);

    const onSearch = (value) => {
        const trimmedQuery = value.trim();
        setSearchMode(Boolean(trimmedQuery)); // Enter search mode only if a query is provided

        if (!trimmedQuery) {
            fetchData(null, currentPage);  // Clear the search and go back to normal data
            return;
        }

        // Reset search pagination
        setCurrentPageSearch(1);

        let endpoint;
        if (groupId === -1) {
            endpoint = `password-items/?page=1&search=${encodeURIComponent(trimmedQuery)}`;
        } else if (groupId === null) {
            endpoint = `groups/null/password-items/?page=1&search=${encodeURIComponent(trimmedQuery)}`;
        } else {
            endpoint = `groups/${groupId}/password-items/?page=1&search=${encodeURIComponent(trimmedQuery)}`;
        }

        axios.get(endpoint)
            .then((response) => {
                const data = response.data;
                setPasswordItems(data.passwords);
                setNextPageSearch(data.next_page);
                setPrevPageSearch(data.previous_page);
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
                setHistoryData(data.passwords);  // Set history data
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
            title: 'Name',
            dataIndex: 'itemName',
            key: 'itemName',
        },

        {
            title: 'User Name',
            dataIndex: 'userName',
            key: 'userName',
        },

        {
            title: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Password</span>
                    <Button
                        type="link"  // Low-key, link-styled button
                        onClick={toggleAllPasswordsVisibility}
                        style={{ fontSize: '14px', color: '#4b6584' }}  // Adjust style to blend in
                    >
                        {isPasswordVisible ? 'Hide All' : 'Show All'}
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
                placeholder="What are you looking for?"
                onSearch={onSearch}
                className="custom-search-bar"
                //onBlur={onSearchBlur}

                // ref={searchInputRef}
            />
            {/* Switch on the right side */}
            <div className="right-section">
                <Switch checked={isDarkMode} onChange={toggleDarkMode} />
            </div>

            <Breadcrumb style={{margin: '16px 0'}} items={breadcrumbItems}>

            </Breadcrumb>

            <Table
                dataSource={passwordItems}
                columns={columns}
                rowKey={(record) => record.passId}
                loading={loading}
                pagination={false}

            />
            <div style={{display: 'flex', justifyContent: 'center', marginTop: 16}}>
                <Button
                    onClick={() => searchMode ? fetchSearchResults(prevPageSearch, currentPageSearch - 1) : fetchData(prevPage, currentPage - 1)}
                    disabled={searchMode ? !prevPageSearch : !prevPage}  // Fix: !prevPage (instead of searchMode ? !prevPageSearch : prevPage)
                    style={{marginRight: 8}}
                >
                    <LeftOutlined /> {/* Icon for Previous Page */}
                </Button>

                <div style={{
                    width: '40px',
                    height: '40px',
                    lineHeight: '40px',
                    textAlign: 'center',
                    border: '1px solid #2F72EDFF',
                    borderRadius: '4px',
                    margin: '0 12px',
                    fontSize: '16px',
                    background: 'white',

                }}>
                    {searchMode ? currentPageSearch : currentPage} {/* Show currentPageSearch in search mode */}
                </div>

                <Button

                    onClick={() => searchMode ? fetchSearchResults(nextPageSearch, currentPageSearch + 1) : fetchData(nextPage, currentPage + 1)}
                    disabled={searchMode ? !nextPageSearch : !nextPage}  // Fix: !nextPage (instead of searchMode ? !prevPageSearch : prevPage)
                    style={{marginLeft: 8,}}
                >
                    <RightOutlined/> {/* Icon for Next Page */}
                </Button>

            </div>
            <Modal
                title="Password Item Details"
                open={isModalOpen}
                onCancel={handleModalClose}
                footer={null}
                className="password-details-modal"

            >

                <Tabs defaultActiveKey="1">
                    <TabPane tab="Details" key="1">
                        {clickedRow && (
                            <div>
                                <p><strong>Name:</strong> {clickedRow.itemName}</p>
                                <p><strong>User Name:</strong> {clickedRow.userName}</p>
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
                                    <strong>Group:</strong> {clickedRow.groupName ? clickedRow.groupName : 'Unlisted'}
                                </p>
                                {clickedRow.comment && (
                                    <p>
                                        <strong>Comment:</strong> {clickedRow.comment}
                                    </p>
                                )}
                                <p>
                                    <strong>URL:</strong> {clickedRow.url ? (
                                    <a href={clickedRow.url} target="_blank" rel="noopener noreferrer">
                                        {clickedRow.url}
                                    </a>
                                ) : (
                                    'No URL provided'
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
                                    rowKey={(record) => record.updatedAt}
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
                            <p>No history available.</p>
                        )}
                    </TabPane>
                    <TabPane tab="Edit" key="3">
                        {clickedRow && (
                            <div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Item Name</label>
                                    <Input
                                        placeholder="Item Name"
                                        value={editedItemName}
                                        onChange={(e) => setEditedItemName(e.target.value)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>User Name</label>
                                    <Input
                                        placeholder="Username"
                                        value={editedUserName}
                                        onChange={(e) => setEditedUserName(e.target.value)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Password</label>
                                    <Input.Password
                                        placeholder="Password"
                                        value={editedPassword}
                                        onChange={(e) => setEditedPassword(e.target.value)}
                                        iconRender={(visible) => (visible ? <EyeOutlined/> : <EyeInvisibleOutlined/>)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Group</label>
                                    <Input
                                        placeholder="Group"
                                        value={editedGroup}
                                        onChange={(e) => setEditedGroup(e.target.value)}
                                    />
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{fontWeight: 'bold'}}>Comment</label>
                                    <Input
                                        placeholder="Comment"
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
                                    Delete
                                </Button>
                            </div>
                        )}
                    </TabPane>
                    <TabPane tab="OTP" key="5">
                        <div style={{marginBottom: '16px'}}>
                            <Input
                                placeholder="Enter Secret Key"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                style={{width: '80%', marginRight: '8px'}}
                            />
                            <Button type="primary" onClick={handleSaveKey} disabled={!secretKey}>
                                Save
                            </Button>
                            <Button danger onClick={handleDeleteKey} style={{marginLeft: '8px'}}>
                                Delete
                            </Button>
                        </div>
                        <div style={{textAlign: 'center', marginBottom: '16px'}}>
                            <Typography.Title level={2} onClick={handleCopyOtp} style={{cursor: 'pointer'}}>
                                {otp || '000000'}
                            </Typography.Title>
                            <Typography.Text type="secondary">Click to copy OTP</Typography.Text>
                        </div>
                    </TabPane>

                </Tabs>
            </Modal>
        </div>
    );
};

export default MainPage;
