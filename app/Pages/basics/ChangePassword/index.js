import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';

import { ViewLayout, VerticalScroll } from '../../Layouts';
import { CHANGE_PASSWORD, EMPTY_RESET } from '../../../constants';
import { PageLoader, StatusBar } from '../../../components';
import { FormFields } from './components';
import styles from './styles.js';
import agent from '../../../agent';

const mapStateToProps = state => ({
	...state,
	currentUser: state.common.currentUser,
	changePasswordStatus: state.common.changePasswordStatus,
});

const mapDispatchToProps = dispatch => ({
	changePassword: (data) => dispatch({ type: CHANGE_PASSWORD, payload: agent.User.changePassword(data)}),
	clearData: (data) => dispatch({ type: EMPTY_RESET }),
});

const ChangePassword = (props) => {
	const { navigation, changePassword, currentUser, changePasswordStatus, clearData } = props;
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmNewPassword, setConfirmNewPassword] = useState('');

	const [showLoader, setShowLoader] = useState(false);
	const [showStatus, setShowStatus] = useState(false);
	const [statusProps, setStatusProps] = useState(null);

	const triggerHeaderPress = () => {}

	const hideSpinner = () => {
		setShowLoader(false)
	}

	const onPressBack = () => {
		navigation.navigate('Settings');
	}

	const handleSubmit = (formData) => {
		setShowLoader(true)
		changePassword(formData)
	}

	let headerProps = {
		navigation,
		heading: 'Change Password',
		onPress: triggerHeaderPress,
		customStyle: styles.header.text,
		cart: false,
		backPress: onPressBack
	}
	let fieldProps = {
		navigation,
		onSubmit: handleSubmit,
		currentUser,
		currentPassword, setCurrentPassword,
		newPassword, setNewPassword,
		confirmNewPassword, setConfirmNewPassword
	}
	
	useEffect(() => {
		if(changePasswordStatus) {
			setShowLoader(false);
			let obj = { message: 'Current Password not valid!', setShowStatus };

			if(changePasswordStatus == 'success') {
				obj.success = true;
				obj.message = "Change Password sucessfully.";
				setCurrentPassword("");
				setNewPassword("");
				setConfirmNewPassword("");
			} else {
				obj.error = true;
			}
			clearData();
			setStatusProps(obj);
			setShowStatus(true);
		}
	}, [changePasswordStatus]);

	return (
		<ViewLayout noMargin={true} {...headerProps}>
			<View style={styles.container}>
				{showStatus ? <StatusBar {...statusProps} /> : null}

				<FormFields {...fieldProps} />
				<PageLoader visible={showLoader} setVisible={setShowLoader} />

			</View>
		</ViewLayout>
	)
}

export default connect(mapStateToProps, mapDispatchToProps)(ChangePassword);