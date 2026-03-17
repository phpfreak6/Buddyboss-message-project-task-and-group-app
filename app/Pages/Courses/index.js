import React, { Fragment, useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, RefreshControl, FlatList } from 'react-native';
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

const Courses = (props) => {
	const { navigation } = props;
	const [showLoader, setShowLoader] = useState(false);
	let [searchQuery, setSearchQuery] = useState('');
	const [courses, setCourses] = useState([]);
	const [totalCourses, setTotalCourses] = useState([]);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(11);
	const [hasMore, setHasMore] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [pageLoaded, setLoadPage] = useState(false);
	const [sortBy, setSortBy] = useState('alphabetical'); 
	const [showSortDropdown, setShowSortDropdown] = useState(false);
	const [courseFilter, setCourseFilter] = useState('mycourses'); 
	const [showCourseFilterDropdown, setShowCourseFilterDropdown] = useState(false);


	const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(false);


	const searchTimeout = useRef(null);

	const fetchCourses = async ({ reset = false } = {}) => {
		if (reset) {
			setPage(1);
			setHasMore(true);
			setCourses([]);
		}
		if (!hasMore && !reset) return;

		const currentPage = reset ? 1 : page;

		if (reset) setShowLoader(true);
		else setLoadingMore(true);

		try {
			const response = await agent.Auth.getCourses(currentPage, limit, searchQuery, sortBy,courseFilter);

			//console.log(JSON.stringify(response, null, 2));
			
			const newCourses = response?.data?.users?.courses || [];
			const pagination = response?.data?.users?.pagination || {};
			const totalPages = parseInt(pagination.totalPages) || 1;
			const totalcr = parseInt(pagination.totalCount) || 0;
			
			setTotalCourses(totalcr);

			if (reset) {

				setCourses(newCourses);

			}else{

				setCourses(prev => {
					const updatedCourses = reset ? newCourses : [
					...prev.filter(course => !newCourses.some(newCourse => newCourse.ID === course.ID)),
					...newCourses
					];
					return updatedCourses;
				});

			}
			
			// Avoid duplicates by filtering out courses already in the existing list
			
			
			setPage(currentPage + 1);
			setHasMore(currentPage < totalPages);
			setLoadingMore(false);
		} catch (err) {
		    console.error('Failed to fetch courses:', err);
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
		fetchCourses({ reset: true });
	}, [])

	useEffect(() => {
		if(refreshing){
			fetchCourses({ reset: true });
		}
		
	}, [refreshing])

	

	useEffect(() => {
		if(searchQuery){
			if (searchTimeout.current) {
				clearTimeout(searchTimeout.current);
			}
	
			searchTimeout.current = setTimeout(() => {
				fetchCourses({ reset: true });
			}, 1000); // 3 seconds delay
		}else{
			fetchCourses({ reset: true });
		}
		
	}, [searchQuery])
	
	useFocusEffect(
	React.useCallback(() => {
		setLoadPage(true);
		return () => {
		setLoadPage(false); // Set loading to false when the page leaves
		};
	}, [setLoadPage])
	);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
	}, []);
	useEffect(() => {
		fetchCourses({ reset: true });
	}, [sortBy,courseFilter]);

	const handleLoadMore = () => {
		if (!loadingMore && hasMore) {
			fetchCourses();
		}
	};

	const renderItem = ({ item }) => (
		<CourseCard
			course={item}
			onPress={() => navigation.navigate('singleCourse', { courseId: item.ID, courseTitle: item.post_title })}
		/>
	);

	const keyExtractor = (item, index) => `${item.ID}-${index}`;

	return (
		<ViewLayout noMargin={true} backGroundGrey={false}>
			<View style={styles.container}>

				<View style={styles.searchContainer}>
					<Icon name="magnify" size={20} color="#666" />
					<TextInput 
						style={styles.searchInput}
						placeholder="Search"
						placeholderTextColor="#666"
						value={searchQuery}
						onChangeText={handleSearchChange} 
					/>
				</View>

				<View style={styles.filterContainer}>
					<TouchableOpacity
						style={styles.filterButton}
						onPress={() => {
							setShowCourseFilterDropdown(prev => !prev)
							setShowSortDropdown(false);
						}}
					>
						<Icon name="filter-variant" size={20} color="#333" />
						<Text style={styles.filterText}>
							{courseFilter === 'mycourses' ? 'My Courses' : 'All Courses'}
						</Text>
						<Text style={styles.courseCount}>{totalCourses}</Text>
						<Icon name="chevron-down" size={20} color="#333" />
					</TouchableOpacity>


					<TouchableOpacity
						style={styles.filterButton}
						onPress={() => {
							setShowSortDropdown(prev => !prev)
							setShowCourseFilterDropdown(false);
						}}
					>
						<Text style={styles.filterText}>
						{sortBy === 'alphabetical' ? 'Alphabetical' : 
							sortBy === 'progress' ? 'My Progress' : "Newest"}
						</Text>
						<Icon name="chevron-down" size={20} color="#333" />
					</TouchableOpacity>
				</View>

				{showCourseFilterDropdown && (
					<View style={[styles.dropdown, { top: 110, left: 40 }]}>
						<TouchableOpacity
							onPress={() => {
								setCourseFilter('all');
								setShowCourseFilterDropdown(false);
							}}
						>
							<Text style={styles.dropdownItem}>All Courses</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => {
								setCourseFilter('mycourses');
								setShowCourseFilterDropdown(false);
							}}
						>
							<Text style={styles.dropdownItem}>My Courses</Text>
						</TouchableOpacity>
					</View>
				)}


				{showSortDropdown && (
					<View style={styles.dropdown}>
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
						<TouchableOpacity
							onPress={() => {
								setSortBy('progress');
								setShowSortDropdown(false);
							}}
						>
							<Text style={styles.dropdownItem}>My Progress</Text>
						</TouchableOpacity>
					</View>
				)}

				<FlatList
					data={courses}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					contentContainerStyle={styles.coursesContainer}
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

				<PageLoader visible={showLoader} setVisible={setShowLoader} />
			</View>
		</ViewLayout>
	);
};


const formatDate = (dateString) => {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric"
	});
};

const CourseCard = ({ course, onPress }) => {
	// Check the course progress status
	let courseStatus = "Start Course";
	let progressWidth = "0%"; // Default to 0%
	let progressColor = "#2196F3"; // Default color for "Start Course"
	let badgeColor = "#2196F3"; // Default color for "Start Course badge"
  
	if (course.progress) {
	  if (course.progress.completed === course.progress.total) {
		courseStatus = "Complete";
		progressWidth = "100%";
		progressColor = "#4caf50"; // Green color for "Complete"
		badgeColor = "#4caf50"; // Green badge for "Complete"
	  } else if (course.progress.completed !== course.progress.total) {
		courseStatus = "In Progress";
		// Calculate progress percentage
		progressWidth = `${(course.progress.completed / course.progress.total) * 100}%`;
		progressColor = "#ff9800"; // Orange color for "In Progress"
		badgeColor = "#ff9800"; // Orange badge for "In Progress"
	  }
	}
  
	return (
	  <TouchableOpacity style={styles.courseCard} onPress={onPress}>
		<View style={styles.cardContainer}>
		  <View style={styles.imageSection}>
			<Image
			  source={course.thumbnail ? { uri: course.thumbnail } : require('@/assets/images/cource-placeholder.png')}
			  style={styles.courseImage}
			/>
  
			{/* Course Progress */}
			<View style={[styles.progressBadge, { backgroundColor: badgeColor }]}>
			  <Text style={[styles.progressText, { color: '#fff' }]}>{courseStatus}</Text>
			</View>
			<View style={styles.progressBar}>
			  <View style={[styles.progressFill, { width: progressWidth, backgroundColor: progressColor }]} />
			</View>
		  </View>
  
		  <View style={styles.contentSection}>
			<View style={[styles.courseInfo, { display: 'flex', flexDirection: 'column', justifyContent: "space-between" }]}>
			  <View style={{ display: 'flex', flexDirection: 'column' }}>
				<Text style={styles.courseTitle} numberOfLines={2}>
				  {course.post_title}
				</Text>
				<Text style={styles.courseAuthor}>
				  {course.author_name}
				</Text>
			  </View>
  
			  <Text style={[styles.courseDate, { marginTop: 8 }]}>
				{course.last_activity
				  ? formatDate(course.last_activity)
				  : course.post_date
				  ? formatDate(course.post_date)
				  : null}
			  </Text>
			  {/* <Text style={[styles.courseDate, { marginTop: 8 }]}>
				{course.progress && course.progress.lessons && (
					<Text style={{ color: '#666', fontSize: 12 }}>
						{Object.keys(course.progress.lessons).length} Lessons
					</Text>
				)}
			  </Text> */}
			</View>
		  </View>
		</View>
	  </TouchableOpacity>
	);
};

const styles = StyleSheet.create({
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
	courseCount: {
		backgroundColor: '#f0f0f0',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
		fontSize: 12,
	},
	courseCard: {
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
	courseImage: {
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
	courseInfo: {
		flex: 1,
	},
	courseTitle: {
		fontSize: 15,
		fontWeight: '500',
		color: '#000',
		marginBottom: 4,
	},
	courseAuthor: {
		fontSize: 13,
		color: '#666',
		marginBottom: 2,
	},
	courseDate: {
		fontSize: 12,
		color: '#999',
	},
	progressBadge: {
		position: 'absolute',
		top: 8,
		left: 0,
		backgroundColor: '#6B46C1',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	progressText: {
		color: '#fff',
		fontSize: 11,
		fontWeight: '500',
	},
	progressBar: {
		position: 'absolute',
		bottom: 20,
		left: 10,
		right: 0,
		height: 3,
		backgroundColor: '#E5E5E5',
		width: "80%",
	},
	progressFill: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		backgroundColor: '#F59E0B',
	},
	startButton: {
		backgroundColor: '#007AFF',
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 4,
		alignSelf: 'flex-start',
	},
	startButtonText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '500',
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
	coursesContainer: {
		paddingBottom: 20,
	},
	dropdown: {
		position: 'absolute',
		top: 110,
		right: 16,
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		paddingVertical: 8,
		zIndex: 10,
		width: 150,
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
});

export default connect(mapStateToProps, mapDispatchToProps)(Courses);