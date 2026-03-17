import React, { Fragment } from 'react';
import { View, Text, Image, Pressable } from 'react-native';

import styles from './styles';
import { BackSmallIco, SkipIco } from '../assets/images';

const HeaderView = (props) => {
	const { navigation, subHeading, heading, customStyle, showBackBtn = false, isSkip = false, pressSkip = null } = props;

	const backFunction = () => {
		navigation.goBack();
	}

	const skipFunction = () => {
		if(pressSkip) {
			pressSkip();
		}
	}

	return (
		<View style={styles.header.container}>
			<View style={[styles.flexDiv, styles.header.main, styles.unAuthHeader.main]}>
				{(showBackBtn) ?
					<Pressable style={styles.header.back.main} onPress={backFunction}>
						<Image source={BackSmallIco} alt='' style={styles.header.back.icon} />
					</Pressable>
				: null }

				<View
					style={[
						styles.header.heading.main,
						(!showBackBtn || !isSkip) ? styles.header.w90 : '',
						(!showBackBtn && !isSkip) ? styles.header.w100 : '',
					]}
				>
					<Text style={[styles.header.heading.content.text.name, styles.unAuthHeader.heading]}>{ heading }</Text>
				</View>

				{(isSkip) ?
					<Pressable style={[
						styles.autoLeft, styles.flexDiv, styles.header.cart.main, styles.unAuthHeader.skip
					]} onPress={skipFunction}>
						<Text style={styles.unAuthHeader.skip.text}>Skip</Text>
						<Image source={SkipIco} alt='' style={styles.unAuthHeader.skip.icon} />
					</Pressable>
				: null }
			</View>
		</View>
	)
}

export default HeaderView;