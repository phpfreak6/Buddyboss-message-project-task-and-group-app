import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';

import { ModelView } from '../../../components';
import { CloseIco } from '../../../assets/images';

//import Icon from 'react-native-vector-icons/MaterialIcons';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { LogoIco, NameIco, DocIco, LockIco, OutIco, ShieldIco, RoundUserIco } from '../../../assets/images';
import styles from '../styles';

const Listing = (props) => {
	const { navigation, logout } = props;
	const [showModel, setShowModel] = useState(false);
	const [pageArray, setPageArray] = useState([
		{ key: 0, name: 'Home', screen: 'Home', icon: "home-variant-outline", style: 'home' },
		{ key: 1, name: 'Messages', screen: 'Message', icon: "email-outline", style: 'comment' },
		{ key: 2, name: 'Custom Menus', screen: 'CustomMenu', icon: "link-variant", style: 'link-variant' },
		{ key: 3, name: 'Task & Projects Centre', screen: 'Projects', icon: "checkbox-marked-outline", style: 'checkbox-marked-outline' },
		{ key: 4, name: 'Training Courses', screen: 'Courses', icon: "school-outline", style: 'school-outline' },
		{ key: 5, name: 'Training Dashboard', screen: 'TrainingDashboard', icon: "clipboard-text-outline", style: 'clipboard-text-outline' },
		{ key: 6, name: 'Change Password', screen: 'ChangePassword', icon: "lock-outline", style: 'lock' },
		{ key: 7, name: 'More', screen: 'More', icon: "format-list-bulleted", style: 'list' },
	]);

	const handleLogout = () => {
		logout();
	}

	const checkLogout = () => {
		setShowModel(true);
	}

	const handleScreenChange = (screen) => {
		if(screen) {
			navigation.navigate(screen);
		}
	}

	return (
		<View style={styles.listing.main}>
			{pageArray.map((item, k) => {
				return (
					<Pressable
						key={item.key}
						style={[styles.flexDiv, styles.listing.list.main]}
						onPress={() => handleScreenChange(item.screen)}
					>
						<Icon
							name={item.icon}
							size={25}
							color={'#000'}
						/>
						<Text style={styles.listing.list.text}>{item.name}</Text>
					</Pressable>
				)
			})}

			<Pressable style={[styles.flexDiv, styles.listing.list.main]} onPress={checkLogout}>
				<Icon
					name={"logout"}
					size={25}
					color={'#000'}
				/>
				<Text style={styles.listing.list.text}>Log Out</Text>
			</Pressable>

			<View style={styles.listing.logo.main}>
				<Image source={LogoIco} alt='logo' style={styles.listing.logo.icon} />
			</View>

			<ModelView visible={showModel} setVisible={setShowModel}>
				<View style={styles.models.logout.main}>
					<Pressable style={[styles.autoLeft, styles.models.logout.close.main]} onPress={() => setShowModel(false)}>
						<Image source={CloseIco} alt='' style={styles.models.logout.close.icon} />
					</Pressable>

					<Text style={styles.models.logout.text}>Are you sure you want to Log out?</Text>

					<View style={[styles.flexDiv, styles.models.logout.buttons.main]}>
						<Pressable style={[styles.models.logout.buttons.button.main, styles.models.logout.buttons.button.normal]} onPress={() => setShowModel(false)}>
							<Text style={styles.models.logout.buttons.button.text}>No</Text>
						</Pressable>
						<Pressable style={[styles.models.logout.buttons.button.main, styles.models.logout.buttons.button.colored]} onPress={handleLogout}>
							<Text style={[styles.models.logout.buttons.button.text, styles.models.logout.buttons.button.colorText]}>Log Out</Text>
						</Pressable>
					</View>
				</View>
			</ModelView>
		</View>
	)


}

export default Listing;