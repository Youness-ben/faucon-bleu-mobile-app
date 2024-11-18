import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface User {
  id: number;
  email?: string;
  avatar?: string;
  phone?: string;
  last_name?: string;
  first_name?: string;
  plate_number?: string;
  type: 'client' | 'vehicle';
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (token: string, userType: 'client' | 'vehicle') => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userType = await AsyncStorage.getItem('userType');
      if (token && userType) {
        await login(token, userType as 'client' | 'vehicle');
      }
    };
    loadUser();
  }, []);

  const login = async (token: string, userType: 'client' | 'vehicle') => {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/user');
      const userData = response.data;

      const newUser: User = {
        id: userData.id,
        type: userType,
        ...(userType === 'client' ? { email: userData.email, last_name: userData.last_name, first_name: userData.first_name, avatar: userData.avatar } : { plate_number: userData.plate_number, avatar: userData.avatar }),
      };

      setUser(newUser);
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userType', userType);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userType']);
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