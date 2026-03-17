import React, { useState, useEffect, Fragment } from 'react';
import { connect } from 'react-redux';
import { View, Text, Pressable,TextInput, Button, TouchableHighlight  } from 'react-native';

import { validate as FormValidate, ListErrorMessages } from '../../../../constants/Validations';
import { LoaderButton } from '../../../../components';
import styles from '../styles';
import commonstyle from '../../../styles/commonstyle';
import agent from '../../../../agent';
import {  REGISTER } from '../../../../constants';

const mapStateToProps = state => ({
	...state,
});

const mapDispatchToProps = dispatch => ({});

const FormFields = (props) => {
	const { navigation, onSubmit, disableSubmit, currentUser } = props;
	const [first_name, setFirstName] = useState('');
	const [last_name, setLastName] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const [error, setError] = useState(null);
	const [errors, setErrors] = useState(null);

	const handleSubmit = () => {
		let checkValidate = FormValidate({
			firstName: { value: first_name, required: true },
			lastName: { value: last_name, required: true },
	    });

		if(!checkValidate.status) {
			// setError(null);
			setErrors(null);
			let obj = { first_name,last_name, phone };
			onSubmit(obj);
		} else {
			let values = ListErrorMessages(checkValidate.errors);
			setErrors(values);
		}
	}

	useEffect(() => {

		if(currentUser) {
			setFirstName(currentUser.first_name);
			setLastName(currentUser.last_name);
			setPhone(currentUser.phone);
			setEmail(currentUser.email);
		}
	}, [currentUser])


	let fieldsProp = {
		customStyle: styles.form.fields.input
	}

	return (
		<View style={styles.form.main}>
			<View style={commonstyle.input.main}>
				<TextInput
				  	style={commonstyle.input.field}
				  	value={first_name}
				  	placeholder="First Name"
				  	onChangeText={(e) => setFirstName(e)}
				/>
			</View>
			{(errors && errors.firstName) ? <Text style={styles.form.otpFields.error}>{errors.firstName}</Text> : null}

			<View style={commonstyle.input.main}>
				<TextInput
				  	style={commonstyle.input.field}
				  	value={last_name}
				  	placeholder="Last Name"
				  	onChangeText={(e) => setLastName(e)}
				/>
			</View>
			{(errors && errors.lastName) ? <Text style={styles.form.otpFields.error}>{errors.lastName}</Text> : null}

			<View style={commonstyle.input.main}>
				<TextInput
				  	style={commonstyle.input.field}
				  	keyboardType = 'numeric'
				  	value={phone}
				  	placeholder="Phone"
				  	onChangeText={(e) => setPhone(e.replace(/[^0-9+]/g, ''))}
				/>
			</View>
			{(errors && errors.phone) ? <Text style={styles.form.otpFields.error}>{errors.phone}</Text> : null}

			<View style={commonstyle.input.main}>
				<TextInput
				  	style={commonstyle.input.field}
				  	value={email}
				  	placeholder="Email"
				  	editable={false}
				/>
			</View>


			<LoaderButton
				text="Save changes"
				customStyle={styles.form.submit}
				onPress={handleSubmit}
				disabled={disableSubmit}
			/>
		</View>
	)
}

export default connect(mapStateToProps, mapDispatchToProps)(FormFields);