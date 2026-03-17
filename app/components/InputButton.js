import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

import styles from './styles';

const InputButton = (props) => {
	const { value = null, setValue = null, onPress = null, text = null, placeholder = null, customStyle = '' } = props;

	return (
		<View style={[styles.flexDiv, styles.buttonInput.main, customStyle]}>
			<TextInput
				value={value}
				onChangeText={(text) => setValue(text)}
				placeholder={placeholder}
				style={styles.buttonInput.field}
			/>

			<Pressable style={styles.buttonInput.button.main} onPress={onPress}>
				<Text style={styles.buttonInput.button.text}>{ text }</Text>
			</Pressable>
		</View>
	)
}

export default InputButton;