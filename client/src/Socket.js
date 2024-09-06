import {io} from 'socket.io-client';

export const initSocket = async () =>{
    const socket = io({
        reconnection: true,               // Enable automatic reconnection
        reconnectionAttempts: 5,          // Number of retries
        reconnectionDelay: 50,            // Initial delay (in ms)
        reconnectionDelayMax: 250,        // Max delay (in ms)
        timeout: 5000                     // Timeout for connection attempt
      });      
    return io(process.env.REACT_APP_BACKEND_URL, options);
}