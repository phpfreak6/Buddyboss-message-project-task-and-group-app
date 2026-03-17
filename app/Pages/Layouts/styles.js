import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { colors } from './../../constants/colors';

const screenHeight = Dimensions.get('window').height

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.white
	},
	scrollView: {
	  	flexGrow: 1,
	  	marginBottom: 0,
	},
	scrollChild: {
		flexGrow: 1
	},
	layout: {
		marginHorizontal: 15,
		flexGrow: 1,
	},
	noMargin: {
		marginHorizontal: 0,
	},
	unAuthlayout: {
		marginHorizontal: 15,
		flex: 1
	},
	backgroundGrey: {
		backgroundColor: "#cccccc29"
	}
});

export default styles;