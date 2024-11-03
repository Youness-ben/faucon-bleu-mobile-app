import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';

interface NotificationContextType {
  newMessages: { [serviceId: string]: number };
  addNewMessage: (serviceId: string) => void;
  clearNewMessages: (serviceId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC = ({ children }) => {
  const [newMessages, setNewMessages] = useState<{ [serviceId: string]: number }>({});

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data.type === 'new_message' && data.serviceId) {
        addNewMessage(data.serviceId);
      }
    });

    return () => subscription.remove();
  }, []);

  const addNewMessage = (serviceId: string) => {
    setNewMessages(prev => ({
      ...prev,
      [serviceId]: (prev[serviceId] || 0) + 1,
    }));
  };

  const clearNewMessages = (serviceId: string) => {
    setNewMessages(prev => {
      const newState = { ...prev };
      delete newState[serviceId];
      return newState;
    });
  };

  return (
    <NotificationContext.Provider value={{ newMessages, addNewMessage, clearNewMessages }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};