import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';



import {
	BottomCartIco, BottomCartActiveIco, BottomHomeIco, BottomHomeActiveIco, BottomSettingIco, BottomSettingActiveIco
} from '../assets/images';
import styles from './styles';

const TabNameIcon = (props) => {
	const { label, focused, options, unreadCount } = props;
	const [showIcon, setShowIcon] = useState(false);
	const [imageShow, setImageShow] = useState(null);
	



	useEffect(() => {
		if(options) {
			if(options.icon) {
				setShowIcon(true);
				if(options.icon == 'home') {
					let ico = (focused) ? BottomHomeActiveIco : BottomHomeIco;
					setImageShow(ico)
				}

				if(options.icon == 'cart') {
					let ico = (focused) ? BottomCartActiveIco : BottomCartIco;
					setImageShow(ico)
				}

				if(options.icon == 'setting') {
					let ico = (focused) ? BottomSettingActiveIco : BottomSettingIco;
					setImageShow(ico)
				}

				if(options.icon === 'messages') {
					let ico = (focused) ? BottomHomeActiveIco : BottomHomeIco;
					setImageShow(ico)
				}
			}
		}
	}, [options])

	return (
		<View style={styles.bottomBar.tab.button.content}>
			<View style={styles.iconContainer}>
				{showIcon && (
					<Icon
						name={options.icon === 'messages' ? 'comment' : options.icon}
						size={30}
						color={focused ? '#ff7a08' : '#333'}
						style={styles.iconContainer.icon}
					/>
				)}

                {options.screen && options.screen === 'messages' && unreadCount > 0  && (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>{unreadCount}</Text>
					</View>
				)}

			</View>

			<Text
				style={[
					styles.bottomBar.tab.button.text,
					focused ? styles.bottomBar.tab.button.active : '',
				]}
			>
				{label}
			</Text>
		</View>
	)
}

export default TabNameIcon;