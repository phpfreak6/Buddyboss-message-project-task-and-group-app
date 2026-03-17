import React from 'react';
import { View, ScrollView, SafeAreaView, Text } from 'react-native';
import styles from './styles';

const VerticalScroll = (props) => {
	const { children } = props
	return (
      	<ScrollView
	      	style={styles.scrollView}
	      	nestedScrollEnabled={true}
	      	showsVerticalScrollIndicator={false}
	      	contentContainerStyle={styles.scrollChild}
	      	contentInsetAdjustmentBehavior="automatic"
	      	keyboardShouldPersistTaps='handled'
      	>
      		{children}
		</ScrollView>
	)
}

export default VerticalScroll;