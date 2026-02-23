import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useAuth } from './AuthContext';
import { notificationAPI, userAPI } from '../services/api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationContext = createContext();

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

const getSocketUrl = () => {
  if (Platform.OS === 'web') return 'https://native-be-lean.onrender.com';
  
  // Try multiple ways to get the config URL
  const custom = Constants.expoConfig?.extra?.apiUrl || Constants.manifest?.extra?.apiUrl;
  if (custom && custom.trim()) {
    const socketUrl = custom.replace(/\/api\/?$/, '');
    console.log('Using Socket URL from config:', socketUrl);
    return socketUrl;
  }
  
  // Production fallback - always use Render URL for APK builds
  const fallbackUrl = 'https://native-be-lean.onrender.com';
  console.log('Using fallback Socket URL:', fallbackUrl);
  return fallbackUrl;
};

export const NotificationProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data?.count ?? 0);
    } catch (_) { }
  };

  const registerForPushNotificationsAsync = async () => {
    let pushToken;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || "dbb947ec-142f-4aef-a5c2-b46c8da67794";
        console.log('Fetching push token for project:', projectId);
        pushToken = (await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        })).data;
        console.log('Successfully fetched push token:', pushToken);
      } catch (e) {
        console.log('Error fetching push token:', e);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    if (pushToken) {
      try {
        // Use userAPI if available, or direct api call
        if (userAPI && userAPI.savePushToken) {
          console.log('Saving push token to backend...');
          const response = await userAPI.savePushToken(pushToken);
          console.log('Token saved response:', response.data);
        } else {
          console.log('savePushToken API not defined yet');
        }
      } catch (error) {
        console.log('Error saving push token to backend:', error);
      }
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotificationsAsync();

    // Listener for incoming notification when app is foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Handle foreground notification received (Expo handles via setNotificationHandler)
      // We can also update unread count here if the notification came from system
      setUnreadCount(c => c + 1);
    });

    // Listener for user interaction with notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Handle navigation here if needed
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    fetchUnreadCount();

    const s = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => { });
    s.on('notification', (data) => {
      setUnreadCount((c) => c + 1);

      // Trigger local notification for immediate feedback (Foreground)
      Notifications.scheduleNotificationAsync({
        content: {
          title: data.title || 'LoanSnap',
          body: data.body || 'New notification',
          data: data,
        },
        trigger: null,
      });
    });
    s.on('connect_error', () => { });

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, token]);

  const refreshUnreadCount = useCallback(() => {
    fetchUnreadCount();
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, hasUnread: unreadCount > 0, socket, lastNotification: Date.now() }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
