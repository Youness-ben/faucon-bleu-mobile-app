import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';
import { PUSHER_APP_KEY, PUSHER_HOST, PUSHER_PORT } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import api from './api';

const getSanctumToken = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');

      return token+"";
    } catch (error) {
      console.error('Error getting Sanctum token from AsyncStorage:', error);
      return null;
    }
  };
  const initializeEcho = async () => {
    const token = await getSanctumToken();  // Fetch the token from AsyncStorage
  
    if (!token) {
      console.error('No Sanctum token found.');
      return null; 
    }
    const echo = new Echo({
      broadcaster: 'reverb',  
      Pusher,
      key: PUSHER_APP_KEY,  
      wsHost:PUSHER_HOST, 
      wsPort: PUSHER_PORT,  
      forceTLS: false,  
      encrypted: false,  
      authorizer:(channel :any, options : any) => {
        return {
            authorize: (socketId :any , callback : any ) => {
                api.post('/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                })
                .then(response => {
                    callback(false, response.data);
                })
                .catch(error => {
                    callback(true, error);
                });
            }
        };
    },
    
    });

    return echo;
  };
  
  export default initializeEcho;