import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket']
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // User events
      newSocket.on('users-online', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('user-joined', (userData) => {
        toast.success(`${userData.name} joined the consultation`);
      });

      newSocket.on('user-left', (userData) => {
        toast(`${userData.name} left the consultation`);
      });

      // Consultation events
      newSocket.on('new-message', (data) => {
        // Handle new message - this will be used by consultation components
        console.log('New message received:', data);
      });

      newSocket.on('consultation-assigned', (data) => {
        if (data.expertId === user._id) {
          toast.success('You have been assigned to a new consultation!');
        }
      });

      newSocket.on('consultation-status-changed', (data) => {
        toast(`Consultation status changed to: ${data.status}`);
      });

      // Notification events
      newSocket.on('notification', (notification) => {
        toast(notification.message, {
          icon: getNotificationIcon(notification.type),
          duration: 5000
        });
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [user, token]);

  // Helper function to get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'consultation-assigned':
        return '👨‍⚕️';
      case 'new-message':
        return '💬';
      case 'status-update':
        return '📋';
      case 'weather-alert':
        return '🌤️';
      default:
        return '🔔';
    }
  };

  // Socket methods
  const joinConsultation = (consultationId) => {
    if (socket && isConnected) {
      socket.emit('join-consultation', consultationId);
    }
  };

  const leaveConsultation = (consultationId) => {
    if (socket && isConnected) {
      socket.emit('leave-consultation', consultationId);
    }
  };

  const sendMessage = (consultationId, message, attachments = []) => {
    if (socket && isConnected) {
      socket.emit('send-message', {
        consultationId,
        message,
        attachments,
        timestamp: new Date()
      });
    }
  };

  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('join-room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('leave-room', roomId);
    }
  };

  const emitTyping = (consultationId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { consultationId, isTyping });
    }
  };

  // Subscribe to specific events
  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    joinConsultation,
    leaveConsultation,
    sendMessage,
    joinRoom,
    leaveRoom,
    emitTyping,
    on,
    off
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};