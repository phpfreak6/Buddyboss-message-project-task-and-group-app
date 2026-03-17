import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';

import { useSelector, useDispatch } from 'react-redux';
import notifee from '@notifee/react-native';


import TabNameIcon from './TabNameIcon';
import styles from './styles';

import agent from '../agent';

import {  UNREAD_COUNT_CALLING } from '../constants';

export const setUnreadCountCalling = (type) => ({
  type: UNREAD_COUNT_CALLING,
  success: type
});

const BottomTabView = (props) => {
	const { state, descriptors, navigation, hideBar, setHideBar } = props;

	const unreadCountCalling = useSelector((state) => state.common.unreadCountCalling);
	
	const dispatch = useDispatch();

	const [unreadCount, setUnreadCount] = useState(0);

	const fetchUnreadMessage = async () => {
	
		try {

			dispatch(setUnreadCountCalling("false"));
			
			const Response = await agent.Auth.fetchUnreadMessage(); 

			if(Response && Response.isSuccess && Response.data && Response.data.count){
				await notifee.setBadgeCount(parseInt(Response.data.count));
			    setUnreadCount(parseInt(Response.data.count));
			}else{
				await notifee.setBadgeCount(0);
				setUnreadCount(0);
			}
	
	
		} catch (error) {
            await notifee.setBadgeCount(0);
			setUnreadCount(0);
			
			console.error('Error fetching thread data:', error);
		} 
	};


	useEffect(() => {

		if(unreadCountCalling == true){
			fetchUnreadMessage();
		}
		
	}, [unreadCountCalling]);

	useEffect(() => {

		dispatch(setUnreadCountCalling("true"));
		
	}, []);
	

	return (
		<View style={[styles.flexDiv, styles.bottomBar.main, (hideBar) ? styles.bottomBar.hide : '']}>
			{state.routes.map((route: any , index: number) => {
				const { options } = descriptors[route.key];
				const label = options.tabBarLabel !== undefined ? options.tabBarLabel
				: options.title !== undefined ? options.title : route.name;

				const isFocused = state.index === index;
				const isHiding = (options.hide) ? options.hide : false;

				if(isHiding && isFocused) {
					setHideBar(true);
				} else {
					setHideBar(false);
				}

				const onPress = () => {
					const event = navigation.emit({
						type: 'tabPress',
						target: route.key,
					});

					if (!isFocused && !event.defaultPrevented) {
						navigation.navigate(route.name);
					}
				};

				return (
					<View key={index} style={[
						styles.bottomBar.tab.main,
						(isHiding) ? styles.bottomBar.hide : ''
					]}>
						<Pressable
							onPress={onPress}
							style={[styles.bottomBar.tab.button.main]}
						>
							<TabNameIcon label={label} focused={isFocused} options={options} unreadCount={unreadCount} />
						</Pressable>
					</View>
				);
			})}
		</View>
  	);
}

export default BottomTabView;