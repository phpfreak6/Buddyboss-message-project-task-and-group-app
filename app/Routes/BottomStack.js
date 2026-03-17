import React, { Fragment, useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';

import agent from '../agent';
import AuthStackScreen from './AuthStackScreen';
import styles from '../Pages/styles/commonstyle';

import Home from '../Pages/Home';
import Messages from '../Pages/Messages';
import Settings from '../Pages/Settings';
import Groups from '../Pages/Groups';

import { BottomTabView } from '../components';
import AppNavigator from './StackNavigator';
import CourseNavigator from './CourseNavigator';

const BottomStack = (props) => {
	const { currentUser, newRegistration, loationId, isLoggedIn, firstScreen } = props;
	const [hideBar, setHideBar] = useState(false);
	const BottomTab = createBottomTabNavigator();

	const handleShowBar = (val) => {
		setHideBar(val);
	}

	useEffect(() => {
		if(isLoggedIn) {
			//SplashScreen.hide();
		}
	}, [isLoggedIn])

	return (
		<Fragment>
			<BottomTab.Navigator
				initialRouteName={firstScreen}
				screenOptions={({ route }) => ({
					headerShown: route.name === 'Settings' || route.name === 'Groups',
					unmountOnBlur: true
				})}
				tabBar={(props) => <BottomTabView {...props} hideBar={hideBar} setHideBar={handleShowBar} />}
			>
				<BottomTab.Screen name="Home" component={Home} options={{ unmountOnBlur: true, icon: 'home-outline', headerStatusBarHeight: 0 }}/>
				<BottomTab.Screen name="Message" component={AppNavigator} options={{ unmountOnBlur: true, icon: 'email-outline', screen: 'messages', headerStatusBarHeight: 0 }}/>
				<BottomTab.Screen name="Groups" component={Groups} options={{ unmountOnBlur: true, icon: 'account-group-outline', screen: 'groups', headerShown: false, headerStatusBarHeight: 0 }}/>
				<BottomTab.Screen name="Courses" component={CourseNavigator} options={{ unmountOnBlur: true, icon: 'school-outline', screen: 'courses', headerStatusBarHeight: 0 }}/>
				<BottomTab.Screen name="Settings" component={Settings} options={{ unmountOnBlur: true, icon: 'cog-outline', headerShown: true, headerStatusBarHeight: 0 }}/>
		    </BottomTab.Navigator>
		</Fragment>
	)


}

export default BottomStack;