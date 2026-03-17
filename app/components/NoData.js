import React from 'react';
import { View, Text, Image } from 'react-native';

import { NoDataIco } from '../assets/images';
import styles from './styles';

const NoData = (props) => {
	const { customStyle = '', message, icon = false } = props;

	return (
		<View style={styles.noData.main}>
			{(icon) ?
				<View style={styles.noData.image.main}>
					<Image source={NoDataIco} alt='' style={styles.noData.image.icon} />
				</View>
			:null}

			<Text
				style={[styles.flexDiv, styles.noData.text, customStyle]}
			>
				{ message }
			</Text>
		</View>
	)
}

export default NoData;