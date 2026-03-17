import AsyncStorage from '@react-native-async-storage/async-storage';
import agent from "../agent";
import { APP_LOAD, LOGIN, LOGOUT, REGISTER, OTP_VERIFY } from './../constants';

const emptyStoredValues = async () => {
	AsyncStorage.removeItem("jwt");
	agent.setToken(null);
}

const setStoredValues = async (payload) => {
	let _loginTime = new Date().getTime().toString();

	AsyncStorage.setItem("jwt", payload.token);
	AsyncStorage.setItem("LSLT", _loginTime);
	agent.setToken(payload.token);
}

const authMiddleware = (store) => (next) => (action) => {

	if (action.type === LOGIN || action.type === OTP_VERIFY) {
		if (action && !action.error && action.payload && action.payload.isSuccess) {
			setStoredValues(action.payload.data);
		}
	} 
	else if (action.type === REGISTER) {
		// if (action && action.payload && action.payload.data) {
		// 	setStoredValues(action.payload.data);
		// }
	} else if (action.type === LOGOUT) {
		emptyStoredValues()
	} else if (action.type === APP_LOAD) {
		if (action.error) {
			emptyStoredValues();
		}
		if(action.payload == null) {
		// if(action.payload == null && action.token == "") {
			emptyStoredValues();
		}
	} 

	next(action);
}

export default authMiddleware;