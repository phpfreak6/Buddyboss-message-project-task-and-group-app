import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { View, Text, TextInput } from 'react-native';

import { UnauthViewLayout } from '../../Layouts';
import { RESET_PASSWORD, EMPTY_RESET } from '../../../constants';
import agent from '../../../agent';
import { StatusBar, PageLoader } from '../../../components';
import { PasswordFields, SuccessModel } from './components';
import styles from './styles';


const mapStateToProps = state => ({
	...state,
	changePasswordValue: state.common.changePasswordValue,
});

const mapDispatchToProps = dispatch => ({
	setChange: (data) => dispatch({ type: RESET_PASSWORD, payload: agent.Auth.reset(data) }),
	emptyValues: () => dispatch({ type: EMPTY_RESET })
});

const ChangePassword = (props) => {
	const { navigation, route, forgot, forgotPassword, emptyValues, setChange, changePasswordValue } = props;
	const [showStatus, setShowStatus] = useState(false);
	const [disableSubmit, setDisableSubmit] = useState(false);
	const [visible, setVisible] = useState(false);
	const [statusProps, setStatusProps] = useState(null);
	const [email, setEmail] = useState('');
	const [otp, setOtp] = useState('');

	const handleSubmit = (formData) => {
		setDisableSubmit(true);
		alert("")
	}

	const clickLogin = () => {
		setVisible(false);
		navigation.navigate('Login');
	}

	useEffect(() => {
		if(route && route.params) {
			let { email = null, otp = null } = route.params;
			if(email) { setEmail(email); }
			if(otp) { setOtp(otp); }
		}
	}, [route])

	useEffect(() => {
		if(changePasswordValue) {
			if(changePasswordValue == 'error') {
				let obj = { message: 'Unable to change password.', error: true, setShowStatus };

				setStatusProps(obj);
				setShowStatus(true);
			} else {
				setVisible(true);
			}

			emptyValues();
		}
		setDisableSubmit(false);
	}, [changePasswordValue]);

	let layoutProps = {
		heading: 'Change Password',
		navigation,
		showBackBtn: true,
		noMargin: false
	}

	let fieldProps = {
		onSubmit: handleSubmit,
		disableSubmit,
		otp, email
	}

	let modelProps = {
		visible, setVisible,
		onPress: clickLogin
	}

	return (
		<UnauthViewLayout {...layoutProps}>
			<View style={styles.container}>
				{showStatus ? <StatusBar {...statusProps} /> : null}
				
				<PasswordFields {...fieldProps} />
			</View>

			<SuccessModel {...modelProps} />
			<PageLoader visible={disableSubmit} setVisible={setDisableSubmit} />
		</UnauthViewLayout>
	)
}

export default connect(mapStateToProps, mapDispatchToProps)(ChangePassword);