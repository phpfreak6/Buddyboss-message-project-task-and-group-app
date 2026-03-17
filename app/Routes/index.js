import { NODE_BACKEND } from '@env';
import React, { useState, useEffect, Fragment } from 'react';
import { connect, useDispatch} from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';

import { createStackNavigator } from '@react-navigation/stack';

import { AppState } from 'react-native'; 

import UnAuthStackScreen from './UnAuthStackScreen';
import agent from '../agent';
import BottomStack from './BottomStack';
import Messages from '../Pages/Messages';
import Settings from '../Pages/Settings';
import NewMessage from '../Pages/Messages/NewMessage';
import ThreadScreen from '../Pages/Messages/ThreadScreen';
import ChangePassword from '../Pages/basics/ChangePassword';
import More from '../Pages/Settings/More';
import Profile from '../Pages/Settings/Profile';
import UserProfile from '../Pages/Settings/Profile/UserProfile';
import CoverPhoto from '../Pages/Settings/Profile/CoverPhoto';
import ProfilePhoto from '../Pages/Settings/Profile/ProfilePhoto';
import singleCourse from '../Pages/Courses/singleCourse';
import CourseStepsStack from './CourseStepsStack';
import PrivacyPolicy from '../Pages/PrivacyPages/PrivacyPolicy';
import TermsOfService from '../Pages/PrivacyPages/TermsOfService';
import EditProfile from '../Pages/Settings/Profile/EditProfile';
import TrainingDashboard from '../Pages/TrainingDashboard';
import CustomMenu from '../Pages/CustomMenu';
import AddMenuItem from '../Pages/CustomMenu/AddMenuItem';
import CreateGroup from '../Pages/Groups/CreateGroup';
import SingleGroup from '../Pages/Groups/SingleGroup';
import GroupMenuStack from './GroupMenuStack';
import CreatePost from '../Pages/Groups/CreatePost';
import CommentScreen from '../Pages/Groups/CommentScreen';
import GroupInfo from '../Pages/Groups/GroupInfo';
import PhotosScreen from '../Pages/Groups/GroupMenu/PhotosScreen';
import Notification from '../Pages/Notification';
import Projects from '../Pages/Projects';
import SingleProject from '../Pages/Projects/SingleProject';
import MyTasks from '../Pages/Projects/MyTasks';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '@/components/Notification/notification';
import { SET_SOCKET } from '../constants';




const Stack = createStackNavigator();

const mapStateToProps = state => ({
	...state,
	currentUser: state.common.currentUser,
	isLoggedIn: state.common.isLoggedIn,
	states: state.common,
});

const mapDispatchToProps = dispatch => ({
	setSocket: (socketConnection) => dispatch({ type: SET_SOCKET, payload: socketConnection })
});

const Routes = (props) => {

	const dispatch = useDispatch();
	

	const { currentUser, token, isLoggedIn, checkLoginValue, loationId, setSocket, states} = props;
	const [isLoading, setIsLoading] = useState(true);
	const [appState, setAppState] = useState(AppState.currentState);
	let firstPage = 'Home';

	
	


	useEffect(() => {
		setIsLoading(false);
	}, [])
	
	if (isLoading) {
		return null;
	}

	return (
		<NavigationContainer ref={navigationRef}>
			{(isLoggedIn) ? (
				<Stack.Navigator screenOptions={{ unmountOnBlur: true }}>
					<Stack.Screen name="BottomStack"  component={BottomStack} initialParams={{ firstScreen: firstPage }} options={{ unmountOnBlur: true, headerShown: false, title:"Back", headerStatusBarHeight: 0 }} />
					<Stack.Screen name="NewMessage" component={NewMessage} options={{ unmountOnBlur: true, headerBackTitleVisible: false, headerTintColor: '#000', headerStatusBarHeight: 0 }} />
					<Stack.Screen name="ThreadScreen" component={ThreadScreen} options={{ unmountOnBlur: true, headerShown: false, headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="ChangePassword" component={ChangePassword} options={{ unmountOnBlur: true, headerShown: true,headerBackTitleVisible: false, headerTintColor: '#000',headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="Settings" component={Settings} options={{ unmountOnBlur: true, headerShown: true, headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="More" component={More} options={{ unmountOnBlur: true, headerShown: true, headerBackTitleVisible: false, headerTintColor: '#000', headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="Notification" component={Notification} options={{ unmountOnBlur: true, headerShown: true, title: "Notifications", headerBackTitleVisible: false, headerTintColor: '#000', headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} options={{ unmountOnBlur: true, headerShown: true, title:"Privacy Policy", headerBackTitleVisible: false, headerTintColor: '#000', headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="TermsOfService" component={TermsOfService} options={{ unmountOnBlur: true, headerShown: true, title:"Terms of Service", headerBackTitleVisible: false,  headerTintColor: '#000', headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="Profile" component={Profile} options={{ unmountOnBlur: true, headerShown: false, headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="UserProfile" component={UserProfile} options={{ unmountOnBlur: true, headerShown: false, headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="CoverPhoto" component={CoverPhoto} options={{ unmountOnBlur: true, headerShown: false, headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="ProfilePhoto" component={ProfilePhoto} options={{ unmountOnBlur: true, headerShown: false, headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="singleCourse" component={singleCourse} options={{ unmountOnBlur: true, headerShown: false, title: "", headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="CourseStepsStack" component={CourseStepsStack} options={{ unmountOnBlur: true, headerShown: false, title: "", headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="EditProfile" component={EditProfile} options={{ unmountOnBlur: true, headerShown: false, title: "", headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="TrainingDashboard" component={TrainingDashboard} options={{ unmountOnBlur: true, headerShown: true, title: "Training Dashboard", headerBackTitleVisible: false, headerTintColor: '#000', headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="CreateGroup" component={CreateGroup} options={{ unmountOnBlur: true, headerShown: false, headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="singleGroup" component={SingleGroup} options={{ title:"", headerShown: false, headerBackTitleVisible: false, headerStatusBarHeight: 0 }} />
					<Stack.Screen name="GroupInfo" component={GroupInfo} options={{ headerShown: true, title: 'About Group', headerBackTitleVisible: false, headerTintColor: '#000', headerStatusBarHeight: 0 }} />
					<Stack.Screen name="GroupMenu" component={GroupMenuStack} options={{ headerShown: false, headerStatusBarHeight: 0 }} />
					<Stack.Screen name="CreatePost" component={CreatePost} options={{ headerShown: false, headerStatusBarHeight: 0 }} />
					<Stack.Screen name="CommentScreen" component={CommentScreen} options={{ headerShown: false, headerStatusBarHeight: 0 }} />
					<Stack.Screen 
						name="CustomMenu" 
						component={CustomMenu} 
						options={({ navigation }) => ({
							headerStatusBarHeight: 0,
							unmountOnBlur: true, 
							headerShown: true, 
							title: "Custom menu", 
							headerBackTitleVisible: false, 
							headerTintColor: '#000',
							headerRight: () => (
								<TouchableOpacity
									onPress={() => navigation.navigate('AddMenuItem')}
									style={{
										marginRight: 15,
										backgroundColor: '#122b46',
										borderRadius: 50,
										padding: 0,
										elevation: 2,
										shadowColor: '#000',
										shadowOffset: { width: 0, height: 2 },
										shadowOpacity: 0.2,
										shadowRadius: 3,
										width: 30,
										height: 30,
										justifyContent: 'center',
										alignItems: 'center'
									}}
								>
									<IconButton
										icon="plus"
										size={22}
										iconColor="#fff"
										style={{
											margin: 0,
											backgroundColor: 'transparent',
										}}
									/>
								</TouchableOpacity>
							),
						})}
					/>
					<Stack.Screen name="AddMenuItem" component={AddMenuItem} options={{ unmountOnBlur: true, headerShown: true, title: "", headerBackTitleVisible: false, headerTintColor: '#000', headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="Projects" component={Projects} options={{ unmountOnBlur: true, headerShown: true, title: "Projects", headerBackTitleVisible: false, headerTintColor: '#000', headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="SingleProject" component={SingleProject} options={{ unmountOnBlur: true, headerShown: true, title: "Project", headerBackTitleVisible: false, headerTintColor: '#000', headerStatusBarHeight: 0 }}/>
					<Stack.Screen name="MyTasks" component={MyTasks} options={{ unmountOnBlur: true, headerShown: true, title: "My Tasks", headerBackTitleVisible: false, headerTintColor: '#000', headerStatusBarHeight: 0 }}/>
				</Stack.Navigator>
			) : (
				<UnAuthStackScreen isLoggedIn={isLoggedIn} />
			)}
		</NavigationContainer>
	)
}

export default connect(mapStateToProps, mapDispatchToProps)(Routes);