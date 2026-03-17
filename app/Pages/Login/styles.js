import React from 'react'
import { StyleSheet } from 'react-native';
import { colors } from './../../constants/colors';

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 15,
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
	heading: {
		main: {
			marginVertical: 10
		},
		heading: {
			main: {
				fontSize: 32,
				fontWeight: '600',
				color: colors.secondary,
				// marginBottom: 12
			},
			subText: {
				fontSize: 16,
				fontWeight: '400',
				color: colors.secondary2
			}
		}
	},
	form: {
		main: {
			marginVertical: 10
		},
		fields: {
			main: {},
			input: {
				padding: 10,
				fontWeight: '400',
				fontSize: 16,
				color: colors.secondary2
			}
		},
		error: {
			single: {
				color: colors.red,
				fontSize: 12,
				marginBottom: 10,
				marginHorizontal: 8
			},
			main: {
				backgroundColor: colors.lightRed,
				padding: 10,
				borderRadius: 6
			},
			text: {
				color: colors.red,
				fontSize: 12
			}
		},
		icons: {
			email: {
				width: 20,
				height: 16,
			},
			password: {
				width: 15,
				height: 20,
			}
		},
		forgot: {
			main: {
				marginBottom: 30
			},
			text: {
				color: colors.blackNormal
			}
		},
		submit: {
			main: {
				borderRadius: 50,
				paddingVertical: 10,
				marginBottom: 5,
				backgroundColor : colors.blackNormal
			},
			text: {
				fontSize: 16,
				fontWeight: '500'
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
		or: {
			textAlign: 'center',
			color: colors.darkGrey,
			fontSize: 16,
			fontWeight: '400',
			marginBottom: 6
		},
		bottom: {
			main: {
				justifyContent: 'center',
				textAlign: 'center',
				position: 'absolute',
				bottom: 36,
				left: 0,
				right: 0,
				width: '100%',
			},
			text: {
				color: colors.darkGrey,
			},
			button: {
				main: {
					alignItems: 'center',
					justifyContent: 'center'
				},
				text: {
					color: colors.secondary
				}
			}
		},
		legalLinks: {
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			marginTop: 20,
			marginBottom: 25,
			paddingHorizontal: 25,
		},
		legalText: {
			color: '#444',
			fontSize: 13.5,
			letterSpacing: 0.4,
			fontWeight: '500',
		},
		legalSeparator: {
			color: '#666',
			marginHorizontal: 10,
			fontSize: 13.5,
		},
	}
});

export default styles