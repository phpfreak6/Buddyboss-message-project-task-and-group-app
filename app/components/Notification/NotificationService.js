// NotificationService.js

import notifee, { AndroidImportance, EventType } from '@notifee/react-native';


import { Platform, Alert } from 'react-native';


// EXPORTED FUNCTION TO SHOW NOTIFICATION
export const showLocalNotification = async (title, message) => {

    await notifee.requestPermission({
      sound: true,
      announcement: true,
      badge: true,
    })
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });
    
    await notifee.displayNotification({
      title,
      body: message,
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
        sound: 'default',
        vibration: true, 
      },
      ios: {
        critical: true,
        sound: 'default',
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    });
    
};

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('[Background] Notification Pressed:', detail.notification?.title);
    // Optional: handle navigation/deep link logic here
  }
});