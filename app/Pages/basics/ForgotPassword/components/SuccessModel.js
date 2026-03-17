import React from 'react';
import { View, Text, Modal, Pressable, Image, TouchableHighlight } from 'react-native';

import { DoubleCheckIco } from '../../../../assets/images';

import styles from '../styles';

const SuccessModel = (props) => {
	const { visible, setVisible, onPress } = props;

	return (
		<Modal
			animationType="fade"
			transparent={true}
			visible={visible}
			onRequestClose={() => {
				setVisible(!visible);
			}}
		>
			<TouchableHighlight
			    style={styles.model.background}
			    underlayColor={"transparent"}
		    >
		      	<View />
		    </TouchableHighlight>

	      	<View style={styles.model.container}>
      			<View style={styles.model.main}>
      				<View style={styles.model.image.main}>
      					<Image source={DoubleCheckIco} style={styles.model.image.icon} alt="" />
      				</View>

      				<Text style={styles.model.header}>Password changed</Text>

      				<Pressable style={styles.model.button.main} onPress={onPress}>
      					<Text style={styles.model.button.text}>Go to login</Text>
      				</Pressable>
      			</View>
      		</View>
		</Modal>
	)
}

export default SuccessModel;