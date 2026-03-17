import React, { Fragment, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import { useIsFocused } from "@react-navigation/native";

import { LOGOUT } from '../../constants';
import agent from '../../agent';
import { ViewLayout, VerticalScroll } from '../Layouts';
import { PageLoader, StatusBar } from '../../components';
import { Listing } from './components';

import styles from './styles';

const mapStateToProps = state => ({
	...state,
	currentUser: state.common.currentUser,
});

const mapDispatchToProps = dispatch => ({
	logout: () => dispatch({ type: LOGOUT })
});

const Settings = (props) => {
	const { navigation, logout, currentUser } = props;
	const [location, setLocation] = useState(null);
	const [showLoader, setShowLoader] = useState(false);
	const [showStatus, setShowStatus] = useState(false);
	const [statusProps, setStatusProps] = useState(null);
	const isFocused = useIsFocused();

	const triggerHeaderPress = () => {}
	const logoutFunction  = async () => {
		try {
			setShowLoader(true);
			
			// Call API to save profile data
			const response = await agent.Auth.logout(currentUser.user.id);

		} catch (error) {
			console.error('Error logout:', error);
		} finally {
			logout();
			setShowLoader(false);
		}
	}

	let headerProps = {
		navigation,
		heading: 'Settings',
		onPress: triggerHeaderPress,
		customStyle: styles.header.text,
		cart: false,
		back: false
	}

	return (
		<ViewLayout noMargin={true} {...headerProps}>
			<View style={styles.container}>
				{showStatus ? <StatusBar {...statusProps} /> : null}

				<VerticalScroll>
					<View style={styles.listing.container}>
						<Listing navigation={navigation} logout={logoutFunction} />
					</View>
				</VerticalScroll>

				<PageLoader visible={showLoader} setVisible={setShowLoader} />
			</View>
		</ViewLayout>
	)
}

export default connect(mapStateToProps, mapDispatchToProps)(Settings);