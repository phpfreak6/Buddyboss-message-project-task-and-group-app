import React, { Fragment, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import { useIsFocused, useRoute } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ViewLayout } from '@/Pages/Layouts';

import { LOGOUT } from '../../../constants';
import agent from '@/agent';
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
				screen: 'Profile',
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

const Profile = ({ navigation, currentUser }) => {
	const [profileData, setProfileData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [followers, setFollowers] = useState(0);
	const [following, setFollowing] = useState(0);
	const route = useRoute();
	const isFocused = useIsFocused();

	console.log(currentUser);

	const fetchUserProfileData = async (userId) => {
		try {
			setLoading(true);
			const Response = await agent.Auth.fetchUserProfileData(userId);
			if (Response && Response.isSuccess && Response.data.profile_data) {
				//console.log(Response.data.profile_data);
				setProfileData(Response.data.profile_data);
			}else{
				setProfileData([]);
			}
			if (Response && Response.isSuccess && Response.data.followers) {
				setFollowers(Response.data.followers);
			}
			if (Response && Response.isSuccess && Response.data.following) {
				setFollowing(Response.data.following);
			}
		} catch (error) {
			console.error('Error fetching profile data:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUserProfileData(currentUser.user.id);
	}, []);

	useEffect(() => {
		if (isFocused) {
			const shouldRefresh = route.params?.refresh;
			if (shouldRefresh) {
				fetchUserProfileData(currentUser.user.id);
			}
		}
	}, [isFocused, route.params]);

	const cleanPhoneNumber = (value) => {
		if (!value) return '';
		
		// Remove all HTML tags and their contents if empty
		let cleaned = value.replace(/<[^>]*>([^<]*)<\/[^>]*>/g, '$1');
		
		// If the result is empty or just whitespace, return empty string
		if (!cleaned.trim()) return '';
		
		// Remove any remaining HTML tags
		cleaned = cleaned.replace(/<[^>]*>/g, '');
		
		return cleaned.trim();
	};

	const renderField = (field, index, fields) => {
		let displayValue = field.value;
		
		// Skip rendering if value is empty or null
		if (!displayValue || displayValue.trim() === '') {
			return null;
		}
		
		// Handle HTML content in phone field
		if (field.type === 'telephone' && field.value.includes('<a href="tel:')) {
			const cleanedPhone = cleanPhoneNumber(field.value);

			displayValue = cleanedPhone;
		}

		return (
			<View key={field.field_id}>
				<View style={styles.fieldRow}>
					<Text style={styles.infoLabel}>{field.name}</Text>
					<Text style={styles.infoValue}>{displayValue}</Text>
				</View>
				{index < fields.length - 1 && <View style={styles.fieldDivider} />}
			</View>
		);
	};

	const renderSection = (section) => {
		// Skip rendering if section is empty
		if (section.empty) {
			return null;
		}

		// Filter out empty fields
		const nonEmptyFields = section.fields.filter(field => field.value && field.value.trim() !== '');

		// Skip rendering if all fields are empty
		if (nonEmptyFields.length === 0) {
			return null;
		}

		return (
			<View style={styles.baseSection} key={section.group_id}>
				<Text style={styles.sectionTitle}>{section.group_name}</Text>
				<View style={styles.groupCard}>
					{nonEmptyFields.map((field, index) => renderField(field, index, nonEmptyFields))}
				</View>
			</View>
		);
	};


	return (
		<ViewLayout noMargin={true}>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
						<Icon name="chevron-left" size={24} color="#000" />
						<Text style={styles.headerText}>
							{currentUser?.user?.display_name 
								? currentUser.user.display_name.length > 10 
									? `${currentUser.user.display_name.substring(0, 10)}...`
									: currentUser.user.display_name
								: ''}
						</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Profile</Text>
					{(currentUser && currentUser.user && currentUser.user.id) && (
						<TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile', { currentUser })}>
							<Text style={styles.editButtonText}>Edit</Text>
						</TouchableOpacity>
					)}
				</View>

				{loading ? (
					<View style={styles.containerInc}>
						<ActivityIndicator size="large" color="#122b46" />
					</View>
				):(
					<ScrollView style={styles.content}>
						<View style={styles.profileSection}>
							<Image 
								source={currentUser?.user?.image 
									? { uri: currentUser.user.image } 
									: require('@/assets/images/icons/dummy-user.png')} 
								style={styles.profileImage} 
							/>
							<Text style={styles.profileName}>{currentUser?.user?.display_name || 'User'}</Text>
							<Text style={styles.username}>@{profileData?.[0]?.fields?.find(f => f.name === 'Nickname')?.value || ''}</Text>
							
							<View style={styles.statsContainer}>
								<View style={styles.statItem}>
									<Text style={styles.statNumber}>{followers}</Text>
									<Text style={styles.statLabel}>Followers</Text>
								</View>
								<View style={styles.statItem}>
									<Text style={styles.statNumber}>{following}</Text>
									<Text style={styles.statLabel}>Following</Text>
								</View>
							</View>
						</View>
						{profileData?.map(renderSection)}
					</ScrollView>
				)}

					
			</View>
		</ViewLayout>
	);
};

const styles = StyleSheet.create({
	containerInc: {
		flex: 1,
		backgroundColor: '#fff',
		padding: 25,
	},
	container: {
		flex: 1,
		backgroundColor: '#f8f8f8',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingTop: 0,
		paddingBottom: 16,
		backgroundColor: '#fff',
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
	},
	backButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	headerText: {
		fontSize: 16,
		marginLeft: 4,
	},
	headerTitle: {
		fontSize: 16,
		fontWeight: '600',
	},
	editButton: {
		backgroundColor: '#E9A23B',
		paddingHorizontal: 16,
		paddingVertical: 6,
		borderRadius: 16,
	},
	editButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '500',
	},
	content: {
		flex: 1,
	},
	profileSection: {
		alignItems: 'center',
		paddingVertical: 24,
	},
	profileImage: {
		width: 100,
		height: 100,
		borderRadius: 50,
		marginBottom: 16,
	},
	profileName: {
		fontSize: 24,
		fontWeight: '600',
		marginBottom: 8,
	},
	username: {
		fontSize: 14,
		color: '#666',
		marginBottom: 16,
	},
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 32,
		marginTop: 8,
	},
	statItem: {
		alignItems: 'center',
	},
	statNumber: {
		fontSize: 16,
		fontWeight: '600',
	},
	statLabel: {
		fontSize: 14,
		color: '#666',
	},
	baseSection: {
		paddingHorizontal: 16,
		paddingTop: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
		marginLeft: 5,
	},
	groupCard: {
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 16,
		borderWidth: 1,
		borderColor: '#eee',
		marginHorizontal: 4,
	},
	fieldRow: {
		paddingVertical: 8,
	},
	fieldDivider: {
		height: 1,
		backgroundColor: '#eee',
		marginVertical: 8,
	},
	infoLabel: {
		fontSize: 14,
		color: '#666',
		marginBottom: 4,
		fontWeight: '500',
	},
	infoValue: {
		fontSize: 16,
		color: '#000',
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
	menuText: {
		fontSize: 16,
		marginLeft: 15,
		flex: 1,
		color: '#333',
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
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);