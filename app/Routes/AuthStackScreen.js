import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Home from '../Pages/Home';
import NewMessage from '../Pages/Messages/NewMessage';

const AuthStackScreen = (props) => {
	const Stack = createStackNavigator();

	return (
		<Stack.Navigator screenOptions={{ unmountOnBlur: true }}>
			<Stack.Screen name="Home" component={Home} options={{ unmountOnBlur: true, headerShown: false }} />
			<Stack.Screen name="NewMessage" component={NewMessage} options={{ unmountOnBlur: true, headerShown: false }} />
		</Stack.Navigator>
	)
}

export default AuthStackScreen;