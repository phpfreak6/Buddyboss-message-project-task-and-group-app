import React, { Fragment, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Linking, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import { useIsFocused } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { LOGOUT } from '../../../constants';
import agent from '@/agent';
import { ViewLayout, VerticalScroll } from '@/Pages/Layouts';
import { PageLoader, StatusBar } from '@/components';

const mapStateToProps = state => ({
	...state,
	currentUser: state.common.currentUser,
});

const mapDispatchToProps = dispatch => ({
	logout: () => dispatch({ type: LOGOUT })
});

const MenuItem = ({ icon, title, badge, screen, nested, url, onPress, navigation }) => (
	<TouchableOpacity style={styles.menuItem} onPress={() => handleScreenChange(navigation, screen, nested, url)}>
		<Icon name={icon} size={24} color="#333" />
		<Text style={styles.menuText}>{title}</Text>
		{badge && (
			<View style={styles.badge}>
				<Text style={styles.badgeText}>{badge}</Text>
			</View>
		)}
		<Icon name="chevron-right" size={20} color="#666" />
	</TouchableOpacity>
);

const SectionTitle = ({ title }) => (
	<Text style={styles.sectionTitle}>{title}</Text>
);

const menuItems = [
	{
		id: 'notifications',
		type: 'item',
		title: 'Notifications',
		icon: 'bell-outline',
		badge: '4',
		screen: 'Notification',
		nested: false
	},
	{
		id: 'tasks',
		type: 'section',
		sectionTitle: 'TASK & PROJECTS CENTRE',
		items: [
			{
				id: 'mytasks',
				title: 'My Tasks',
				icon: 'checkbox-marked-outline',
				badge: '',
				screen: 'MyTasks',
				nested: false
			},
			{
				id: 'projects',
				title: 'Projects',
				icon: 'folder-multiple-outline',
				badge: '',
				screen: 'Projects',
				nested: false
			}
		]
	},
	{
		id: 'training',
		type: 'section',
		sectionTitle: 'TRAINING CENTRE',
		items: [
			{
				id: 'courses',
				title: 'Training Courses',
				icon: 'school-outline',
				badge: '',
				screen: 'Courses',
				nested: true
			},
			// {
			// 	id: 'categories',
			// 	title: 'Training Categories',
			// 	icon: 'folder-outline',
			// 	badge: '',
			// 	screen: 'Message',
			// 	nested: true
			// },
			// {
			// 	id: 'certificates',
			// 	title: 'Training Certificates',
			// 	icon: 'certificate-outline',
			// 	badge: '',
			// 	screen: 'Message',
			// 	nested: true
			// }
		]
	},
	{
		id: 'community',
		type: 'section',
		sectionTitle: 'COMMUNITY',
		items: [
			{
				id: 'messages',
				title: 'Messages',
				icon: 'email-outline',
				badge: '',
				screen: 'Message',
				nested: true
			}
		]
	},
	{
		id: 'menus',
		type: 'section',
		sectionTitle: 'CUSTOM MENUS',
		items: []
	},
	{
		id: 'privacy',
		type: 'section',
		sectionTitle: 'PRIVACY PAGES',
		items: [
			{
				id: 'privacy-policy',
				title: 'Privacy Policy',
				icon: 'file-document-outline',
				badge: '',
				screen: 'PrivacyPolicy',
				nested: false
			},
			{
				id: 'terms-of-service',
				title: 'Terms of Service',
				icon: 'file-document-outline',
				badge: '',
				screen: 'TermsOfService',
				nested: false
			}
		]
	}
];

const handleScreenChange = async (navigation, screen, nested, url) => {
	if(screen) {
	  if(nested) {
		// For bottom tab navigation
		navigation.reset({
		  index: 0,
		  routes: [
			{
			  name: 'BottomStack',
			  state: {
				routes: [{ name: screen }]
			  }
			}
		  ]
		});
	  } else if (url) {
		// Open URL in browser
		try {
			const supported = await Linking.canOpenURL(url);
			if (supported) {
				await Linking.openURL(url);
			} else {
				console.error("Cannot open URL: " + url);
			}
		} catch (error) {
			console.error("Error opening URL: " + error);
		}
	  } else {
		// For root level navigation
		navigation.navigate(screen);
	  }
	}
};

const More = (props) => {
	const { navigation, logout, currentUser } = props;

	const [showLoader, setShowLoader] = useState(false);
	const [showStatus, setShowStatus] = useState(false);
	const [statusProps, setStatusProps] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [filteredMenu, setFilteredMenu] = useState(menuItems);
	const [customMenus, setCustomMenus] = useState([]);
	const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
	const isFocused = useIsFocused();

	useEffect(() => {
		if (isFocused) {
			fetchCustomMenus();
			fetchUnreadNotificationCount();
		}
	}, [isFocused]);

	const fetchCustomMenus = async () => {
		try {
			setShowLoader(true);
			const response = await agent.Auth.getCustomMenus();

			//console.log(JSON.stringify(response, null, 2))
			if (response && response.isSuccess && response.data && response.data.menus) {
				const customMenuItems = Object.entries(response.data.menus).map(([title, url], index) => ({
					id: `custom-menu-${index}`,
					title: title,
					icon: 'link-variant',
					badge: '',
					screen: 'WebView',
					nested: false,
					url: url
				}));

				setCustomMenus(customMenuItems);
				
				// Update menuItems with custom menus
				const updatedMenuItems = menuItems.map(item => {
					if (item.id === 'menus') {
						// Only include the menus section if there are custom menus
						return customMenuItems.length > 0 ? {
							...item,
							items: customMenuItems
						} : null;
					}
					return item;
				}).filter(Boolean); // Remove null items
				
				setFilteredMenu(updatedMenuItems);
			} else {
				// If no custom menus, remove the menus section
				const updatedMenuItems = menuItems.filter(item => item.id !== 'menus');
				setFilteredMenu(updatedMenuItems);
			}
		} catch (error) {
			console.error('Error fetching custom menus:', error);
			setStatusProps({
				type: 'error',
				message: 'Failed to load custom menus'
			});
			setShowStatus(true);
			// If there's an error, remove the menus section
			const updatedMenuItems = menuItems.filter(item => item.id !== 'menus');
			setFilteredMenu(updatedMenuItems);
		} finally {
			setShowLoader(false);
		}
	};

	const fetchUnreadNotificationCount = async () => {
		try {
			const response = await agent.Auth.getUnreadNotificationCount();
			if (response && response.isSuccess && response.data && typeof response.data.unreadCount === 'number') {
				setUnreadNotificationCount(response.data.unreadCount);
			} else {
				setUnreadNotificationCount(0);
			}
		} catch (error) {
			console.error('Error fetching unread notification count:', error);
			setUnreadNotificationCount(0);
		}
	};

	const ProfileSection = () => (
		<TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Profile")}>
			<Image 
			source={currentUser.user?.image ? { uri: currentUser.user.image } : require('@/assets/images/icons/dummy-user.png')} 
			style={styles.avatar} 
			/>
			<View style={styles.profileInfo}>
				<Text style={styles.menuText}>{(currentUser && currentUser.user && currentUser.user.display_name)?currentUser.user.display_name:''}</Text>
				<Text style={styles.usernameText}>@{currentUser?.user?.user_nicename || 'username'}</Text>
			</View>
			<Icon name="chevron-right" size={20} color="#666" />
		</TouchableOpacity>
	);

	const handleSearch = (text) => {
		setSearchQuery(text);
		if (text.trim() === '') {
			setFilteredMenu(menuItems);
			return;
		}

		const searchText = text.toLowerCase();
		const filtered = menuItems.reduce((acc, item) => {
			if (item.type === 'item') {
				if (item.title.toLowerCase().includes(searchText)) {
					acc.push(item);
				}
			} else if (item.type === 'section') {
				const filteredItems = item.items.filter(subItem => 
					subItem.title.toLowerCase().includes(searchText)
				);
				
				if (filteredItems.length > 0) {
					acc.push({
						...item,
						items: filteredItems
					});
				}
			}
			return acc;
		}, []);

		setFilteredMenu(filtered);
	};

	const renderMenuItem = (item) => {
		if (item.type === 'item') {
			let badge = item.badge;
			if (item.id === 'notifications') {
				badge = unreadNotificationCount > 0 ? unreadNotificationCount.toString() : '';
			}
			return (
				<MenuItem
					key={item.id}
					icon={item.icon}
					title={item.title}
					badge={badge}
					screen={item.screen}
					nested={item.nested}
					url={item.url}
					navigation={navigation}
				/>
			);
		}
		return null;
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ViewLayout noMargin={true} backGroundGrey={true}>
				<View style={styles.container}>
					{showStatus ? <StatusBar {...statusProps} /> : null}

					{/* Search Bar */}
					<View style={styles.searchContainer}>
						<Icon name="magnify" size={20} color="#666" />
						<TextInput 
							style={styles.searchInput}
							placeholder="Search"
							placeholderTextColor="#666"
							value={searchQuery}
							onChangeText={handleSearch}
						/>
						{searchQuery ? (
							<TouchableOpacity onPress={() => handleSearch('')}>
								<Icon name="close" size={20} color="#666" />
							</TouchableOpacity>
						) : null}
					</View>

					<VerticalScroll>
						{/* Profile Section - Always visible */}
						<ProfileSection />

						{/* Separator */}
						<View style={styles.separator} />

						{/* Filtered Menu Items */}
						{filteredMenu.map(item => {
							if (item.type === 'section') {
								return (
									<View key={item.id}>
										<SectionTitle title={item.sectionTitle} />
										{item.items.map(subItem => (
											<MenuItem
												key={subItem.id}
												icon={subItem.icon}
												title={subItem.title}
												badge={subItem.badge}
												screen={subItem.screen}
												nested={subItem.nested}
												url={subItem.url}
												navigation={navigation}
											/>
										))}
									</View>
								);
							}
							return renderMenuItem(item);
						})}

						{/* Bottom Padding */}
						<View style={styles.bottomPadding} />
					</VerticalScroll>

					<PageLoader visible={showLoader} setVisible={setShowLoader} />
				</View>
			</ViewLayout>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	container: {
		padding: 20,
		marginTop: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		color: '#1a1a1a',
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 8,
		paddingHorizontal: 12,
		marginBottom: 16,
	},
	searchInput: {
		flex: 1,
		height: 40,
		marginLeft: 8,
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 15,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
		paddingHorizontal: 15,
		marginBottom: 10,
		backgroundColor: "#fff",
		borderRadius: 8,
		gap: 10,
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 25,
        marginRight: 0,
	},
	menuText: {
		fontSize: 16,
		flex: 1,
	},
	profileInfo: {
		flex: 1,
		marginLeft: 16,
	},
	usernameText: {
		color: '#666',
		fontSize: 14,
	},
	sectionTitle: {
		fontSize: 12,
		color: '#666',
		fontWeight: '600',
		marginTop: 24,
		marginBottom: 8,
		paddingHorizontal: 15,
	},
	badge: {
		backgroundColor: '#ffd700',
		borderRadius: 10,
		paddingHorizontal: 6,
		paddingVertical: 2,
		marginRight: 8,
	},
	badgeText: {
		fontSize: 12,
		color: 'black',
	},
	separator: {
		height: 1,
		backgroundColor: '#f0f0f0',
		marginVertical: 8,
		marginHorizontal: 15,
	},
	bottomPadding: {
		height: 120,
	},
});

export default connect(mapStateToProps, mapDispatchToProps)(More);