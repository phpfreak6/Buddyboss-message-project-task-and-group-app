import React from 'react'
import { StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		top: 20
	},
	flexDiv: {
		flexDirection: 'row',
		flexWrap: "wrap",
	},
	autoLeft: {
		marginLeft: 'auto'
	},
	font14: {
		fontWeight: '400',
		fontSize: 14
	},
	form: {
		main: {},
		heading: {
			fontWeight: '400',
			fontSize: 18,
			color: colors.grey,
			
		},
		fields: {
			main: {
				marginVertical: 10,
			},
			input: {
				backgroundColor: colors.lightGrey,
				color: colors.grey,
				borderRadius: 8,
				padding: 10,
				fontWeight: '300',
				fontSize: 16,
			},
			otp: {
				borderWidth: 4,
				borderRadius: 8,
				backgroundColor: colors.lightGrey,
				fontWeight: '400',
				fontSize: 18,
				color: colors.grey
			},
			resend: {
				main: {
					alignItems: 'center',
					// marginVertical: 20
				},
				text: {
					borderBottomWidth: 2,
					borderBottomColor: colors.grey,
					fontWeight: '500',
					fontSize: 18,
					color: colors.grey
				}
			},
			button: {
				main: {
					paddingVertical: 10,
					backgroundColor: colors.grey,
					borderRadius: 50,
					marginVertical: 20
				},
				text: {
					fontWeight: '500',
					fontSize: 16,
				}
			}
		},
		error: {
			color: colors.red,
			paddingLeft: 10,
		}
	},
	model: {
		background2: {
			flexGrow: 1,
		    backgroundColor: colors.black,
		    opacity: 0.6
		},
		container: {
			position: "absolute", 
		    top: 0, 
		    left: 0, 
		    right: 0, 
		    bottom: 0, 
		    justifyContent: "center",
		},
		main: {
			zIndex: 1,
			alignItems: 'center',
			marginHorizontal: 30,
			padding: 25,
			backgroundColor: colors.white,
			borderRadius: 10,
		},
		header: {
			fontWeight: '500',
			fontSize: 16,
			color: colors.grey,
			marginVertical: 20
		},
		image: {
			main: {
				marginVertical: 10
			},
			icon: {
				width: 86.22,
				height: 49.73
			}
		},
		button: {
			main: {
				backgroundColor: colors.blackNormal,
				borderRadius: 50,
				paddingVertical: 10,
				width: '100%',
				alignItems: 'center'
			},
			text: {
				fontWeight: '500',
				fontSize: 16,
				color: colors.lightBlue
			}
		}
	}
});

export default styles