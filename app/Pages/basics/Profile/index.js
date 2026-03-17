import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';

import { ViewLayout, VerticalScroll } from '../../Layouts';
import { UPDATE_PROFILE, EMPTY_RESET } from '../../../constants';
import { PageLoader, StatusBar } from '../../../components';
import { FormFields } from './components';
import styles from './styles.js';
import agent from '../../../agent';

const mapStateToProps = state => ({
	...state,
	currentUser: state.common.currentUser,
	profileStatus: state.common.profileStatus,
});

const mapDispatchToProps = dispatch => ({
	updateProfile: (data) => dispatch({ type: UPDATE_PROFILE, payload: agent.User.update(data) }),
	clearData: (data) => dispatch({ type: EMPTY_RESET }),
});

const Profile = (props) => {
	const { navigation, updateProfile, currentUser, profileStatus, clearData } = props;
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
		updateProfile(formData)
	}

	let headerProps = {
		navigation,
		heading: 'Profile',
		onPress: triggerHeaderPress,
		customStyle: styles.header.text,
		cart: false,
		backPress: onPressBack
	}
	let fieldProps = {
		navigation,
		onSubmit: handleSubmit,
		currentUser
	}
	useEffect(() => {
		if(profileStatus) {
			setShowLoader(false);
			let obj = { message: 'Unable to update profile,', setShowStatus };

			if(profileStatus == 'success') {
				obj.success = true;
				obj.message = "Profile Updated sucessfully.";
			} else {
				obj.error = true;
			}
			clearData();
			setStatusProps(obj);
			setShowStatus(true);
		}
	}, [profileStatus]);

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

export default connect(mapStateToProps, mapDispatchToProps)(Profile);