import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import authService from '../services/authService';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to easily access the auth context
export const useAuth = () => {
    return useContext(AuthContext);
};

// The provider component that wraps the application
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * On initial component mount, check for a stored user in localStorage
     * to maintain the session across page reloads.
     */
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            // Set the auth token for all subsequent axios requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
        }
        setLoading(false);
    }, []);

    /**
     * A helper function to handle the response from both login and register.
     * It stores the user data and JWT in state and localStorage, and sets
     * the default Authorization header for axios.
     * @param {object} data - The user data from the API response.
     */
    const handleAuthResponse = (data) => {
        // Ensure the user object has a consistent shape, including the role
        const userData = {
            _id: data._id,
            username: data.username,
            email: data.email,
            role: data.role, // Store the user's role
            token: data.token,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    };

    /**
     * Logs in a user and updates the application's auth state.
     * @param {string} email - The user's email.
     * @param {string} password - The user's password.
     * @returns {Promise<object>} The user data from the API.
     */
    const login = async (email, password) => {
        const response = await authService.login(email, password);
        if (response.data) {
            handleAuthResponse(response.data);
        }
        return response.data;
    };

    /**
     * Registers a new user and logs them in.
     * @param {string} username - The new user's username.
     * @param {string} email - The new user's email.
     * @param {string} password - The new user's password.
     * @returns {Promise<object>} The user data from the API.
     */
    const register = async (username, email, password) => {
        const response = await authService.register(username, email, password);
        if (response.data) {
            handleAuthResponse(response.data);
        }
        return response.data;
    };

    /**
     * Logs out the current user, clearing state and localStorage.
     */
    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    // The value provided to the context consumers
    const value = {
        user,
        loading,
        login,
        logout,
        register
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Don't render children until the initial loading is complete */}
            {!loading && children}
        </AuthContext.Provider>
    );
};