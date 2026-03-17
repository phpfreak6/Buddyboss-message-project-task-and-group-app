import React from 'react';
import { StyleSheet } from 'react-native';
import { colors } from './../../constants/colors';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.primary
	},
	flexData: {
		flexDirection: 'row',
		flexWrap: "wrap",
	},
	image: {},
});

export default styles