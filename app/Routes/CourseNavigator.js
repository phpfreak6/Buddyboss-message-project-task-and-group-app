import React, { useState, useEffect, Fragment } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Courses from '../Pages/Courses';

const Stack = createStackNavigator();

const CourseNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ unmountOnBlur: true }}>
      <Stack.Screen name="Courses" component={Courses}  options={{ unmountOnBlur: true, headerStatusBarHeight: 0 }} />
    </Stack.Navigator>
  );
};

export default CourseNavigator; 