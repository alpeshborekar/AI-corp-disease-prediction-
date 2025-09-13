import React, { createContext, useContext, useReducer, useEffect } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

// Auth Context
const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  UPDATE_USER: "UPDATE_USER",
  SET_LOADING: "SET_LOADING",
};

// Initial State
const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: true,
  error: null,
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return { ...state, loading: true, error: null };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      localStorage.setItem("token", action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      localStorage.removeItem("token");
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem("token");
      return { ...state, user: null, token: null, loading: false, error: null };

    case AUTH_ACTIONS.UPDATE_USER:
      return { ...state, user: { ...state.user, ...action.payload } };

    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    default:
      return state;
  }
};

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check user auth status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        const response = await authAPI.getProfile();
        // Handle nested response structure for profile
        const userData = response.data.data?.user || response.data.user;
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: userData, token },
        });
      } catch (error) {
        console.error("Auth check failed:", error);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    checkAuthStatus();
  }, []);

  // ---------- FUNCTIONS ----------

  // Login
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const response = await authAPI.login(credentials);
      
      // Handle nested response structure
      const { data } = response.data; // Extract data from nested response
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: data });
      toast.success(`Welcome back, ${data.user.name}!`);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const response = await authAPI.register(userData);
      
      // Handle nested response structure - backend returns { status, message, data: { user, token } }
      const { data } = response.data; // Extract the actual user data from nested response
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: data });
      toast.success(`Welcome to CropCare, ${data.user.name}!`);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Registration failed";
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success("Logged out successfully");
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      
      // Handle nested response structure
      const updatedUser = response.data.data?.user || response.data.user;
      
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedUser });
      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Update failed";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success("Password changed successfully");
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Password change failed";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await authAPI.forgotPassword({ email });
      toast.success("Password reset email sent");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to send reset email";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      await authAPI.resetPassword(token, { password });
      toast.success("Password reset successfully");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Password reset failed";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Role checkers
  const hasRole = (role) => state.user?.role === role;
  const hasAnyRole = (roles) => roles.includes(state.user?.role);

  // ---------- PROVIDER VALUE ----------
  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};