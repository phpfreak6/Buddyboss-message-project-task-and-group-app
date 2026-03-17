import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { View, Text, TextInput, Alert } from 'react-native';

import { UnauthViewLayout } from '../../Layouts';
import { RESET, EMPTY_RESET } from '../../../constants';
import agent from '../../../agent';
import { validate as FormValidate, ListErrorMessages } from '../../../constants/Validations';
import { LoaderButton, StatusBar, PageLoader } from '../../../components';
import styles from './styles';


const mapStateToProps = state => ({
	...state,
	forgotPassword: state.common.forgotPassword,
});

const mapDispatchToProps = dispatch => ({
	forgot: (data) => dispatch({ type: RESET, payload: agent.Auth.forgot(data) }),
	emptyValues: () => dispatch({ type: EMPTY_RESET })
});

const ForgotPassword = (props) => {
	const { navigation, forgot, forgotPassword, emptyValues } = props;
	const [showStatus, setShowStatus] = useState(false);
	const [disableSubmit, setDisableSubmit] = useState(false);
	const [statusProps, setStatusProps] = useState(null);
	const [errors, setErrors] = useState(null);
	const [email, setEmail] = useState('');

	const handleSubmit = async (formData) => {
		let checkValidate = FormValidate({
	      	email: { value: email, email: true, required: true },
	    });

		if(!checkValidate.status) {
			setErrors(null);
			let obj = { email };

			setDisableSubmit(true);
			try {
				
				
				const Response = await agent.Auth.ForgotPassword(obj); 

				if(Response && Response.isSuccess){
                    Alert.alert(Response.message)
				}else if(Response && Response.error && Response.error.message){
					setErrors({email: Response.error.message})
				}else{
					setErrors({email: "Something went wrong"});
				}

				setDisableSubmit(false);
		
		
			} catch (error) {
				setDisableSubmit(false);
				setErrors({email: error.message})
			}
		} else {
			let values = ListErrorMessages(checkValidate.errors);
			setErrors(values);	
		}
	}

	const skipTrigger = () => {}

	useEffect(() => {
		if(forgotPassword) {
			if(forgotPassword == 'error') {
				let obj = { message: 'Please check your email.', error: true, setShowStatus };

				setStatusProps(obj);
				setShowStatus(true);
			} else {
				navigation.navigate('VerifyResetOtp', { email });
			}

			emptyValues();
		}
		setDisableSubmit(false);
	}, [forgotPassword]);

	let layoutProps = {
		heading: 'Forgot Password',
		navigation,
		showBackBtn: true,
		noMargin: false
	}

	return (
		<UnauthViewLayout {...layoutProps}>
			<View style={styles.container}>
				{showStatus ? <StatusBar {...statusProps} /> : null}
				
				<View style={styles.form.main}>
					<Text style={styles.form.heading}>Enter your email address and we will send instruction to reset your password.</Text>

					<View style={styles.form.fields.main}>
						<TextInput
							style={styles.form.fields.input}
							onChangeText={(text) => setEmail(text)}
							value={email}
							placeholder="Email"
						/>
						{(errors && errors.email) ? <Text style={styles.form.error}>{errors.email}</Text> : null}
					</View>

					<LoaderButton
						text="Submit"
						customStyle={styles.form.fields.button}
						onPress={handleSubmit}
						disabled={disableSubmit}
					/>
				</View>
				<PageLoader visible={disableSubmit} setVisible={setDisableSubmit} />
			</View>
		</UnauthViewLayout>
	)
}

export default connect(mapStateToProps, mapDispatchToProps)(ForgotPassword);