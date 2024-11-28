import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAIN_URL } from '../config';

const api = axios.create({
  baseURL: MAIN_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
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