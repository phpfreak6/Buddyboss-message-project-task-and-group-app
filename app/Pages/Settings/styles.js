import React from 'react';
import { StyleSheet } from 'react-native';
import { colors } from './../../constants/colors';

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
	},
	container1: {
		marginBottom: 200
	},
	autoLeft: {
		marginLeft: 'auto'
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
	listing: {
		container: {},
		main: {
			marginHorizontal: 20
		},
		list: {
			main: {
				alignItems: 'center',
				paddingVertical: 15,
				borderBottomWidth: 2,
				borderBottomColor: colors.lightGrey
			},
			text: {
				fontWeight: '400',
				fontSize: 18,
				color: colors.grey,
				paddingLeft: 10
			},
			user: {
				width: 21.67,
				height: 21.67,
			},
			lock: {
				width: 19.5,
				height: 22.75,
			},
			shield: {
				width: 19.5,
				height: 23.83,
			},
			out: {
				width: 21.12,
				height: 17.88,
			},
			doc: {
				width: 17.33,
				height: 23.11,
			}
		},
		logo: {
			main: {
				alignItems: 'center'
			},
			icon: {
				height: 107,
				width: 305,
				marginTop: 50,
				marginBottom: 15
			},
			name: {
				height: 8,
				width: 89,
				marginBottom: 10
			},
			version: {
				fontWeight: '300',
				fontSize: 12,
				color: colors.grey,
			}
		}
	},
	models: {
		logout: {
			main: {
				backgroundColor: colors.white,
				marginHorizontal: 40,
				padding: 15,
				borderRadius: 12,
				// alignItems: 'center'
			},
			close: {
				main: {},
				icon: {
					height: 12,
					width: 12
				}
			},
			text: {
				fontWeight: '400',
				fontSize: 18,
				color: colors.grey,
				padding: 10,
				textAlign: 'center'
			},
			buttons: {
				main: {},
				button: {
					main: {
						width: '50%',
						alignItems: 'center',
						paddingVertical: 10,
						borderWidth: 1,
					},
					text: {
						fontWeight: '500',
						fontSize: 16,
						color: colors.grey,
					},
					colored: {
						backgroundColor: colors.grey,
						borderTopRightRadius: 50,
						borderBottomRightRadius: 50,
						borderColor: colors.grey,
					},
					normal: {
						backgroundColor: colors.lightGrey,
						borderColor: colors.lightBlue,
						borderTopLeftRadius: 50,
						borderBottomLeftRadius: 50,
					},
					colorText: {
						color: colors.lightBlue
					}
				}
			}
		}
	}
});

export default styles;