import React, { useState, useEffect, Fragment } from 'react';
import { View, Text, Pressable, TextInput, Button, TouchableHighlight } from 'react-native';

import { validate as FormValidate, ListErrorMessages } from '../../../constants/Validations';
import { LoaderButton } from '../../../components';
import styles from '../styles';
import commonstyle from '../../styles/commonstyle';

const FormFields = (props) => {
	const { navigation, onSubmit, disableSubmit } = props;
	const [emailUsername, setEmailUsername] = useState('');
	const [password, setPassword] = useState('');
	const [errors, setErrors] = useState(null);

	const pressForget = () => {
		navigation.push('ForgotPassword');
	}

	const handleSubmit = () => {
		let checkValidate = FormValidate({
	      	emailUsername: { value: emailUsername, required: true },
	      	password: { value: password, required: true }
	    });

		if(!checkValidate.status) {
			setErrors(null);
			let obj = { emailUsername, password };
			onSubmit(obj);
		} else {
			let values = ListErrorMessages(checkValidate.errors);
			setErrors(values);
		}
	}

	return (
		<View style={styles.form.main}>
			{(errors && errors.main) ? 
				<View style={styles.form.error.main}>
					<Text style={styles.form.error.text}>{ errors.main }</Text>
				</View>
			: null}


            <Fragment>
				<View style={commonstyle.input.main}>
					<TextInput
					  	style={[commonstyle.input.field, { color: '#000' }]}
					  	value={emailUsername}
					  	placeholder="Email or Username"
					  	placeholderTextColor="#999"
					  	onChangeText={(e) => setEmailUsername(e)}
					/>
				</View>
				{(errors && errors.email) ? <Text style={styles.form.error.single}>{ errors.email }</Text> : null }

				<View style={commonstyle.input.main}>
					<TextInput
					  	style={[commonstyle.input.field, { color: '#000' }]}
					  	value={password}
					  	placeholder="Password"
					  	placeholderTextColor="#999"
					  	secureTextEntry={true}
					  	onChangeText={(e) => setPassword(e)}
					/>
				</View>
				{(errors && errors.password) ? <Text style={styles.form.error.single}>{ errors.password }</Text> : null }
			</Fragment>	


			<Pressable style={styles.form.forgot.main} onPress={pressForget}>
				<Text style={[styles.autoLeft, styles.form.forgot.text, styles.font14]}>Forgot password?</Text>
			</Pressable>

			<LoaderButton
				text="Log In"
				customStyle={styles.form.submit}
				onPress={handleSubmit}
				disabled={disableSubmit}
			/>

			<View style={styles.form.legalLinks}>
				<Pressable onPress={() => navigation.navigate('PrivacyPolicy')}>
					<Text style={[styles.form.legalText, styles.font12]}>Privacy Policy</Text>
				</Pressable>
				<Text style={{ fontSize: 12, color: '#666' }}> And </Text>
				<Pressable onPress={() => navigation.navigate('TermsOfService')}>
					<Text style={[styles.form.legalText, styles.font12]}>Terms of Service</Text>
				</Pressable>
			</View>

		</View>
	)
}

export default FormFields;