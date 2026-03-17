import React from 'react';
import { StyleSheet } from 'react-native';
import { colors } from './../../constants/colors';

const styles = StyleSheet.create({
	input: {
		main: {
			backgroundColor: colors.lightGrey,
			flexGrow: 2,
			borderRadius: 20,
			width: '100%',
			padding: 2,
			marginBottom: 10
		},
		field: {
			width: '100%',
			borderRadius: 6,
			backgroundColor: colors.lightGrey,
			color:colors.black,
            padding: 10,
		},
		eye: {
			main: {
				alignItems: 'center',
				justifyContent: 'center'
			},
			icon: {
				height: 15,
				width: 22,
				objectFit: 'contain'
			}
		}
	},
	form : {
		button: {

			main: {
				borderRadius: 20,
				paddingVertical: 10,
				textAlign: 'center',
				marginBottom: 5,
				backgroundColor : colors.blackNormal,
				width: "100%"
			},
			text: {
				color: colors.white,
				textAlign: 'center',
				fontSize: 16,
				fontWeight: '400'
			}
		},
	},
	image: {},
	bottom: {
		main:{
			marginBottom:20,
			backgroundColor:"red"
		},
		image : {
			width:20,
			height:20
		}
	},
});

export default styles