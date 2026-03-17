import React, { Fragment, useEffect, useState } from 'react';
import { StatusBar, View, Text, Dimensions,Alert,AppState } from 'react-native';
import { connect, useDispatch } from 'react-redux';
import SplashScreen from  "react-native-splash-screen";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import NetInfo from '@react-native-community/netinfo';



import { connectSocket, disconnectSocket } from './components/socketActions';

import { NotificationModule,setupNotificationListeners, navigationRef } from '@/components/Notification/notification';


import { SET_SOCKET } from './constants';




import { APP_LOAD, CART, APP_LOGIN_CHECK } from './constants';
import agent from './agent';
import RoutesList from './Routes';



const mapStateToProps = state => ({
	...state,
	currentUser: state.common.currentUser,
	isLoggedIn: state.common.isLoggedIn,
	appLoaded: state.common.appLoaded,
	states: state.common,
});

const mapDispatchToProps = dispatch => ({
	onLoad: (payload, token) => dispatch({ type: APP_LOAD, payload, token, skipTracking: true }),
	listCart: (data) => dispatch({ type: CART, payload: agent.Cart.list(data) }),
	checkLogin: (data) => dispatch({ type: APP_LOGIN_CHECK, payload: data }),
});


const App = (props) => {

	const dispatch = useDispatch();



	const [isConnected, setIsConnected] = useState(true);
	
	const { onLoad, listCart, currentUser, isLoggedIn, checkLogin, appLoaded, states } = props;
	const [loationId, setLocationId] = useState(null);
	const [isToken, setIsToken] = useState(null);
	const [checkLoginValue, setCheckLoginValue] = useState(false)
	const [appState, setAppState] = useState(AppState.currentState);
	const [fcmToken, setFcmToken] = useState(null);

	useEffect(() => {
		SplashScreen.hide();
	  }, []);



	useEffect(() => {
		  let wasDisconnected = false;

		  const checkInitialConnection = async () => {
		    const state = await NetInfo.fetch();
		    setIsConnected(state.isConnected);
		    wasDisconnected = !state.isInternetReachable;
		  };

		  checkInitialConnection();

		  const unsubscribe = NetInfo.addEventListener(state => {
		    setIsConnected(state.isConnected);

		    if (!state.isInternetReachable) {
		      wasDisconnected = true;

		    //   Toast.show({
		    //     type: 'error',
		    //     text1: 'Error',
		    //     text2: 'No Internet Connection',
		    //     position: 'top',
		    //     visibilityTime: 4000,
		    //     autoHide: true,
		    //     topOffset: 60,
		    //   });

		    } else if (wasDisconnected && state.isInternetReachable) {
		      wasDisconnected = false;
		    }
		  });

	    return () => unsubscribe();
	 }, []);

	 useEffect(() => {
		const waitForNavigationReady = async () => {
		  // Poll until NavigationContainer is ready
		  while (!navigationRef.isReady()) {
			await new Promise(resolve => setTimeout(resolve, 100));
		  }
	  
		  // Now safe to initialize notification listeners
		  setupNotificationListeners(currentUser);
		};
	  
		waitForNavigationReady();
	}, [currentUser]);

	useEffect(() => {
    // Check connection once on component mount
    const checkConnection = async () => {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected);
    };

    checkConnection();

    // Set up listener for ongoing connection changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe(); // Clean up on unmount
  }, []);

	useEffect(() => {
	  if (!currentUser) return; 

	  let subscription;

	  const connect = async () => {
		

	    await dispatch(connectSocket(states));
	    // Subscribe to app state changes
	    subscription = AppState.addEventListener('change', handleAppStateChange);
	  };

	  connect();

	  return () => {
	    // Cleanup on unmount or user change
	    dispatch(disconnectSocket());
	    subscription?.remove();
	  };
	}, [dispatch,  currentUser]);



	const handleAppStateChange = (nextAppState) => {
		if (nextAppState.match(/inactive|background/)) {
			dispatch(disconnectSocket());
		}

		if (nextAppState === 'active') {
			dispatch(connectSocket(states));
		}

		setAppState(nextAppState);
	};

	const getCurrentUser = async (token) => {
		
	

		
		await agent.setToken(token);

		var payload = await agent.Auth.current();


		if(payload && payload.failed == true && payload.error && payload.error.message){

			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: payload.error.message || 'Something went wrong',
				position: 'bottom',
				visibilityTime: 4000,
				autoHide: true,
				topOffset: 60,
				bottomOffset: 40,
				onShow: () => {},
				onHide: () => {},
				onPress: () => {},
			});
			onLoad(payload, token);

		}else if(payload && payload.data && payload.data.user){
           onLoad(payload, token);
		}else{

			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Something went wrong with network',
				position: 'bottom',
				visibilityTime: 4000,
				autoHide: true,
				topOffset: 60,
				bottomOffset: 40,
				onShow: () => {},
				onHide: () => {},
				onPress: () => {},
			});
			onLoad(payload, token);

		}

	}


	const getJwtData = async () => {
		let token = await AsyncStorage.getItem('jwt'), _valid = false;

		if(token) {

			_valid = true;
			setIsToken(token);
			getCurrentUser(token);
	    }else{
			onLoad(null, "");
		}

	    await checkLogin(_valid);

	}
	useEffect(() => {
	    // Set StatusBar color for this screen
	    StatusBar.setBarStyle('dark-content');
	    StatusBar.setBackgroundColor('#00000000');
	    
	    return () => {
	      // Reset StatusBar when leaving screen
	      StatusBar.setBarStyle('light-content');
	      StatusBar.setBackgroundColor('#00000000');
	    };
	}, []);


	useEffect(() => {
		NotificationModule(setFcmToken);
		// SplashScreen.hide();
	}, [])

	useEffect(() => {
		if(loationId) {
			listCart({ location_id: loationId });
		}
	}, [loationId])
	useEffect(() => {
		if(currentUser) {
			NotificationModule(setFcmToken, currentUser);
		}
	}, [currentUser])

	useEffect(() => {
		if(typeof isLoggedIn != 'undefined') {
			setCheckLoginValue(isLoggedIn);
		}
	}, [isLoggedIn]);

	useEffect(() => {
		getJwtData();
	}, []);

	let routeProps = {
		loationId,
		token: isToken,
		checkLoginValue
	}
	const toastConfig = {
		error: (props) => (
		  <View style={{
			minHeight: 60,
			width: Dimensions.get('window').width - 40, // Leave 20px padding on each side
			backgroundColor: '#FF3B30',
			padding: 15,
			borderRadius: 8,
			justifyContent: 'flex-start',
			marginHorizontal: 20,
		  }}>
			<Text style={{
			  fontSize: 16,
			  color: '#FFFFFF',
			  fontWeight: 'bold',
			  marginBottom: 5,
			}}>
			  {props.text1}
			</Text>
			<Text style={{
			  fontSize: 14,
			  color: '#FFFFFF',
			  flexWrap: 'wrap',
			  lineHeight: 20,
			}}>
			  {props.text2}
			</Text>
		  </View>
		),
		success: (props) => (
		  <View style={{
			minHeight: 60,
			width: Dimensions.get('window').width - 40, // Leave 20px padding on each side
			backgroundColor: '#008000',
			padding: 15,
			borderRadius: 8,
			justifyContent: 'flex-start',
			marginHorizontal: 20,
		  }}>
			<Text style={{
			  fontSize: 16,
			  color: '#FFFFFF',
			  fontWeight: 'bold',
			  marginBottom: 5,
			}}>
			  {props.text1}
			</Text>
			<Text style={{
			  fontSize: 14,
			  color: '#FFFFFF',
			  flexWrap: 'wrap',
			  lineHeight: 20,
			}}>
			  {props.text2}
			</Text>
		  </View>
		)
	};

	return (
		<Fragment>
		    {(appLoaded)&&(
		    	<Fragment>
					<RoutesList {...routeProps} />
				</Fragment>
			)}
			<Toast config={toastConfig} />
		</Fragment>
	)
}

export default connect(mapStateToProps, mapDispatchToProps)(App);