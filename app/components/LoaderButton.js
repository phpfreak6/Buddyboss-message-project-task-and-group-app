import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';

import { ButtonLoaderIco } from '../assets/images';
import styles from './styles';

const LoaderButton = (props) => {
	const { text, onPress, customStyle, disabled = false } = props;

	return (
		<Pressable
			disabled={disabled}
			style={[styles.flexDiv, styles.loaderButton.main, customStyle.main, (disabled) ? styles.loaderButton.disable : '']}
			onPress={onPress}
		>
			<Text style={[styles.loaderButton.text, customStyle.text]}>{ text }</Text>
			{/*(disabled) ? <Image source={ButtonLoaderIco} alt='loader' style={styles.loaderButton.icon} /> : null*/}
		</Pressable>
	)
}

export default LoaderButton;