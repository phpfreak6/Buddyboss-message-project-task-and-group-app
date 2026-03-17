import React from 'react';
import { StyleSheet, Platform } from 'react-native';

import { colors } from './../constants/colors';

const styles = StyleSheet.create({
	container: {
		flexGrow: 1
	},
	autoLeft: {
		marginLeft: 'auto'
	},
	flexDiv: {
		flexDirection: 'row',
		flexWrap: "nowrap",
	},
	bottomBar: {
		main: {
			backgroundColor: "#F5F5F7",
			width: '100%',
			justifyContent: 'space-around',
			alignItems: 'center'
		},
		hide: {
			height: 0,
			opacity: 0
		},
		tab: {
			main: {
				width: '20%',
				paddingBottom: Platform.OS === 'ios' ? 8 : 8,
				marginTop: 8,
			},			
			button: {
				main: {
					width: '100%',
				},
				content: {
					alignItems: 'center'
				},
				text: {
					fontWeight: '500',
					fontSize: 12,
					color: colors.grey,
					marginTop: 5
				},
				active: {
					color: "#ff7a08"
				},
				icon: {
					width: 15,
					height: 15.25
				}
			}
		}
	},
	iconContainer: {
		position: 'relative',
		icon: {
			fontSize: 25
		}
	},
	badge: {
		position: 'absolute',
		top: -5,
		right: -12,
		backgroundColor: 'red',
		borderRadius: 15,
		paddingHorizontal: 6,
		paddingVertical: 4,
		elevation: 3,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	badgeText: {
		color: 'white',
		fontSize: 10,
		fontWeight: 'bold',
	},
	unAuthHeader: {
		main: {
			marginBottom: 20
		},
		heading: {
			fontSize: 18,
			fontWeight: '700',
		},
		skip: {
			alignItems: 'center',
			text: {
				fontWeight: '700',
				fontSize: 16,
				borderBottomWidth: 1,
				borderBottomColor: colors.grey,
				color: colors.grey
			},
			icon: {
				// width: 10.52,
				// height: 5.25
			}
		},
	},
	header: {
		container: {
			backgroundColor: colors.lightBlue,
		},
		main: {
			marginTop: 30,
			marginBottom: 20,
			alignItems: 'center',
			marginHorizontal: 15
		},
		w100: {
			width: '100%'
		},
		w90: {
			width: '90%'
		},
		back: {
			main: {
				alignItems: 'center',
				width: '10%',
			},
			icon: {}
		},
		heading: {
			main: {
				width: '80%',
				alignItems: 'center',
			},
			content: {
				main: {
					alignItems: 'center'
				},
				image: {
					main: {
						marginHorizontal: 5
					},
					icon: {
						width: 18,
						height: 23
					}
				},
				text: {
					main: {},
					name: {
						fontWeight: '450',
						fontSize: 16,
						color: colors.grey
					},
					address: {
						fontWeight: '450',
						fontSize: 11,
						color: colors.grey,
						opacity: 0.7
					}
				}
			}
		},
		cart: {
			main: {
				position: 'relative',
				width: '10%',
			},
			icon: {
				marginLeft: 'auto'
			},
			value: {
				position: 'absolute',
				right: -6,
				top: -10,
				fontWeight: '450',
				fontSize: 14,
				color: colors.white,
				backgroundColor: colors.grey,
				borderRadius: 50,
				paddingHorizontal: 5
			}
		}
	},
	statusBar: {
		content: {
			justifyContent: 'center',
			alignItems: 'center',
		},
		closeIcon: {
			main: {},
			image: {
				height: 15,
				width: 15
			}
		},
		main: {
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: 7,
			padding: 10
		},
		text: {
			fontSize: 12,
			fontWeight: '600',
			marginLeft: 10
		},
		image: {
			main: {},
			icon: {
				width: 20,
				height: 20
			}
		},
		success: {
			main: {
				backgroundColor: '#E4FFE9'
			},
			text: {
				color: '#00420B'
			}
		},
		error: {
			main: {
				backgroundColor: '#FDD4D4'
			},
			text: {
				color: colors.red
			}
		},
		warning: {
			main: {
				backgroundColor: '#FDD4D4'
			},
			text: {
				color: '#A98600'
			}
		},
	},
	noData: {
		main: {
			alignItems: 'center',
			justifyContent: 'center',
			paddingTop: 20,
			top: 200
		},
		text: {
			fontSize: 16,
			fontWeight: '600',
			color: colors.secondary3
		},
		image: {
			main: {
				width: '100%',
				alignItems: 'center'
			},
			icon: {
				width: 100,
				height: 100
			}
		}
	},
	loaderButton: {
		main: {
			alignItems: 'center',
			justifyContent: 'center'
		},
		text: {
			color: colors.lightBlue,
			paddingRight: 5
		},
		icon: {
			width: 25,
			height: 25
		},
		disable: {
			opacity: 0.85
		}
	},
	quantity: {
		main: {},
		minus: {
			main: {
				backgroundColor: colors.lightBlue,
				paddingVertical: 4,
				paddingHorizontal: 11,
				borderTopLeftRadius: 8,
				borderBottomLeftRadius: 8,
				alignItems: 'center'
			},
			text: {
				color: colors.grey,
				fontSize: 18,
				fontWeight: '450'
			}
		},
		add: {
			main: {
				backgroundColor: colors.lightBlue,
				paddingVertical: 4,
				paddingHorizontal: 11,
				borderTopRightRadius: 8,
				borderBottomRightRadius: 8,
				alignItems: 'center'
			},
			text: {
				color: colors.grey,
				fontSize: 18,
				fontWeight: '450'
			}
		},
		field: {
			color: colors.grey,
			fontSize: 18,
			fontWeight: '450',
			backgroundColor: "#F5F5F7",
			paddingVertical: 3,
			paddingHorizontal: 12,
			textAlign: 'center'
		}
	},
	loader: {
		background: {
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
			alignItems: 'center'
		},
		icon: {
			height: 80,
			width: 80
		},
	},
	model: {
		main: {
			position: "absolute", 
		    top: 0, 
		    left: 0, 
		    right: 0, 
		    bottom: 0, 
		    justifyContent: "center"
		},
		container: {
			zIndex: 1
		},
		background: {
			flexGrow: 1,
		    backgroundColor: colors.black,
		    opacity: 0.5
		}
	},
	buttonInput: {
		main: {
			borderRadius: 50,
			borderColor: colors.lightBlue,
			borderWidth: 1,
		},
		field: {
			width: '70%',
			borderTopLeftRadius: 50,
			borderBottomLeftRadius: 50,
			paddingVertical: 8,
			fontWeight: '300',
			fontSize: 18,
			fontStyle: 'italic'
		},
		button: {
			main: {
				width: '30%',
				paddingVertical: 8,
				backgroundColor: colors.lightBlue,
				borderTopRightRadius: 50,
				borderBottomRightRadius: 50,
				alignItems: 'center'
			},
			text: {
				fontWeight: '450',
				fontSize: 18,
				color: colors.grey
			}
		}
	},
});

export default styles;