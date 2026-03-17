import React from 'react';
import { View, ScrollView, Text, SafeAreaView, StatusBar } from 'react-native';
import { HeaderView } from '../../components';
import styles from './styles';

const UnauthViewLayout = (props) => {
	const { children, noMargin = true, heading, navigation, showBackBtn   } = props;

	return (
		<SafeAreaView style={styles.container}>
			{/*<StatusBar translucent backgroundColor="#ADC6C9" {...props} />*/}
			<HeaderView {...props} />
      		<View style={[styles.unAuthlayout, (noMargin) ? styles.noMargin : '']}>
				{children}
			</View>
		</SafeAreaView>
	)
}

export default UnauthViewLayout;