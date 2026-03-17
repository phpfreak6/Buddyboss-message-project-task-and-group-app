import React from 'react';
import { View, ScrollView, Text, SafeAreaView, StatusBar } from 'react-native';

import { CartHeader } from '../../components';
import styles from './styles';

const ViewLayout = (props) => {
	const { children, noMargin = false, backGroundGrey = false  } = props;

	return (
		<SafeAreaView style={styles.container}>
			{/*<StatusBar translucent backgroundColor="#ADC6C9" {...props} />*/}
      		<View style={[styles.layout, (noMargin) ? styles.noMargin : '', backGroundGrey ? styles.backgroundGrey : null]}>

				{children}
			</View>
		</SafeAreaView>
	)
}

export default ViewLayout;