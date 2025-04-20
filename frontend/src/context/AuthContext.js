import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Holds user details (like name, email, id) but NOT the token
    const [token, setToken] = useState(localStorage.getItem('token')); // Token stored separately
    const [loading, setLoading] = useState(true); // True while checking token validity initially
    const [authError, setAuthError] = useState(null); // To store auth-related errors

    // Function to fetch user details based on token (verifies token)
    const verifyTokenAndFetchUser = useCallback(async (currentToken) => {
        if (!currentToken) {
            setUser(null);
            setLoading(false);
            setAuthError(null);
            return;
        }
        
        setLoading(true);
        setAuthError(null);
        try {
            // Use environment variable for base URL
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/profile`, { // ADJUST ENDPOINT IF NEEDED
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (!response.ok) {
                // If token is invalid (e.g., 401 Unauthorized), log out
                if (response.status === 401 || response.status === 403) {
                     console.warn('Invalid or expired token found. Logging out.');
                     logout(); // Clear user, token, and local storage
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    // throw new Error(errorData.message || `Failed to verify token (Status: ${response.status})`);
                }
                 return; // Exit after handling error or logout
            }

            const userData = await response.json();
            // Assuming backend returns { success: true, data: { _id, name, email, ... } }
            if (userData.success && userData.data) {
                setUser(userData.data); // Store user details WITHOUT token
            } else {
                 console.error("Failed to parse user data from profile endpoint:", userData);
                 logout(); // Log out if user data is invalid
            }

        } catch (err) {
            console.error('Error verifying token:', err);
            setAuthError(err.message);
            logout(); // Log out on any error during verification
        } finally {
            setLoading(false);
        }
    }, []);

    // Check token on initial mount
    useEffect(() => {
        verifyTokenAndFetchUser(token);
    }, [token, verifyTokenAndFetchUser]); // Re-run if token changes

    const login = useCallback((loginData) => {
        // Assuming loginData has { token, user: { _id, name, ... } } structure from backend
        if (loginData && loginData.token && loginData.user) {
            localStorage.setItem('token', loginData.token);
            setToken(loginData.token);
            setUser(loginData.user); // Set user details
            setAuthError(null);
        } else {
            console.error('Invalid login data received:', loginData);
             setAuthError('Login failed: Invalid data received from server.');
            logout(); // Ensure clean state if login data is bad
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setAuthError(null);
        // Optionally: redirect to login page or clear other relevant state
        // window.location.href = '/login'; // Could cause full page reload
    }, []);

    // Memoize the context value
    const contextValue = React.useMemo(() => ({
        user, 
        token,
        login,
        logout,
        loading, // Represents initial auth check loading
        authError
    }), [user, token, login, logout, loading, authError]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) { // Check for undefined, not just falsy
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 