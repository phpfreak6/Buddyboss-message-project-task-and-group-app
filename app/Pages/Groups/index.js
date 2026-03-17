import React, { Fragment, useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, RefreshControl, FlatList, SafeAreaView, Alert } from 'react-native';
import { connect } from 'react-redux';
import { useIsFocused } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native'; 

import { LOGOUT } from '@/constants';
import agent from '@/agent';
import { ViewLayout, VerticalScroll } from '@/Pages/Layouts';
import { PageLoader } from '@/components';

const mapStateToProps = state => ({
	...state,
	currentUser: state.common.currentUser,
});

const mapDispatchToProps = dispatch => ({
	logout: () => dispatch({ type: LOGOUT })
});

const SectionTitle = ({ title }) => (
	<Text style={styles.sectionTitle}>{title}</Text>
);

const Groups = (props) => {
	const { navigation } = props;
	const [showLoader, setShowLoader] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	let [searchQuery, setSearchQuery] = useState('');
	const [groups, setGroups] = useState([]);
	const [totalGroups, setTotalGroups] = useState(0);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(11);
	const [hasMore, setHasMore] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [pageLoaded, setLoadPage] = useState(false);
	const [sortBy, setSortBy] = useState('last_activity'); 
	const [showSortDropdown, setShowSortDropdown] = useState(false);
	const [groupFilter, setGroupFilter] = useState('mygroups');
	const [showGroupFilterDropdown, setShowGroupFilterDropdown] = useState(false);
	const [pendingGroups, setPendingGroups] = useState([]);

	const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(false);
	const searchTimeout = useRef(null);

	const fetchGroups = async ({ reset = false } = {}) => {
		if (reset) {
			setPage(1);
			setHasMore(true);
			setGroups([]);
		}
		if (!hasMore && !reset) return;

		const currentPage = reset ? 1 : page;

		if (reset) setShowLoader(true);
		else setLoadingMore(true);

		try {
			const response = await agent.Groups.getGroups(currentPage, limit, searchQuery, sortBy, groupFilter);

			//console.log(JSON.stringify(response,null,2));
			
			const newGroups = response?.data?.groups || [];
			const pagination = response?.data?.pagination || {};
			const totalPages = parseInt(pagination.totalPages) || 1;
			const total = parseInt(pagination.totalCount) || 0;
			
			setTotalGroups(total);

			if (reset) {
				setGroups(newGroups);
			} else {
				setGroups(prev => {
					const updatedGroups = reset ? newGroups : [
						...prev.filter(group => !newGroups.some(newGroup => newGroup.id === group.id)),
						...newGroups
					];
					return updatedGroups;
				});
			}
			
			setPage(currentPage + 1);
			setHasMore(currentPage < totalPages);
			setLoadingMore(false);
		} catch (err) {
			console.error('Failed to fetch groups:', err);
		} finally {
			setShowLoader(false);
			setLoadingMore(false);
			setRefreshing(false);
		}
	};

	const handleSearchChange = (text) => {
		setSearchQuery(text);
	};

	useEffect(() => {
		fetchGroups({ reset: true });
	}, []);

	useEffect(() => {
		if(refreshing) {
			fetchGroups({ reset: true });
		}
	}, [refreshing]);

	useEffect(() => {
		if(searchQuery) {
			if (searchTimeout.current) {
				clearTimeout(searchTimeout.current);
			}
	
			searchTimeout.current = setTimeout(() => {
				fetchGroups({ reset: true });
			}, 1000);
		} else {
			//fetchGroups({ reset: true });
		}
	}, [searchQuery]);
	
	useFocusEffect(
		React.useCallback(() => {
			setLoadPage(true);
			fetchGroups({ reset: true });
			return () => {
				setLoadPage(false);
			};
		}, [])
	);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
	}, []);

	const onRefreshPending = useCallback(() => {
		setRefreshing(true);
		fetchPendingGroups();
	}, []);

	useEffect(() => {
		fetchGroups({ reset: true });
	}, [sortBy, groupFilter]);

	const handleLoadMore = () => {
		if (!loadingMore && hasMore) {
			fetchGroups();
		}
	};

	const handleAcceptGroup = async (groupId) => {
		Alert.alert(
			"Accept Group",
			"Are you sure you want to accept this group invitation?",
			[
				{
					text: "Cancel",
					style: "cancel"
				},
				{
					text: "Accept",
					onPress: async () => {
						try {
							setActionLoading(true);
							const response = await agent.Groups.acceptGroup(groupId);
							console.log(JSON.stringify(response,null,2));
							if (response?.data?.group_id) {
								// Remove the accepted group from pending groups
								setPendingGroups(prev => prev.filter(group => group.group_id !== groupId));
								// Refresh the groups list
								fetchGroups({ reset: true });
							} else {
								Alert.alert("Error", "Invalid response from server. Please try again.");
							}
						} catch (err) {
							console.error('Failed to accept group:', err);
							Alert.alert("Error", "Failed to accept group invitation. Please try again.");
						} finally {
							setActionLoading(false);
						}
					}
				}
			]
		);
	};

	const handleRejectGroup = async (groupId) => {
		Alert.alert(
			"Reject Group",
			"Are you sure you want to reject this group invitation?",
			[
				{
					text: "Cancel",
					style: "cancel"
				},
				{
					text: "Reject",
					style: "destructive",
					onPress: async () => {
						try {
							setActionLoading(true);
							const response = await agent.Groups.rejectGroup(groupId);
							console.log(JSON.stringify(response,null,2));
							if (response?.data?.group_id) {
								// Remove the rejected group from pending groups
								setPendingGroups(prev => prev.filter(group => group.group_id !== groupId));
							} else {
								Alert.alert("Error", "Invalid response from server. Please try again.");
							}
						} catch (err) {
							console.error('Failed to reject group:', err);
							Alert.alert("Error", "Failed to reject group invitation. Please try again.");
						} finally {
							setActionLoading(false);
						}
					}
				}
			]
		);
	};

	const renderItem = ({ item }) => (
		<GroupCard
			group={item}
			onPress={() => navigation.navigate('singleGroup', { groupId: item.id, groupTitle: item.name })}
		/>
	);

	const keyExtractor = (item, index) => `${item.id}-${index}`;

	const fetchPendingGroups = async () => {
		try {
			const response = await agent.Groups.getPendingGroups();
			setPendingGroups(response?.data || []);
		} catch (err) {
			console.error('Failed to fetch pending groups:', err);
		}
	};

	useEffect(() => {
		if (groupFilter === 'pending') {
			fetchPendingGroups();
		}
	}, [groupFilter]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<ViewLayout noMargin={true} backGroundGrey={false}>
				<View style={styles.container}>
					<View style={styles.headerContainer}>
						<Text style={styles.headerTitle}>Groups</Text>
						<TouchableOpacity 
							style={styles.addButton}
							onPress={() => navigation.navigate('CreateGroup')}
						>
							<Icon name="plus" size={24} color="#fff" />
						</TouchableOpacity>
					</View>

					{groupFilter !== 'pending' && (
						<View style={styles.searchContainer}>
							<Icon name="magnify" size={20} color="#666" />
							<TextInput 
								style={styles.searchInput}
								placeholder="Search groups"
								placeholderTextColor="#666"
								value={searchQuery}
								onChangeText={handleSearchChange} 
							/>
						</View>
					)}

					<View style={styles.filterContainer}>
						<TouchableOpacity
							style={styles.filterButton}
							onPress={() => {
								setShowGroupFilterDropdown(prev => !prev);
								setShowSortDropdown(false);
							}}
						>
							<Icon name="filter-variant" size={20} color="#333" />
							<Text style={styles.filterText}>
								{groupFilter === 'mygroups' ? 'My Groups' : 'Invitations'}
							</Text>
							{groupFilter === 'mygroups' && (
								<Text style={styles.groupCount}>{totalGroups}</Text>
							)}
							<Icon name="chevron-down" size={20} color="#333" />
						</TouchableOpacity>

						{groupFilter !== 'pending' && (
							<TouchableOpacity
								style={styles.filterButton}
								onPress={() => {
									setShowSortDropdown(prev => !prev)
									setShowGroupFilterDropdown(false);
								}}
							>
								<Text style={styles.filterText}>
									{sortBy === 'alphabetical' ? 'Alphabetical' : 
										sortBy === 'last_activity' ? 'Recently Active' : "Newest"}
								</Text>
								<Icon name="chevron-down" size={20} color="#333" />
							</TouchableOpacity>
						)}
					</View>

					{showGroupFilterDropdown && (
						<View style={[styles.dropdown, { top: 165, left: 16 }]}>
							<TouchableOpacity
								onPress={() => {
									setGroupFilter('mygroups');
									setShowGroupFilterDropdown(false);
								}}
							>
								<Text style={[
									styles.dropdownItem,
									groupFilter === 'mygroups' && styles.selectedDropdownItem
								]}>My Groups</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => {
									setGroupFilter('pending');
									setShowGroupFilterDropdown(false);
								}}
							>
								<Text style={[
									styles.dropdownItem,
									groupFilter === 'pending' && styles.selectedDropdownItem
								]}>Invitations</Text>
							</TouchableOpacity>
						</View>
					)}

					{showSortDropdown && (
						<View style={styles.dropdown}>
							<TouchableOpacity
								onPress={() => {
									setSortBy('last_activity');
									setShowSortDropdown(false);
								}}
							>
								<Text style={styles.dropdownItem}>Recently Active</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => {
									setSortBy('alphabetical');
									setShowSortDropdown(false);
								}}
							>
								<Text style={styles.dropdownItem}>Alphabetical</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => {
									setSortBy('newest');
									setShowSortDropdown(false);
								}}
							>
								<Text style={styles.dropdownItem}>Newest</Text>
							</TouchableOpacity>
						</View>
					)}

					{groupFilter === 'pending' ? (
						<FlatList
							data={pendingGroups}
							renderItem={({ item }) => (
								<PendingGroupCard
									group={item}
									onAccept={handleAcceptGroup}
									onReject={handleRejectGroup}
								/>
							)}
							keyExtractor={keyExtractor}
							contentContainerStyle={styles.groupsContainer}
							refreshControl={
								<RefreshControl
									refreshing={refreshing}
									onRefresh={onRefreshPending}
									colors={['#6B46C1']}
								/>
							}
							ListEmptyComponent={() => (
								<View style={styles.emptyContainer}>
									<Icon name="account-group" size={60} color="#ccc" />
									<Text style={styles.emptyText}>No invitations yet</Text>
									<Text style={styles.emptySubText}>When someone invites you to a group, it will appear here</Text>
								</View>
							)}
							showsVerticalScrollIndicator={false}
						/>
					) : (
						<FlatList
							data={groups}
							renderItem={renderItem}
							keyExtractor={keyExtractor}
							contentContainerStyle={styles.groupsContainer}
							refreshControl={
								<RefreshControl
									refreshing={refreshing}
									onRefresh={onRefresh}
									colors={['#6B46C1']}
								/>
							}
							onEndReached={() => {
								if (!onEndReachedCalledDuringMomentum && hasMore && !loadingMore) {
									handleLoadMore();
									setOnEndReachedCalledDuringMomentum(true);
								}
							}}
							onMomentumScrollBegin={() => {
								setOnEndReachedCalledDuringMomentum(false);
							}}
							onEndReachedThreshold={0.1}
							ListFooterComponent={
								loadingMore && <Text style={{ textAlign: 'center', padding: 10 }}>Loading more...</Text>
							}
							showsVerticalScrollIndicator={false}
						/>
					)}

					<PageLoader visible={showLoader || actionLoading} setVisible={setShowLoader} />
				</View>
			</ViewLayout>
		</SafeAreaView>
	);
};

const timeAgo = (dateString) => {
	// Convert the input date string to UTC
	const date = new Date(dateString + 'Z'); // Adding 'Z' to ensure UTC interpretation
	const now = new Date();
	
	// Get UTC timestamps
	const utcDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 
		date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
	const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 
		now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
	
	// Calculate difference in seconds
	const seconds = Math.floor((utcNow - utcDate) / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	if (seconds < 60) {
		return 'Active just now';
	} else if (minutes < 60) {
		return `Active ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
	} else if (hours < 24) {
		return `Active ${hours} hour${hours === 1 ? '' : 's'} ago`;
	} else if (days < 7) {
		return `Active ${days} day${days === 1 ? '' : 's'} ago`;
	} else if (weeks < 4) {
		return `Active ${weeks} week${weeks === 1 ? '' : 's'} ago`;
	} else if (months < 12) {
		return `Active ${months} month${months === 1 ? '' : 's'} ago`;
	} else {
		return `Active ${years} year${years === 1 ? '' : 's'} ago`;
	}
};

const GroupCard = ({ group, onPress }) => {
	return (
		<TouchableOpacity style={styles.groupCard} onPress={onPress}>
			<View style={styles.cardContainer}>
				<View style={styles.imageSection}>
					{group.image ? (
						<Image
							source={{ uri: group.image }}
							style={styles.groupImage}
						/>
					) : (
						<View style={[styles.groupImage, styles.iconContainer]}>
							<Icon name="account-group" size={80} color="#122b46" />
						</View>
					)}
					<View style={[styles.memberBadge, { backgroundColor: group.is_admin ? '#4CAF50' : '#6B46C1' }]}>
						<Text style={[styles.memberText, { color: '#fff' }]}>
							{group.is_admin ? 'Organizer' : 'Member'}
						</Text>
					</View>
				</View>

				<View style={styles.contentSection}>
					<View style={[styles.groupInfo, { display: 'flex', flexDirection: 'column', justifyContent: "space-between" }]}>
						<View style={{ display: 'flex', flexDirection: 'column' }}>
							<Text style={styles.groupTitle} numberOfLines={2}>
								{group.name}
							</Text>
							<Text style={styles.groupDescription} numberOfLines={1}>
								{group.status ? `${group.status.charAt(0).toUpperCase() + group.status.slice(1)}` : ''} / Group - {group.metadata?.total_member_count || 0} members
							</Text>
						</View>

						<Text style={[styles.groupDate, { marginTop: 8 }]}>
							{group.metadata?.last_activity ? timeAgo(group.metadata.last_activity) : null}
						</Text>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
};

const PendingGroupCard = ({ group, onAccept, onReject }) => {
	return (
		<View style={styles.pendingGroupCard}>
			<View style={styles.cardContainer}>
				<View style={styles.imageSection}>
					{group.image ? (
						<Image
							source={{ uri: group.image }}
							style={styles.groupImage}
						/>
					) : (
						<View style={[styles.groupImage, styles.iconContainer]}>
							<Icon name="account-group" size={80} color="#122b46" />
						</View>
					)}
				</View>

				<View style={styles.contentSection}>
					<View style={[styles.groupInfo, { display: 'flex', flexDirection: 'column', justifyContent: "space-between" }]}>
						<View style={{ display: 'flex', flexDirection: 'column' }}>
							<Text style={styles.groupTitle} numberOfLines={1} ellipsizeMode="tail">
								{group.name}
							</Text>
							<Text style={styles.groupDescription} numberOfLines={1}>
								{group.status ? `${group.status.charAt(0).toUpperCase() + group.status.slice(1)}` : ''} / Group - {group.metadata?.total_member_count || 0} members
							</Text>
							<Text style={styles.inviterText} numberOfLines={1} ellipsizeMode="tail">
								Invited by: {group.inviter_name}
							</Text>
						</View>

						<View style={styles.actionButtons}>
							<TouchableOpacity 
								style={[styles.actionButton, styles.acceptButton]}
								onPress={() => onAccept(group.group_id)}
							>
								<Text style={styles.actionButtonText}>Accept</Text>
							</TouchableOpacity>
							<TouchableOpacity 
								style={[styles.actionButton, styles.rejectButton]}
								onPress={() => onReject(group.group_id)}
							>
								<Text style={styles.actionButtonText}>Reject</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#fff',
	},
	container: {
		flex: 1,
		padding: 16,
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
		backgroundColor: '#e6e6e66e',
		borderRadius: 8,
		paddingHorizontal: 12,
		marginBottom: 16,
	},
	searchInput: {
		flex: 1,
		height: 40,
		marginLeft: 8,
	},
	filterContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E5E5',
		paddingBottom: 10,
	},
	filterButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		padding: 8,
		borderRadius: 20,
	},
	filterText: {
		marginHorizontal: 8,
		fontSize: 14,
		color: '#333',
	},
	groupCount: {
		backgroundColor: '#f0f0f0',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
		fontSize: 12,
	},
	groupCard: {
		backgroundColor: '#fff',
		borderRadius: 8,
		marginBottom: 7,
		paddingBottom: 25,
		overflow: 'hidden',
		borderBottomWidth: 1,
		borderBottomColor: '#E5E5E5',
	},
	cardContainer: {
		flexDirection: 'row',
		height: 100,
		padding: 10
	},
	imageSection: {
		width: 100,
		height: 100,
		position: 'relative',
	},
	groupImage: {
		width: 100,
		height: 100,
		backgroundColor: '#F0F0F0',
		borderRadius: 8,
	},
	contentSection: {
		flex: 1,
		padding: 12,
		justifyContent: 'space-between',
	},
	groupInfo: {
		flex: 1,
	},
	groupTitle: {
		fontSize: 15,
		fontWeight: '500',
		color: '#000',
		marginBottom: 4,
	},
	groupDescription: {
		fontSize: 13,
		color: '#666',
		marginBottom: 2,
	},
	groupDate: {
		fontSize: 12,
		color: '#999',
	},
	memberBadge: {
		position: 'absolute',
		top: 8,
		left: 0,
		backgroundColor: '#6B46C1',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	memberText: {
		color: '#fff',
		fontSize: 11,
		fontWeight: '500',
	},
	groupsContainer: {
		paddingBottom: 20,
	},
	dropdown: {
		position: 'absolute',
		top: 165,
		right: 20,
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		paddingVertical: 8,
		zIndex: 10,
		width: 200,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	dropdownItem: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		fontSize: 14,
		color: '#333',
	},
	selectedDropdownItem: {
		backgroundColor: '#f0f0f0',
		color: '#6B46C1',
		fontWeight: '500',
	},
	addButton: {
		width: 40,
		height: 40,
		backgroundColor: '#122b46',
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	headerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#1a1a1a',
	},
	iconContainer: {
		backgroundColor: '#f0f0f0',
		justifyContent: 'center',
		alignItems: 'center',
	},
	pendingGroupCard: {
		backgroundColor: '#fff',
		borderRadius: 8,
		marginBottom: 7,
		paddingBottom: 25,
		overflow: 'hidden',
		borderBottomWidth: 1,
		borderBottomColor: '#E5E5E5',
	},
	actionButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 8,
	},
	actionButton: {
		flex: 1,
		padding: 8,
		borderRadius: 4,
		marginHorizontal: 4,
		alignItems: 'center',
	},
	acceptButton: {
		backgroundColor: '#4CAF50',
	},
	rejectButton: {
		backgroundColor: '#f44336',
	},
	actionButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '500',
	},
	inviterText: {
		fontSize: 12,
		color: '#666',
		marginTop: 4,
		fontStyle: 'italic',
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 100,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: '500',
		color: '#666',
		marginTop: 16,
	},
	emptySubText: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
		marginTop: 8,
		paddingHorizontal: 32,
	},
});

export default connect(mapStateToProps, mapDispatchToProps)(Groups);