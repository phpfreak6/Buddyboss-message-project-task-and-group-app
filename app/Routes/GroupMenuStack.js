import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MembersScreen, PhotosScreen, VideosScreen, AlbumsScreen, ManageScreen, AddGroupPhoto, AddGroupVideo, CreateGroupMessage, GroupCoursesScreen } from '../Pages/Groups/GroupMenu';

const Stack = createStackNavigator();

const GroupMenuStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MembersScreen" component={MembersScreen} />
      <Stack.Screen name="PhotosScreen" component={PhotosScreen} />
      <Stack.Screen name="VideosScreen" component={VideosScreen} />
      <Stack.Screen name="AlbumsScreen" component={AlbumsScreen} />
      <Stack.Screen name="ManageScreen" component={ManageScreen} />
      <Stack.Screen name="AddGroupPhoto" component={AddGroupPhoto} />
      <Stack.Screen name="AddGroupVideo" component={AddGroupVideo} />
      <Stack.Screen name="CreateGroupMessage" component={CreateGroupMessage} />
      <Stack.Screen name="GroupCoursesScreen" component={GroupCoursesScreen} />
    </Stack.Navigator>
  );
};

export default GroupMenuStack; 