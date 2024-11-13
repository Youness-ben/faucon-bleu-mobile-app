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

    console.log(token);

   try {
    const echo = new Echo({
  broadcaster: 'reverb',
  Pusher,
  key: PUSHER_APP_KEY, // Replace with your actual app key from Laravel Reverb
  wsHost: PUSHER_HOST, // Replace with your WebSocket server domain
  wsPort: PUSHER_PORT, // Replace with the port if different
  wssPort: PUSHER_PORT,
  forceTLS: true,
  disableStats: true,
  
  enabledTransports: ['ws', 'wss'],
 authorizer: (channel :any, options : any) => {
       return {
         authorize: (socketId : any, callback : any ) => {
          
           api.post('/broadcasting/auth', {
             socket_id: socketId,
             channel_name: channel.name
           })
           .then(response => {
             console.log(response);
             callback(false, response.data);
           })
           .catch(error => {
             console.log(error);
             callback(true, error);
           });
         }
       };
     },
});
   return echo;
   } catch (error) {
        console.log("hhaha",error);

   }
 //   return echo;
  };
  
  export default initializeEcho;