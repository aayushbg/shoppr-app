import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardSidePanel from '../components/DashboardSidePanel';
import { FaUserCircle, FaEdit, FaSave, FaTimes } from 'react-icons/fa'; // Import icons

const Profile = () => {
    // Auth context provides token, auth status, and potentially basic user info
    const { user, token, loading: authLoading, authError, logout } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    // State to hold the full profile data fetched from the API
    const [profileData, setProfileData] = useState(null);
    // State for the form inputs, initialized empty
    const [formData, setFormData] = useState({
        name: '',
        email: '', // Email display only
        phone: '',
        city: '',
        branch: '',
        GSTIN: ''
    });
    
    // Loading/error states specifically for fetching/updating the profile
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [updateError, setUpdateError] = useState(null);
    const [updateSuccess, setUpdateSuccess] = useState(null);

    // Function to fetch the full profile data
    const fetchProfile = async () => {
        setLoadingProfile(true);
        setFetchError(null);
        if (!token) {
             setFetchError("Not authenticated.");
             setLoadingProfile(false);
             return;
        }
        try {
            const response = await fetch('http://localhost:4000/api/admin/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) logout();
                throw new Error(data.message || `HTTP Error ${response.status}`);
            }
            if (data.success && data.data) {
                setProfileData(data.data); // Store fetched profile data
                // Log 1: Check the fetched data structure and values
                console.log('Fetched profile data:', data.data); 
            } else {
                 throw new Error("Invalid profile data received.");
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setFetchError(err.message);
            setProfileData(null); // Clear profile data on error
        } finally {
            setLoadingProfile(false);
        }
    };

    // Fetch profile data on mount (after auth check)
    useEffect(() => {
        if (!authLoading && token) {
            fetchProfile();
        } else if (!authLoading && !token) {
            setLoadingProfile(false); // No token, stop loading
        }
    }, [authLoading, token]); // Rerun if auth state changes

    // Populate formData whenever profileData changes
    useEffect(() => {
        if (profileData) {
            const newFormData = {
                name: profileData.name || '',
                email: profileData.email || '', // Email is display-only
                phone: profileData.phone || '',
                city: profileData.city || '',
                branch: profileData.branch || '',
                GSTIN: profileData.GSTIN || ''
            };
            // Log 2: Check the object being passed to setFormData
            console.log('Updating formData with:', newFormData);
            setFormData(newFormData);
        }
    }, [profileData]); // Depend on the fetched profileData

    // Input change handler (Corrected)
    const handleInputChange = (e) => {
        const { name, value } = e.target; // Destructure name and value here
        setFormData(prev => ({ 
            ...prev, 
            [name]: value // Use the destructured 'name'
        }));
    };

    const handleEditToggle = () => {
        const currentlyEditing = isEditing;
        setIsEditing(!currentlyEditing);
        setUpdateError(null);
        setUpdateSuccess(null);
        // If canceling edit, reset form to fetched profile data
        if (currentlyEditing && profileData) {
             setFormData({
                name: profileData.name || '',
                email: profileData.email || '',
                phone: profileData.phone || '',
                city: profileData.city || '',
                branch: profileData.branch || '',
                GSTIN: profileData.GSTIN || ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingUpdate(true);
        setUpdateError(null);
        setUpdateSuccess(null);

        if (!token) {
            setUpdateError("Authentication error. Please log in again.");
            setLoadingUpdate(false);
            return;
        }

        // Create payload with only the fields that should be updatable
        // Exclude email typically, and potentially password unless handled separately
        const updatePayload = {
            name: formData.name,
            phone: formData.phone,
            city: formData.city,
            branch: formData.branch,
            GSTIN: formData.GSTIN,
        };

        try {
            const response = await fetch('http://localhost:4000/api/admin/profile', { 
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatePayload)
            });
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    logout();
                    setUpdateError("Session expired. Please log in again.");
                } else {
                    throw new Error(data.message || `HTTP error ${response.status}`);
                }
            } else {
                // --- Update successful --- 
                setUpdateSuccess("Profile updated successfully!");
                setIsEditing(false);
                // --- Re-fetch profile data after successful update --- 
                fetchProfile();
            }

        } catch (err) {
            console.error("Error updating profile:", err);
            setUpdateError(err.message);
        } finally {
            setLoadingUpdate(false);
        }
    };

    // Loading/Error States (with dark styles)
    if (authLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300">Authenticating...</p></div>;
    }
    if (!token && !authLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300">Please <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">log in</a>.</p></div>;
    }
     if (authError) {
        return <div className="flex h-screen w-full items-center justify-center p-4 bg-gray-100 dark:bg-gray-900"><p className="text-red-600 dark:text-red-400">Auth Error: {authError}</p></div>;
     }
    // Handle case where user data is still null after auth check (shouldn't happen if profile fetch works)
    if (!user) {
        return (
            <div className="flex h-screen w-full font-[Inter] bg-gray-100">
               <DashboardSidePanel />
               <div className="w-10/12 flex items-center justify-center">
                   <p>Loading user profile...</p> 
                </div>
            </div>
        );
    }

    // Input/Button Styles (with dark styles - reusing from previous pages)
    const inputBaseStyle = "block w-full text-sm sm:text-base rounded-md shadow-sm"; // Adjusted text size
    const inputBorderStyle = "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400";
    const inputColorStyle = "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500";
    const inputReadOnlyStyle = "bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600/50 text-gray-600 dark:text-gray-400 cursor-not-allowed";
    const inputPaddingStyle = "p-2 sm:p-3"; // Adjusted padding
    const buttonStyle = "px-4 py-2 text-sm font-medium rounded-md shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";
    const primaryButtonStyle = `${buttonStyle} text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600`;
    const secondaryButtonStyle = `${buttonStyle} text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-indigo-500`;

    // Display loading specific to profile fetch
    const renderProfileContent = () => {
        if (loadingProfile) {
            return <p className="text-center p-6 text-gray-500 dark:text-gray-400">Loading profile...</p>;
        }
        if (fetchError) {
             return <p className="text-center p-6 text-red-600 dark:text-red-400">Error loading profile: {fetchError}</p>;
        }
        if (!profileData) {
             return <p className="text-center p-6 text-gray-500 dark:text-gray-400">Could not load profile data.</p>;
        }
        // Render the form/display once data is loaded
        return (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-4 sm:gap-y-6">
                {/* Name Input/Display */}
                <div>
                     {/* Added dark styles */}
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                     {/* Added dark styles using constants */}
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name} 
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                        className={`${inputBaseStyle} ${inputPaddingStyle} ${isEditing ? `${inputBorderStyle} ${inputColorStyle}` : inputReadOnlyStyle}`}
                        required
                    />
                </div>
                 {/* Email Display Only */}
                <div>
                     {/* Added dark styles */}
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                     {/* Added dark styles using constants */}
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email} 
                        readOnly
                        className={`${inputBaseStyle} ${inputPaddingStyle} ${inputReadOnlyStyle}`}
                    />
                </div>
                 {/* Phone Input/Display */}
                <div>
                     {/* Added dark styles */}
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                     {/* Added dark styles using constants */}
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                        className={`${inputBaseStyle} ${inputPaddingStyle} ${isEditing ? `${inputBorderStyle} ${inputColorStyle}` : inputReadOnlyStyle}`}
                        required
                    />
                </div>
                 {/* City Input/Display */}
                <div>
                     {/* Added dark styles */}
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                     {/* Added dark styles using constants */}
                    <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                        className={`${inputBaseStyle} ${inputPaddingStyle} ${isEditing ? `${inputBorderStyle} ${inputColorStyle}` : inputReadOnlyStyle}`}
                        required
                    />
                </div>
                 {/* Branch Input/Display */}
                <div>
                     {/* Added dark styles */}
                    <label htmlFor="branch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                     {/* Added dark styles using constants */}
                    <input
                        type="text"
                        id="branch"
                        name="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                        className={`${inputBaseStyle} ${inputPaddingStyle} ${isEditing ? `${inputBorderStyle} ${inputColorStyle}` : inputReadOnlyStyle}`}
                        required
                    />
                </div>
                 {/* GSTIN Input/Display */}
                <div>
                     {/* Added dark styles */}
                    <label htmlFor="GSTIN" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GSTIN</label>
                     {/* Added dark styles using constants */}
                    <input
                        type="text"
                        id="GSTIN"
                        name="GSTIN"
                        value={formData.GSTIN}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                        className={`${inputBaseStyle} ${inputPaddingStyle} ${isEditing ? `${inputBorderStyle} ${inputColorStyle}` : inputReadOnlyStyle}`}
                        required
                    />
                </div>

                {/* Action Buttons - Placed outside the grid or within a spanning column */}
                <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
                    {/* Show Update/Cancel or Edit button */}
                    {isEditing ? (
                        <>
                            {/* Buttons use dark styles via constants */}
                            <button type="button" onClick={handleEditToggle} className={`${secondaryButtonStyle}`}>Cancel</button>
                            <button type="submit" disabled={loadingUpdate} className={`${primaryButtonStyle}`}>
                                {loadingUpdate ? 'Saving...' : <><FaSave className="inline-block mr-1"/> Save Changes</>}
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={handleEditToggle} className={`${primaryButtonStyle} flex items-center justify-center gap-2`}>
                            <FaEdit /> Edit Profile
                        </button>
                    )}
                </div>
                
                {/* Update status messages */}
                {updateError && (
                    <div className="md:col-span-2 mt-2 text-sm text-red-600 dark:text-red-400">
                        Update Error: {updateError}
                    </div>
                )}
                 {updateSuccess && (
                    <div className="md:col-span-2 mt-2 text-sm text-green-600 dark:text-green-400">
                        {updateSuccess}
                    </div>
                )}
            </form>
        );
    };

    // Log 3: Check the final formData state before rendering
    console.log('Rendering Profile component with formData:', formData);

    // Main Profile Page Render
    return (
        // Added dark styles
        <div className="flex h-screen w-full font-[Inter] bg-gray-100 dark:bg-gray-900">
            <DashboardSidePanel />
            {/* Added dark styles */}
            <div className="flex-grow overflow-auto p-4 sm:p-6 lg:w-[calc(100%-16rem)] text-gray-800 dark:text-gray-200">
                 {/* Added dark styles */}
                <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Profile</h1>
                
                 {/* Added dark styles */}
                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md dark:shadow-dark-md border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-6">
                        <FaUserCircle className="text-4xl sm:text-5xl text-gray-500 dark:text-gray-400 mr-4" />
                        <div>
                             {/* Added dark styles */}
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{profileData?.name || 'User Profile'}</h2>
                             {/* Added dark styles */}
                            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account details below.</p>
                        </div>
                    </div>
                    
                    {renderProfileContent()} 
                </div>
            </div>
        </div>
    );
};

export default Profile; 