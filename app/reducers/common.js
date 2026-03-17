import {

	APP_LOAD, ASYNC_START, ASYNC_END, LOGIN, LOGOUT, REGISTER, EMPTY_LOGOUT, OTP_VERIFY, RESEND_OTP, CLEAR_OTP,
	RESET, EMPTY_RESET, RESET_OTP, RESEND_RESET_OTP, RESET_PASSWORD, UPDATE_PROFILE, CHANGE_PASSWORD, APP_LOGIN_CHECK,SET_HIDE_BAR, LOAD_PAGE,UNREAD_COUNT_CALLING, SET_SOCKET
} from '../constants';

const initialState = {
  	appName: "Cafe d' Avignon",
  	token: null,
  	appLoaded: false,
  	newRegistration: false,
  	isLoggedIn: false
}

export default (state = initialState, action) => {
	// console.log('*************************************************** '+action.type)

	switch (action.type) {
		case APP_LOAD: {
			return {
				...state,
				appLoaded: true,
				currentUser: action && action.payload && action.payload.isSuccess ? action.payload.data : null,
				isLoggedIn: action && action.payload && action.payload.isSuccess ? true : false
			};
		}
		case LOAD_PAGE: {
			return {
				...state,
				pageLoaded: action.payload,
			};
		}
		case APP_LOGIN_CHECK: {
			return {
				...state,
				isLoggedIn: action.payload
			}
		}
		case SET_HIDE_BAR: {
			var HideBar = false;
			if(action.payload && action.payload.action == true){
				HideBar = true;
			}
			return { ...state, HideBar: HideBar  };
		}
		case ASYNC_START:
	        	return { 
	        		...state,
	        	};
	    	case ASYNC_END:
	        return { 
	        	...state,
	        };
	    	case LOGIN:
	    		console.log(action.payload);
	    		
      		return {
      			...state,
      			loginError: action && action.payload && !action.payload.isSuccess ? action.payload : null,
      			loginSuccess: action && action.payload && action.payload.isSuccess ? 'success' : 'error',
      			currentUser: action && action.payload && action.payload.isSuccess ? action.payload.data : null,
				token: action && action.payload && action.payload.isSuccess && action.payload.data.token ? action.payload.data.token : null,
				isLoggedIn: action && action.payload && action.payload.isSuccess ? true : false
      		}
      	case REGISTER:
      		return {
      			...state,
      			registerStatus: action && action.payload && action.payload.isSuccess ? 'success' : 'error',
      		}
	    	case LOGOUT:
      		return { 
      			...state,
      			token: null,
      			currentUser: null,
      			logoutSuccess: false,
      			isLoggedIn: false
      		};
      	case EMPTY_LOGOUT:
      		return {
      			...state,
      			loginSuccess: null,
      			loginError: null,
      			logoutSuccess: false,
      			registerStatus: null
      		}
      	case RESET_PASSWORD:
      		return {
      			...state,
      			changePasswordValue: action && action.payload && action.payload.success ? 'success' : 'error',
      		}
      	case UPDATE_PROFILE:
                  return {
                        ...state,
                        currentUser: action && action.payload && action.payload.success ? action.payload.data : null,
                        profileStatus: action && action.payload && action.payload.success ? 'success' : 'error',
                  }
        case CHANGE_PASSWORD:
	            return {
	                  ...state,
	                  changePasswordStatus: action && action.payload && action.payload.success ? 'success' : 'error',
	            }	
        case UNREAD_COUNT_CALLING:

	            return {
	                  ...state,
	                  unreadCountCalling: action && action.success == "true" ? true : false,
	            }	
        case SET_SOCKET:
			return { ...state, socket: action.payload };
      	case EMPTY_RESET:
      		return {
      			...state,
      			forgotPassword: null,
      			resetOtp: null,
      			resendReset: null,
      			changePasswordValue: null,
      			profileStatus: null,
                changePasswordStatus: null,
      		}
		default:
      		return state;
	}
}