import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { createStackNavigator } from '@react-navigation/stack';

import Login from '../Pages/Login';
import ForgotPassword from '../Pages/basics/ForgotPassword';
import PrivacyPolicy from '../Pages/PrivacyPages/PrivacyPolicy';
import TermsOfService from '../Pages/PrivacyPages/TermsOfService';

const UnAuthStackScreen = (props) => {
	const { isLoggedIn } = props;
	const Stack = createStackNavigator();

	useEffect(() => {
		if(!isLoggedIn) {
			setTimeout(function() {
				//SplashScreen.hide();
			}, 600)
		}
	}, [isLoggedIn])

	return (
		<Stack.Navigator>
			<Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
			<Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
			<Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} options={{ headerShown: true, title: "Privacy Policy", headerBackTitleVisible: false, headerTintColor: '#000' }} />
			<Stack.Screen name="TermsOfService" component={TermsOfService} options={{ headerShown: true, title: "Terms of Service", headerBackTitleVisible: false, headerTintColor: '#000' }} />
		</Stack.Navigator>
	)
}

export default UnAuthStackScreen;