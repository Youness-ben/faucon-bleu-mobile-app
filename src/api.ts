import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAIN_URL } from '../config';

const api = axios.create({
  baseURL: MAIN_URL, // Replace with your actual API base URL
  headers: {
    'Content-Type': 'application/json',
   // 'Accept': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    // Get the token from AsyncStorage
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    
    return Promise.reject(error);
  }
);

export default api;