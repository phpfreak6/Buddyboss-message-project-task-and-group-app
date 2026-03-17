import React from 'react';
import { View, Image, Modal, TouchableHighlight } from 'react-native';

import { LoaderIco } from '../assets/images';
import styles from './styles';

const PageLoader = (props) => {
	const { visible, setVisible } = props;

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
			    style={styles.loader.background}
			    underlayColor={"transparent"}
		    >
		      	<View />
		    </TouchableHighlight>

	      	<View style={styles.loader.container}>
      			<View style={styles.loader.main}>
      				<Image source={LoaderIco} alt='' style={styles.loader.icon} />
      			</View>
      		</View>
		</Modal>
	)
}

export default PageLoader;