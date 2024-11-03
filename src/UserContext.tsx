import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface User {
  id: string;
  email: string;
  name: string;
  type: 'client' | 'vehicle';
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (token: string, userType: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user data when the app starts
    const checkUserData = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    checkUserData();
  }, []);

  const login = async (token: string, userType: string) => {
    try {
      // Set the token in the API instance
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user data from the server
      const response = await api.get('/api/user');
      const userData: User = {
        ...response.data,
        type: userType as 'client' | 'vehicle'
      };

      // Store user data
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userType', userType);

      setUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear stored data
      await AsyncStorage.multiRemove(['user', 'userToken', 'userType']);
      // Clear the token from the API instance
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};