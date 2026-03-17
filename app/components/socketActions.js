import { NODE_BACKEND } from '@env';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SET_SOCKET } from '../constants';
import notifee from '@notifee/react-native';

const API_ROOT = NODE_BACKEND;

export const connectSocket = (states) => async (dispatch, getState) => {

    //await notifee.setBadgeCount(0);


    const existingSocket = states.socket;
    const currentUser = states.currentUser;

    if (existingSocket && existingSocket.connected) {
        console.log('Socket already connected:', existingSocket.id);
        return existingSocket;
    }

    try {
        const token = await AsyncStorage.getItem('jwt');
        const socket = await io(`${API_ROOT}`, {
            transports: ['websocket'],
            auth: {
                token: token,
            },
            reconnection: true,               
            reconnectionAttempts: 5,        
            reconnectionDelay: 2000,        
            reconnectionDelayMax: 5000  
        });



        socket.on('connect', () => {
            console.log('✅ Connected to the server:', socket.id);
            socket.emit('add-client', currentUser.user);
        });

        socket.on('disconnect', (reason) => {
            console.log('⚠️ Disconnected:', reason);
            if (reason === 'io server disconnect') {
                socket.connect(); 
            }
        });

        socket.on('connect_error', (error) => {
            console.log('❌ Connection error:', error);
        });

        dispatch({ type: SET_SOCKET, payload: socket });

        return socket;
    } catch (error) {
        console.error('Error connecting to socket:', error);
        return null;
    }
};

export const disconnectSocket = () => (dispatch, getState) => {
    const socket = getState().common.socket;

    if (socket) {
        socket.disconnect();
        dispatch({ type: SET_SOCKET, payload: null });
        console.log('👋 Disconnected from the server');
    }
};
