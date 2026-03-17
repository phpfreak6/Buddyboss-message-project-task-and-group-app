import React from 'react'
import { StyleSheet } from 'react-native';
import { colors } from './../../../constants/colors';

const styles = StyleSheet.create({
	
	container: {
		marginHorizontal: 20,
		flexGrow: 1,
		top: 20
	},
	flexDiv: {
		flexDirection: 'row',
		flexWrap: "wrap",
	},
	header: {
		text: {
			fontWeight: '700',
			fontSize: 18
		}
	},
	form: {
		container: {},
		main: {
			marginVertical: 15
		},
		error: {
			main: {
				backgroundColor: colors.lightRed,
				padding: 10,
				borderRadius: 6,
				marginBottom:15
			},
			text: {
				color: colors.red,
				fontSize: 12
			}
		},
		otpFields:{
			main: {
				backgroundColor: colors.subLightGrey,
				display: "flex",
			},
			input: {
				borderRadius: 6,
				paddingVertical: 9,
				paddingHorizontal: 8,
				backgroundColor: colors.white,
				fontWeight: '400',
				fontSize: 16
			},
			error: {
				color: colors.red,
				fontSize: 12,
				marginBottom: 10
			}
		},
		buttons: {
			main: {},
			button: {
				main: {
					borderRadius: 50,
					backgroundColor: colors.grey,
					paddingVertical: 8,
					alignItems: 'center'
				},
				text: {
					color: colors.lightBlue,
					fontWeight: '500',
					fontSize: 18,
				}
			}
		},
		fields: {
			main: {
				backgroundColor: colors.subLightGrey,
				marginBottom: 30
			},
			text: {
				fontWeight: '400',
				fontSize: 18,
				color: colors.grey
			},
			input: {
				main: {
					marginHorizontal: 15
				},
				content: {
					marginTop: 8,
					marginBottom: 15
				},
				input: {
					borderRadius: 6,
					paddingVertical: 9,
					paddingHorizontal: 8,
					backgroundColor: colors.white,
					fontWeight: '400',
					fontSize: 16
				},
				text: {
					marginTop: 5,
					fontWeight: '400',
					fontSize: 12,
					color: colors.secondary2
				}
			}
		},
		submit: {
			main: {
				borderRadius: 20,
				paddingVertical: 10,
				textAlign: 'center',
				marginBottom: 5,
				marginTop: 8,
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
		button: {
			main: {
				borderRadius: 20,
				paddingVertical: 10,
				textAlign: 'center',
				marginBottom: 5,
				backgroundColor : colors.white,
				width: "100%",
				borderWidth: 2,
				borderColor: "#c0d4d7"
			},
			text: {
				color: "#b0c0c3",
				textAlign: 'center',
				fontSize: 16,
				fontWeight: '600'
			}
		},
		icons: {
			main: {},
			user: {
				width: 16,
				height: 20
			},
			email: {
				width: 21,
				height: 16.5
			},
			password: {
				width: 15.13,
				height: 20.63
			},
			phone: {
				width: 19.25,
				height: 19.25
			},
		}
	}
});

export default styles