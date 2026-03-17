import React from 'react';
import { View, ScrollView, SafeAreaView, Text } from 'react-native';
import styles from './styles';

const HorizontalScroll = (props) => {
	const { children } = props
	return (
      	<ScrollView
	      	style={styles.scrollView}
	      	horizontal={true}
	      	nestedScrollEnabled={true}
	      	showsHorizontalScrollIndicator={false}
	      	contentContainerStyle={styles.scrollChild}
	      	contentInsetAdjustmentBehavior="automatic"
	      	keyboardShouldPersistTaps='handled'
      	>
      		{children}
		</ScrollView>
	)
}

export default HorizontalScroll;