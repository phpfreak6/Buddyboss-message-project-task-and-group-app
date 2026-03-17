import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { View, Text, Pressable, TouchableHighlight } from 'react-native';
import Toast from 'react-native-toast-message';

import { UnauthViewLayout } from '../Layouts';
import { LOGIN, EMPTY_LOGOUT } from '../../constants';
import agent from '../../agent';
import { FormFields } from './components';
import { StatusBar, PageLoader } from '../../components';
import styles from './styles';
import commonstyle from '../styles/commonstyle';


const mapStateToProps = state => ({
	...state,
	loginSuccess: state.common.loginSuccess,
	loginError: state.common.loginError
});

const mapDispatchToProps = dispatch => ({
	login: (data) => dispatch({ type: LOGIN, payload: agent.Auth.login(data) }),
	emptyValues: () => dispatch({ type: EMPTY_LOGOUT })
});

const Login = (props) => {
	const { navigation, login, loginError, loginSuccess, emptyValues } = props;
	const [showStatus, setShowStatus] = useState(false);
	const [disableSubmit, setDisableSubmit] = useState(false);
	const [statusProps, setStatusProps] = useState(null);
	const [loginValues, setLoginValues] = useState(null);

	const signUp = () => {
		navigation.push('Register');
	}

	const handleSubmit = (formData) => {
		setLoginValues(formData);
		setDisableSubmit(true);
		login(formData);
	}

	const skipTrigger = () => {}

	useEffect(() => {
		if (loginError) {

			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: (loginError.error && loginError.error.message) || 'Something went wrong',
				position: 'bottom',
				visibilityTime: 4000,
				autoHide: true,
				topOffset: 60,
				bottomOffset: 40,
				onShow: () => {},
				onHide: () => {},
				onPress: () => {},
			});
			emptyValues();
		}
		setDisableSubmit(false);
	}, [loginSuccess, loginError]);

	let layoutProps = {
		heading: 'Login',
		navigation,
		showBackBtn: false,
	}

	let fieldProps = {
		navigation,
		disableSubmit,
		onSubmit: handleSubmit
	}

	return (
		<UnauthViewLayout {...layoutProps}>
			<View style={styles.container}>
				<FormFields {...fieldProps} />
			</View>
			<PageLoader visible={disableSubmit} setVisible={setDisableSubmit} />
		</UnauthViewLayout>
	)
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);