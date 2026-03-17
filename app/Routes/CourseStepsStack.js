import React, { useState, useEffect, Fragment } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CourseStepsScreen from '../Pages/Courses/CourseStepsScreen';

const Stack = createStackNavigator();

const CourseStepsStack = () => {
  return (
    <Stack.Navigator
        screenOptions={({ route }) => {
        const direction = route?.params?.transitionDirection;
        return {
            headerShown: false,
            unmountOnBlur: true,
            gestureDirection: direction === 'backward' ? 'horizontal-inverted' : 'horizontal',
        };
        }}
    >
      <Stack.Screen name="CourseStepsScreen" component={CourseStepsScreen}  options={{ unmountOnBlur: true }} />
    </Stack.Navigator>
  );
};

export default CourseStepsStack; 