import React, { Fragment, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
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

const MenuItem = ({ icon, title, badge, screen, nested, onPress, navigation }) => (
	
	<TouchableOpacity style={styles.menuItem} onPress={() => handleScreenChange(navigation,screen,nested)}>
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
		id: 'profile',
		type: 'section',
		items: [
			{
				id: 'profile',
				title: 'Profile',
				icon: 'account-outline',
				screen: 'UserProfile',
				nested: false
			},
			{
				id: 'profile-photo',
				title: 'Profile Photo',
				icon: 'image-edit-outline',
				screen: 'ProfilePhoto',
				nested: false
			},
			{
				id: 'cover-photo',
				title: 'Cover Photo',
				icon: 'image-frame',
				screen: 'CoverPhoto',
				nested: false
			},
			// {
			// 	id: 'timeline',
			// 	title: 'Timeline',
			// 	icon: 'clock-outline',
			// 	screen: 'Timeline',
			// 	nested: false
			// },
			// {
			// 	id: 'connections',
			// 	title: 'Connections',
			// 	icon: 'account-multiple-outline',
			// 	screen: 'Connections',
			// 	nested: false
			// },
			// {
			// 	id: 'groups',
			// 	title: 'Groups',
			// 	icon: 'account-group-outline',
			// 	screen: 'Groups',
			// 	nested: false
			// },
			// {
			// 	id: 'courses',
			// 	title: 'Courses',
			// 	icon: 'book-outline',
			// 	screen: 'Courses',
			// 	nested: false
			// },
			// {
			// 	id: 'videos',
			// 	title: 'Videos',
			// 	icon: 'video-outline',
			// 	screen: 'Videos',
			// 	nested: false
			// },
			// {
			// 	id: 'photos',
			// 	title: 'Photos',
			// 	icon: 'image-outline',
			// 	screen: 'Photos',
			// 	nested: false
			// },
			// {
			// 	id: 'forums',
			// 	title: 'Forums',
			// 	icon: 'forum-outline',
			// 	screen: 'Forums',
			// 	nested: false
			// }
		]
	}
];

const handleScreenChange = (navigation, screen, nested) => {
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
	  } else {
		// For root level navigation
		navigation.navigate(screen);
	  }
	}
  };

const Profile = (props) => {
	const { navigation, logout,currentUser } = props;


	const [showLoader, setShowLoader] = useState(false);
	const [showStatus, setShowStatus] = useState(false);
	const [statusProps, setStatusProps] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [filteredMenu, setFilteredMenu] = useState(menuItems);

	const ProfileSection = ({ currentUser, navigation }) => (
		<View style={styles.profileContainer}>
			<View style={styles.coverContainer}>
				<Image 
					source={currentUser.user?.cover_image 
						? { uri: currentUser.user.cover_image } 
						: require('@/assets/images/63230be995da2-bp-cover-image.png')
					} 
					style={styles.coverImage}
				/>
				<TouchableOpacity 
					style={styles.backButton}
					onPress={() => navigation.goBack()}
				>
					<Icon name="arrow-left" size={24} color="#fff" />
				</TouchableOpacity>
			</View>
			<View style={styles.profileInfo}>
				<Image 
					source={currentUser.user?.image 
						? { uri: currentUser.user.image } 
						: require('@/assets/images/icons/dummy-user.png')
					} 
					style={styles.profileImage}
				/>
				<Text style={styles.profileName}>
					{currentUser?.user?.display_name || 'User'}
				</Text>
				<Text style={styles.profileUsername}>
					@{currentUser?.user?.user_nicename || 'username'}
				</Text>
			</View>
		</View>
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
			return (
				<MenuItem
					key={item.id}
					icon={item.icon}
					title={item.title}
					badge={item.badge}
					screen={item.screen}
					nested={item.nested}
					navigation={navigation}
				/>
			);
		}
		return null;
	};

	return (
		<ViewLayout noMargin={true}>
			<View style={styles.container}>
				<ProfileSection currentUser={currentUser} navigation={navigation} />
				
				<VerticalScroll>
					{filteredMenu.map(item => {
						if (item.type === 'section') {
							return (
								<View key={item.id}>
									{item.items.map(subItem => (
										<MenuItem
											key={subItem.id}
											icon={subItem.icon}
											title={subItem.title}
											screen={subItem.screen}
											nested={subItem.nested}
											navigation={navigation}
										/>
									))}
								</View>
							);
						}
						return null;
					})}
				</VerticalScroll>
			</View>
		</ViewLayout>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		color: '#1a1a1a',
	},
	searchContainer: {
		backgroundColor: '#f0f0f0',
		margin: 15,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
	},
	searchInput: {
		flex: 1,
		height: 40,
		marginLeft: 8,
		color: '#333',
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 15,
		paddingHorizontal: 15,
		backgroundColor: "#fff",
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 25,
		marginRight: 0,
	},
	menuText: {
		fontSize: 16,
		marginLeft: 15,
		flex: 1,
		color: '#333',
	},
	profileContainer: {
		marginBottom: 20,
	},
	coverContainer: {
		position: 'relative',
		width: '100%',
		height: 300,
	},
	coverImage: {
		width: '100%',
		height: '100%',
		backgroundColor: '#f0f0f0',
	},
	profileInfo: {
		alignItems: 'center',
		marginTop: -40,
	},
	profileImage: {
		width: 80,
		height: 80,
		borderRadius: 40,
		borderWidth: 3,
		borderColor: 'white',
		backgroundColor: '#fff',
	},
	profileName: {
		fontSize: 20,
		fontWeight: 'bold',
		marginTop: 8,
	},
	profileUsername: {
		fontSize: 14,
		color: '#666',
		marginTop: 4,
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
	backButton: {
		position: 'absolute',
		top: 16,
		left: 16,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1,
	}
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);