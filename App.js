import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { configureFonts, DefaultTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import notifee, { EventType } from '@notifee/react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

import store from './app/store';
import { Slot } from 'expo-router';
import App from './app/index.js';


notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('🔙 Notification Pressed:', detail.notification?.title);
  }
});

export default function App2() {
  return (
    <ReduxProvider store={store}>
      <PaperProvider>
        <GestureHandlerRootView>
          <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F7', paddingBottom: Platform.OS === 'ios' ? -15 : 0 }}>
              <App />
            </SafeAreaView>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </PaperProvider>
    </ReduxProvider>
  );
} 