import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setAccessToken, clearAccessToken } from '../services/api';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe } from '../services/authService';

/**
 * AuthContext — full Phase 2 implementation.
 *
 * State kept in memory:
 *   user          — safe user object or null
 *   accessToken   — in-memory JWT (never in localStorage)
 *   loading       — initial auth check in progress
 *
 * Access token is injected into the Axios instance via setAccessToken().
 * Refresh token is stored in an httpOnly cookie (managed by the backend).
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // true while restoring session

    /**
     * Initialise auth state on app mount.
     * Tries to fetch /users/me — if it succeeds, user is already authenticated
     * via the httpOnly cookie. If not, treats user as logged out.
     *
     * NOTE: This requires the backend to support session restoration via cookie.
     * Full refresh-token rotation will be added in Phase 3.
     * For now, the access token is passed back from login/register responses.
     */
    useEffect(() => {
        const restoreSession = async () => {
            const storedToken = sessionStorage.getItem('sl_access_token');
            if (storedToken) {
                setAccessToken(storedToken);
                try {
                    const { data } = await getMe();
                    setUser(data);
                } catch {
                    sessionStorage.removeItem('sl_access_token');
                    clearAccessToken();
                }
            }
            setLoading(false);
        };

        restoreSession();
    }, []);

    /**
     * Log in with email + password.
     */
    const login = useCallback(async (email, password) => {
        const { data } = await apiLogin({ email, password });
        setAccessToken(data.accessToken);
        sessionStorage.setItem('sl_access_token', data.accessToken);
        setUser(data.user);
        return data.user;
    }, []);

    /**
     * Register a new student account and log them in immediately.
     */
    const register = useCallback(async (name, email, password) => {
        const { data } = await apiRegister({ name, email, password });
        setAccessToken(data.accessToken);
        sessionStorage.setItem('sl_access_token', data.accessToken);
        setUser(data.user);
        return data.user;
    }, []);

    /**
     * Logout — clears in-memory token, sessionStorage, and server refresh token.
     */
    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } catch {
            // Ignore logout errors — clear state regardless
        }
        clearAccessToken();
        sessionStorage.removeItem('sl_access_token');
        queryClient.clear();
        setUser(null);
    }, [queryClient]);

    /**
     * Refresh user data from the server.
     */
    const refreshUser = useCallback(async () => {
        const { data } = await getMe();
        setUser(data);
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export default AuthContext;
