import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://192.168.1.229:8000', // Replace with your actual API base URL
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
    
    console.log(error.toJSON());
    return Promise.reject(error);
  }
);

export default api;