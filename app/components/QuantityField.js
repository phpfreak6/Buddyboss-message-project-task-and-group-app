import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

import styles from './styles';

const QuantityField = (props) => {
	const { quantity, setQuantity, allow = false } = props;

	const triggerAdd = () => {
		let value = parseInt(quantity) + 1;
		setQuantity(value.toString())
	}

	const triggerRemove = () => {
		let value = (quantity > 1 || allow) ? parseInt(quantity) - 1 : 1;
		setQuantity(value.toString())
	}

	return (
		<View style={[styles.flexDiv, styles.quantity.main]}>
			<Pressable style={styles.quantity.minus.main} onPress={triggerRemove}>
				<Text style={styles.quantity.minus.text}>-</Text>
			</Pressable>

			<TextInput
				value={quantity}
				onChangeText={(text) => setQuantity(text)}
				style={styles.quantity.field}
				keyboardType='numeric'
			/>

			<Pressable style={styles.quantity.add.main} onPress={triggerAdd}>
				<Text style={styles.quantity.add.text}>+</Text>
			</Pressable>
		</View>
	)
}

export default QuantityField;