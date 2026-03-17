import React, { useEffect, useState } from 'react';
import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  getToken,
  onMessage,
} from '@react-native-firebase/messaging';

import { createNavigationContainerRef } from '@react-navigation/native';

import notifee, { AuthorizationStatus } from '@notifee/react-native';
import agent from '@/agent';

export const navigationRef = createNavigationContainerRef();


async function requestSystemNotificationPermission() {
	if (Platform.OS === 'android' && Platform.Version >= 33) {
		const granted = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
			{
				title: 'Notification Permission',
				message: 'This app needs notification permission to send you updates.',
				buttonPositive: 'Allow',
				buttonNegative: 'Deny',
			}
		);
		return granted === PermissionsAndroid.RESULTS.GRANTED;
	}
	// On iOS, system permission is handled by Firebase's requestPermission
	return true;
}

async function saveFcmToken(fcmToken, userId = null) {
	try {
         
	   const Response = await agent.Auth.saveFcmToken(fcmToken);


	} catch (error) {
	   console.error('Error fetching thread data:', error);
	}
	
}

export async function requestUserPermission(setFcmToken, userId = null) {
	try {
		

		const messagingInstance = getMessaging(getApp());

		//console.log("messagingInstance", messagingInstance);
		const systemPermission = await requestSystemNotificationPermission();
		if (!systemPermission) return null;


		const status = await requestPermission(messagingInstance, {
			alert: true,
			badge: true,
			sound: true,
			provisional: false,
		  });
	  
		  if (
			status === AuthorizationStatus.AUTHORIZED ||
			status === AuthorizationStatus.PROVISIONAL
		  ) {
			const fcmToken = await getToken(messagingInstance);
			if (userId) {
			  saveFcmToken(fcmToken, userId);
			}
			
			console.log('✅ FCM Token:', fcmToken);
			if (setFcmToken) setFcmToken(fcmToken);
			return fcmToken;
		  } else {
			console.log('Permission Denied: Push notifications are disabled.');
			return null;
		  }
	} catch (error) {
		console.error('🔥 Error requesting push permission:', error);
		return null;
	}
}
export function getCurrentScreen() {
	if (navigationRef.isReady()) {
		return navigationRef.getCurrentRoute()?.name;
	}
	return null;
}
export const setupNotificationListeners = async (currentUser = null) => {
	const messagingInstance = getMessaging(getApp());
	const { showLocalNotification } = await import('../Notification/NotificationService');

  
	// Foreground
	onMessage(messagingInstance, async remoteMessage => {
	  const { title, body } = remoteMessage.notification || {};
	  const currentScreen = getCurrentScreen();
	  console.log('📩 Foreground FCM:', remoteMessage);
	  if (title && body && currentScreen !== 'ThreadScreen' && currentUser) showLocalNotification(title, body);
	});
  
	// Background
	messagingInstance.setBackgroundMessageHandler(async remoteMessage => {
	  const { title, body } = remoteMessage.notification || {};
	  

	  const currentScreen = getCurrentScreen();
	  console.log("currentScreen",currentScreen)
	  console.log('📩 Background FCM:', remoteMessage);
	  if (title && body && currentScreen !== 'ThreadScreen' && currentUser) showLocalNotification(title, body);
	});
  
	// App opened from quit state
	const initialNotification = await messagingInstance.getInitialNotification();
	if (initialNotification?.data?.threadId && navigationRef.isReady()) {
	  navigationRef.navigate('ThreadScreen', {
		threadId: parseInt(initialNotification.data.threadId),
		hasRefreshed: true,
	  });
	}
  
	// App opened from background
	messagingInstance.onNotificationOpenedApp(remoteMessage => {
	  if (remoteMessage?.data?.threadId && navigationRef.isReady()) {
		navigationRef.navigate('ThreadScreen', {
		  threadId: parseInt(remoteMessage.data.threadId),
		  hasRefreshed: true,
		});
	  }
	});
};

export const NotificationModule = async (setFcmToken, userId = null) => {
	//await notifee.setBadgeCount(0);
	//await notifee.cancelAllNotifications();
	return await requestUserPermission(setFcmToken, userId);
};

