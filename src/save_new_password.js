import React, { useState, useEffect } from 'react';
import { PlusOutlined, UserOutlined, EyeInvisibleOutlined, EyeTwoTone, RollbackOutlined , ShareAltOutlined } from '@ant-design/icons';
import { Button, Tooltip, Modal, Input, Select, message, Switch } from 'antd';
import { addPasswordItem } from './crud_operation';
import axios from './axiosConfg';
import { usePasswordContext } from './PasswordContext';
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

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get('groups/');
                const groupsWithUnlisted = [
                    { groupId: 'null', groupName: 'Unlisted' },
                    ...response.data,
                ];
                setGroupOptions(groupsWithUnlisted);
            } catch (error) {
                console.error('Error fetching groups:', error);
            }
        };

        fetchGroups();
    }, []);

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

    if (urlField && !isValidUrl(urlField)) {
        setUrlError('Invalid URL');
        return;
    }

    setLoading(true); // Set loading state to true

    // If a new group name is entered, create the group first
    if (newGroupName.trim() !== '') {
        createNewGroup(newGroupName).then((newGroupId) => {
            savePassword(newGroupId); // Use the new groupId to save the password
        }).catch((error) => {
            console.error('Error creating group:', error);
            message.error('Failed to create new group');
            setLoading(false); // Reset loading in case of error
        });
    } else {
        const groupIdToUse = selectedGroup === 'null' ? null : selectedGroup;
        savePassword(groupIdToUse); // Save password with selected group
    }
};

// Function to create a new group and update the dropdown list automatically
const createNewGroup = async (groupName) => {
    try {
        const response = await axios.post('groups/', { groupName });
        const newGroup = {
            groupId: response.data.groupId, // Assuming API returns the new group's ID
            groupName: groupName,
        };

        // Update the group options with the new group and select it automatically
        setGroupOptions((prevOptions) => [...prevOptions, newGroup]);
        setSelectedGroup(newGroup.groupId); // Automatically select the new group
        message.success('New group created successfully');

        return newGroup.groupId; // Return the new group's ID
    } catch (error) {
        throw new Error('Error creating group');
    }
};


    const savePassword = (groupIdToUse) => {
        const newPasswordItem = {
            itemName: fieldName,
            userName: username,
            password: password,
            groupId: groupIdToUse,
            userId: userId,
            comment: comments || null,
            url: urlField || null,
        };

        addPasswordItem(newPasswordItem, groupIdToUse)
            .then((newItem) => {
                message.success('New password added successfully');
                onPasswordAdd(newItem);
                setOpen(false);
            })
            .catch((error) => {
                console.error('Error adding password: ', error);
                message.error('Failed to add password');
            })
            .finally(() => {
                setLoading(false); // Reset loading state after completion
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
                <p>Enter the new password details here...</p>

                <Input
                    placeholder="Field name"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    style={{marginBottom: '10px'}}
                />
                <Input
                    placeholder="User-name"
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
                    placeholder="Input password"
                    value={password}
                    onChange={handlePasswordChange}
                    iconRender={(visible) => (visible ? <EyeTwoTone/> : <EyeInvisibleOutlined/>)}
                    style={{width: '50%', marginBottom: '10px', height: '31px'}}
                />
                <Button type="primary" style={{width: '45%', marginBottom: '10px', marginLeft: '5%'}}
                        onClick={generatePassword}>
                    Generate password
                </Button>

            <div className={'shared-group'}>
                <div className="group" style={{ width: '50%' }}>

                    <Select
                        style={{ width: '100%', marginBottom: '10px' }}
                        placeholder="Select a group"
                        value={selectedGroup || undefined}
                        onChange={(value) => {
                            setSelectedGroup(value);
                            setIsSharingEnabled(sharedGroups.includes(value));
                        }}
                        allowClear
                        showSearch
                        notFoundContent="No groups found"
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {groupOptions.map((group) => (
                            <Option key={group.groupId} value={group.groupId}>
                                {group.groupName}
                                {sharedGroups.includes(group.groupId) && (
                                    <ShareAltOutlined style={{ marginLeft: '10px', color: '#1677ff' }} />
                                )}
                            </Option>
                        ))}
                    </Select>


                    {

                <Input
                    placeholder="Or enter new group name"
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
                        placeholder="Enter email or username"
                        style={{width: '100%', height:'31px'}}
                        disabled={!isSharingEnabled}
                    />

                </div>

            </div>
                <Input
                    placeholder="Comments (optional)"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}

                />

                <Input
                    placeholder="URL (optional)"
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

