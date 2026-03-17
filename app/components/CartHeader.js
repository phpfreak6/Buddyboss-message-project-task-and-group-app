import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { decode } from 'html-entities';

import { BackSmallIco, LocationIco, CartIco } from '../assets/images';
import styles from './styles';

const CartHeader = (props) => {
	const {
		navigation,
		heading = null,
		address = null,
		back = true,
		cart = true,
		fullSize = false,
		onPress,
		cartCount = null,
		customStyle = '',
		backPress = null
	} = props;

	const triggerBack = () => {
		if(backPress) {
			backPress();
		} else {
			navigation.goBack();
		}
	}

	const triggerCart = () => {
		navigation.navigate('Cart');
	}

	return (
		<View style={styles.header.container}>
			<View style={[styles.flexDiv, styles.header.main]}>
				{(back) ?
					<Pressable style={styles.header.back.main} onPress={triggerBack}>
						<Image source={BackSmallIco} alt='' style={styles.header.back.icon} />
					</Pressable>
				: null }

				<Pressable
					style={[
						styles.header.heading.main,
						(!back || !cart) ? styles.header.w90 : '',
						(fullSize) ? styles.header.w100 : '',
						(!back && !cart) ? styles.header.w100 : '',
					]}
					onPress={onPress}
				>
					<View style={[styles.flexDiv, styles.header.heading.content.main]}>
						{(address) ?
							<View style={styles.header.heading.content.image.main}>
								<Image source={LocationIco} alt='' style={styles.header.heading.content.image.icon} />
							</View>
						: null}
						<View style={styles.header.heading.content.text.main}>
							<Text style={[styles.header.heading.content.text.name, customStyle]}>{ decode(heading) }</Text>
							{(address) ? <Text style={styles.header.heading.content.text.address}>{ decode(address) }</Text> : null}
						</View>
					</View>
				</Pressable>

				{(cart) ?
					<Pressable style={[styles.autoLeft, styles.header.cart.main]} onPress={triggerCart}>
						<Image source={CartIco} alt='' style={styles.header.cart.icon} />
						{(cartCount) ? <Text style={styles.header.cart.value}>{ cartCount }</Text> : null}
					</Pressable>
				: null }
			</View>
		</View>
	)
}

export default CartHeader;