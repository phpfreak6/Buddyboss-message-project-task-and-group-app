import React, { useState, useEffect, Fragment } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Messages from '../Pages/Messages';
import NewMessage from '../Pages/Messages/NewMessage';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ unmountOnBlur: true }}>
      <Stack.Screen name="Messages" component={Messages}  options={{ unmountOnBlur: true, headerStatusBarHeight: 0 }} />
    </Stack.Navigator>
  );
};

export default AppNavigator; 