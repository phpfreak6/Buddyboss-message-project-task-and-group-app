import React from 'react';
import { View, Modal, TouchableHighlight } from 'react-native';
import styles from './styles';

const ModelView = (props) => {
	const { visible, setVisible, children, customStyle = '' } = props;

	return (
		<Modal
			transparent={true}
			visible={visible}
			onRequestClose={() => setVisible(!visible)}
		>
		    <TouchableHighlight
			    style={styles.model.background}
			    onPress={() => setVisible(!visible)}
			    underlayColor={"transparent"}
		    >
		      	<View />
		    </TouchableHighlight>

		    <View style={styles.model.main }>
				<View style={[styles.model.container, customStyle]}>
		    		{ children }
		    	</View>
			</View>
		</Modal>
	)
}

export default ModelView;