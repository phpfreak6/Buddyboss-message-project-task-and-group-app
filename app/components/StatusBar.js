import React, { useEffect, Fragment } from 'react';
import { View, Text, Image, Pressable } from 'react-native';

import { SuccessIco , ErrorIco, WarnIco, SuccCloseIco, WarnCloseIco, ErrCloseIco } from '../assets/images';

import styles from './styles';

const StatusBar = (props) => {
	const { message, success = false, error = false, warning = false, setShowStatus } = props;

	const closeStatusBar = () => {
		setShowStatus(false);
	}

	const triggerFunction = () => {
		setTimeout(function() {
			closeStatusBar()
		}, 5000)
	}

	useEffect(() => {
		triggerFunction();
	}, [])

	return (
		<Fragment>
		{/*<View 
			style={[
				styles.flexDiv, styles.statusBar.main,
				(success) ? styles.statusBar.success.main : '',
				(error) ? styles.statusBar.error.main : '',
				(warning) ? styles.statusBar.warning.main : ''
			]}
		>
			<View style={[styles.flexDiv, styles.statusBar.content]}>
				<View style={styles.statusBar.image.main}>
					{(success) ? <Image source={SuccessIco} alt="" style={styles.statusBar.image.icon} /> : null}
					{(error) ? <Image source={ErrorIco} alt="" style={styles.statusBar.image.icon} /> : null}
					{(warning) ? <Image source={WarnIco} alt="" style={styles.statusBar.image.icon} /> : null}
				</View>

				<Text
					style={[
						styles.statusBar.text,
						(success) ? styles.statusBar.success.text : '',
						(error) ? styles.statusBar.error.text : '',
						(warning) ? styles.statusBar.warning.text : ''
					]}
				>
					{ message }
				</Text>
			</View>

			<Pressable onPress={closeStatusBar} style={[styles.autoLeft, styles.statusBar.closeIcon.main]}>
				{(success) ? <Image source={SuccCloseIco} alt="" style={styles.statusBar.closeIcon.image} /> : null}
				{(error) ? <Image source={ErrCloseIco} alt="" style={styles.statusBar.closeIcon.image} /> : null}
				{(warning) ? <Image source={WarnCloseIco} alt="" style={styles.statusBar.closeIcon.image} /> : null}
			</Pressable>
		</View>*/}
		</Fragment>
	)
}

export default StatusBar;