import React, { useState, useEffect, Fragment } from 'react';
import { connect } from 'react-redux';
import { View, Text, Pressable,TextInput, Button, TouchableHighlight, Alert  } from 'react-native';

import { validate as FormValidate, ListErrorMessages } from '../../../../constants/Validations';
import { LoaderButton, PageLoader } from '../../../../components';
import styles from '../styles';
import commonstyle from '../../../styles/commonstyle';
import agent from '../../../../agent';
import {  REGISTER } from '../../../../constants';

const mapStateToProps = state => ({
	...state,
});

const mapDispatchToProps = dispatch => ({});

const FormFields = (props) => {
	const { navigation, onSubmit, currentUser, currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmNewPassword, setConfirmNewPassword } = props;
	
	const [error, setError] = useState(null);
	const [errors, setErrors] = useState(null);
	const [disableSubmit, setDisableSubmit] = useState(false);

	const handleSubmit = async () => {
		let checkValidate = FormValidate({
			currentPassword: { value: currentPassword, required: true },
			newPassword: { value: newPassword, required: true, minlength:7
	      	},
      		confirmNewPassword: { value: confirmNewPassword, required: true, equalPassword: newPassword },
	    });

		if(!checkValidate.status) {
			// setError(null);
			setErrors(null);
			let obj = { currentPassword,newPassword };
			try {		
				setDisableSubmit(true);
				const Response = await agent.Auth.ChangePassword(obj); 


				if(Response && Response.isSuccess){
					Alert.alert(Response.message)
					setCurrentPassword("");
					setNewPassword("");
					setConfirmNewPassword("");
					navigation.navigate('Settings');

				}else if(Response && Response.error && Response.error.message){
					setErrors({currentPassword: Response.error.message})
				}else{
					setErrors({currentPassword: "Something went wrong"});
				}

				setDisableSubmit(false);
		
		
			} catch (error) {
				setDisableSubmit(false);

				setErrors({currentPassword: error.message})
			}
		} else {
			let values = ListErrorMessages(checkValidate.errors);
			setErrors(values);
		}
	}



	let fieldsProp = {
		customStyle: styles.form.fields.input
	}

	return (
		<View style={styles.form.main}>
			<View style={commonstyle.input.main}>
				<TextInput
				  	style={commonstyle.input.field}
				  	value={currentPassword}
				  	placeholder="Current Password"
				  	secureTextEntry={true}
				  	onChangeText={(e) => setCurrentPassword(e)}
				/>
			</View>
			{(errors && errors.currentPassword) ? <Text style={styles.form.otpFields.error}>{errors.currentPassword}</Text> : null}

			<View style={commonstyle.input.main}>
				<TextInput
				  	style={commonstyle.input.field}
				  	value={newPassword}
				  	placeholder="New Password"
				  	secureTextEntry={true}
				  	onChangeText={(e) => setNewPassword(e)}
				/>
			</View>
			{(errors && errors.newPassword) ? <Text style={styles.form.otpFields.error}>{errors.newPassword}</Text> : null}

			<View style={commonstyle.input.main}>
				<TextInput
				  	style={commonstyle.input.field}
				  	value={confirmNewPassword}
				  	placeholder="Confirm New Password"
				  	secureTextEntry={true}
				  	onChangeText={(e) => setConfirmNewPassword(e)}
				/>
			</View>
			{(errors && errors.confirmNewPassword) ? <Text style={styles.form.otpFields.error}>{errors.confirmNewPassword}</Text> : null}

			

			<LoaderButton
				text="Save changes"
				customStyle={styles.form.submit}
				onPress={handleSubmit}
				disabled={disableSubmit}
			/>
			<PageLoader visible={disableSubmit} setVisible={setDisableSubmit} />
		</View>
	)
}

export default connect(mapStateToProps, mapDispatchToProps)(FormFields);