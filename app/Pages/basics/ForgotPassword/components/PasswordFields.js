import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';

import { validate as FormValidate, ListErrorMessages } from '../../../../constants/Validations';
import { LoaderButton } from '../../../../components';
import styles from '../styles';

const PasswordFields = (props) => {
	const { onSubmit, disableSubmit, otp, email } = props;
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [errors, setErrors] = useState(null);

	const handleSubmit = () => {
		let checkValidate = FormValidate({
	      	password: {
	      		value: password, required: true, hasNumber: false, hasLowerCase: false, hasUpperCase: false,
	      		hasSpecialCharacter: false, minlength: 7
	      	},
      		confirmPassword: { value: confirm, required: true, equalPassword: password },
	    });

		if(!checkValidate.status) {
			setErrors(null);
			let obj = { otp, email, newPassword: password };

			onSubmit(obj);
		} else {
			let values = ListErrorMessages(checkValidate.errors);
			setErrors(values);	
		}
	}

	return (
		<View style={styles.form.main}>
			<View style={styles.form.fields.main}>
				<TextInput
					style={styles.form.fields.input}
					onChangeText={(text) => setPassword(text)}
					value={password}
					secureTextEntry={true}
					placeholder="New Password"
				/>
				{(errors && errors.password) ? <Text style={styles.form.error}>{errors.password}</Text> : null}
			</View>

			<View style={styles.form.fields.main}>
				<TextInput
					style={styles.form.fields.input}
					onChangeText={(text) => setConfirm(text)}
					value={confirm}
					secureTextEntry={true}
					placeholder="Confirm New Password"
				/>
				{(errors && errors.confirmPassword) ? <Text style={styles.form.error}>{errors.confirmPassword}</Text> : null}
			</View>

			<LoaderButton
				text="Save Changes"
				customStyle={styles.form.fields.button}
				onPress={handleSubmit}
				disabled={disableSubmit}
			/>
		</View>
	)
}

export default PasswordFields;