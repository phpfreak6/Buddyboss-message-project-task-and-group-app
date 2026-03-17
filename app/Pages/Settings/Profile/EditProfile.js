import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ViewLayout } from '@/Pages/Layouts';
import DateTimePicker from '@react-native-community/datetimepicker';
import { connect } from 'react-redux';
import agent from '@/agent';

const mapStateToProps = state => ({
	...state,
	currentUser: state.common.currentUser,
});

const mapDispatchToProps = dispatch => ({
});

// Helper for radio
const RadioButton = ({ selected, onPress, label }) => (
	<TouchableOpacity style={styles.radioRow} onPress={onPress}>
		<View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
			{selected ? <View style={styles.radioInner} /> : null}
		</View>
		<Text style={styles.radioLabel}>{label}</Text>
	</TouchableOpacity>
);

const EditProfile = ({ navigation, currentUser }) => {
	const [profileData, setProfileData] = useState([]);
	const [selectedTab, setSelectedTab] = useState('');
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [selectedDateField, setSelectedDateField] = useState(null);
	const [tempDate, setTempDate] = useState(new Date());
	const [fields, setFields] = useState({});
	const [loading, setLoading] = useState(true);
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	
	// For demo, use static profile_data. Replace with props or API as needed.
	const fetchUserProfileData = async (userId) => {
		try {
			setLoading(true);
			const Response = await agent.Auth.fetchUserProfileData(userId);
			//console.log(Response);
			if (Response && Response.isSuccess && Response.data.profile_data) {
				setProfileData(Response.data.profile_data);
				// Set initial selected tab to first group if available
				if (Response.data.profile_data.length > 0) {
					setSelectedTab(Response.data.profile_data[0].group_name);
				}
			} else {
				setProfileData([]);
			}
		} catch (error) {
			console.error('Error fetching profile data:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUserProfileData(currentUser.user.id);
	}, [currentUser]);

	// Initialize fields when profileData changes
	useEffect(() => {
		const initialFieldState = {};
		profileData.forEach(section => {
			section.fields.forEach(field => {
				initialFieldState[field.field_id] = field.value || '';
			});
		});
		setFields(initialFieldState);
	}, [profileData]);

	// Validate required fields
	const validateFields = () => {
		const newErrors = {};
		let hasErrors = false;

		profileData.forEach(section => {
			section.fields.forEach(field => {
				if (field.is_required && (!fields[field.field_id] || fields[field.field_id].trim() === '')) {
					newErrors[field.field_id] = `${field.name} is required`;
					hasErrors = true;
				}
			});
		});

		setErrors(newErrors);
		return !hasErrors;
	};

	// Check if a tab has errors
	const hasTabErrors = (groupName) => {
		const section = profileData.find(s => s.group_name === groupName);
		if (!section) return false;
		
		return section.fields.some(field => errors[field.field_id]);
	};

	// Save handler
	const handleSave = async () => {
		if (!validateFields()) {
			return;
		}

		try {
			setSaving(true);
			// Collect all field values
			const result = {};
			profileData.forEach(section => {
				section.fields.forEach(field => {
					result[field.field_id] = fields[field.field_id];
				});
			});

			// Call API to save profile data
			const response = await agent.Auth.updateUserProfileData(result);

			//console.log(response);
			
			if (response && response.isSuccess) {
				// Pass refresh flag when going back
				navigation.navigate('UserProfile', { refresh: true });
			} else {
				// Handle error response
				alert('Failed to save profile. Please try again.');
			}
		} catch (error) {
			console.error('Error saving profile:', error);
			alert('An error occurred while saving. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	// Handle back button press
	const handleBack = () => {
		navigation.navigate('Profile', { refresh: false });
	};

	// Handle field change
	const handleFieldChange = (field_id, value) => {
		setFields(prev => ({ ...prev, [field_id]: value }));
		// Clear error when user starts typing
		if (errors[field_id]) {
			setErrors(prev => ({ ...prev, [field_id]: null }));
		}
	};

	// Handle date change
	const handleDateChange = (event, selectedDate) => {
		if (selectedDate) {
			setTempDate(selectedDate);
		}
	};

	const handleConfirmDate = () => {
		if (selectedDateField) {
			handleFieldChange(selectedDateField.field_id, tempDate.toISOString().split('T')[0]);
		}
		setShowDatePicker(false);
	};

	const handleCancelDate = () => {
		setShowDatePicker(false);
	};

	// Helper function to clean phone number from HTML
	const cleanPhoneNumber = (value) => {
		if (!value) return '';
		
		// Remove all HTML tags and their contents if empty
		let cleaned = value.replace(/<[^>]*>([^<]*)<\/[^>]*>/g, '$1');
		
		// If the result is empty or just whitespace, return empty string
		if (!cleaned.trim()) return '';
		
		// Remove any remaining HTML tags
		cleaned = cleaned.replace(/<[^>]*>/g, '');
		
		return cleaned.trim();
	};

	// Render field by type
	const renderField = (field) => {
		//console.log(field);
		switch (field.type) {
			case 'textbox':
				return (
					<>
						<TextInput
							style={[styles.input, errors[field.field_id] && styles.inputError]}
							value={fields[field.field_id]}
							onChangeText={text => handleFieldChange(field.field_id, text)}
							placeholder={`Enter ${field.name}`}
							placeholderTextColor="#bbb"
						/>
						{errors[field.field_id] && (
							<Text style={styles.errorText}>{errors[field.field_id]}</Text>
						)}
					</>
				);
			case 'datebox':
				return (
					<>
						<TouchableOpacity 
							style={[styles.input, errors[field.field_id] && styles.inputError]} 
							activeOpacity={0.7}
							onPress={() => {
								setSelectedDateField(field);
								setTempDate(fields[field.field_id] ? new Date(fields[field.field_id]) : new Date());
								setShowDatePicker(true);
							}}
						>
							<Text style={{ color: fields[field.field_id] ? '#000' : '#bbb' }}>
								{fields[field.field_id] || `Select ${field.name}`}
							</Text>
							<Icon name="calendar" size={20} color="#bbb" style={{ position: 'absolute', right: 10, top: 14 }} />
						</TouchableOpacity>
						{errors[field.field_id] && (
							<Text style={styles.errorText}>{errors[field.field_id]}</Text>
						)}
						<Modal
							visible={showDatePicker && selectedDateField?.field_id === field.field_id}
							transparent={true}
							animationType="slide"
						>
							<View style={styles.modalOverlay}>
								<View style={styles.modalContent}>
									<View style={styles.modalHeader}>
										<Text style={styles.modalTitle}>Select Date</Text>
									</View>
									<DateTimePicker
										value={tempDate}
										mode="date"
										display="spinner"
										onChange={handleDateChange}
										maximumDate={new Date()}
										style={styles.datePicker}
									/>
									<View style={styles.modalFooter}>
										<TouchableOpacity 
											style={[styles.modalButton, styles.cancelButton]} 
											onPress={handleCancelDate}
										>
											<Text style={styles.cancelButtonText}>Cancel</Text>
										</TouchableOpacity>
										<TouchableOpacity 
											style={[styles.modalButton, styles.confirmButton]} 
											onPress={handleConfirmDate}
										>
											<Text style={styles.confirmButtonText}>Confirm</Text>
										</TouchableOpacity>
									</View>
								</View>
							</View>
						</Modal>
					</>
				);
			case 'radio':
				return (
					<View style={styles.radioGroup}>
						{['Male', 'Female', "I'd rather not say"].map(option => (
							<RadioButton
								key={option}
								label={option}
								selected={fields[field.field_id] === option}
								onPress={() => handleFieldChange(field.field_id, option)}
							/>
						))}
					</View>
				);
			case 'telephone':
				const phoneValue = fields[field.field_id];
				const cleanedPhone = cleanPhoneNumber(phoneValue);
				
				return (
					<>
						<TextInput
							style={[styles.input, errors[field.field_id] && styles.inputError]}
							value={cleanedPhone}
							onChangeText={text => handleFieldChange(field.field_id, text)}
							placeholder="Enter Phone"
							placeholderTextColor="#bbb"
							keyboardType="phone-pad"
						/>
						{errors[field.field_id] && (
							<Text style={styles.errorText}>{errors[field.field_id]}</Text>
						)}
					</>
				);
			case 'textarea':
				return (
					<>
						<TextInput
							style={[styles.input, { height: 80, textAlignVertical: 'top' }, errors[field.field_id] && styles.inputError]}
							value={fields[field.field_id]}
							onChangeText={text => handleFieldChange(field.field_id, text)}
							placeholder={`Enter ${field.name}`}
							placeholderTextColor="#bbb"
							multiline
						/>
						{errors[field.field_id] && (
							<Text style={styles.errorText}>{errors[field.field_id]}</Text>
						)}
					</>
				);
			default:
				return null;
		}
	};

	

	// Get fields for selected tab
	const currentSection = profileData.find(s => s.group_name === selectedTab) || { fields: [] };

	//console.log(currentSection);



	return (
		<ViewLayout noMargin={true}>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={handleBack} style={styles.backButton}>
						<Icon name="chevron-left" size={24} color="#E9A23B" />
						<Text style={styles.headerText}>Back</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Edit profile</Text>
					<TouchableOpacity 
						style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
						onPress={handleSave}
						disabled={saving}
					>
						{saving ? (
							<ActivityIndicator size="small" color="#fff" />
						) : (
							<Text style={styles.saveButtonText}>Save</Text>
						)}
					</TouchableOpacity>
				</View>

				{loading && (
					<View style={styles.containerInc}>
						<ActivityIndicator size="large" color="#122b46" />
					</View>
				)}

				{/* Tabs */}
				<View style={styles.tabBar}>
					{profileData.map(group => (
						<TouchableOpacity
							key={group.group_id}
							style={[
								styles.tab, 
								selectedTab === group.group_name && styles.tabSelected,
								hasTabErrors(group.group_name) && styles.tabError
							]}
							onPress={() => setSelectedTab(group.group_name)}
						>
							<Text style={[
								styles.tabText, 
								selectedTab === group.group_name && styles.tabTextSelected,
								hasTabErrors(group.group_name) && styles.tabTextError
							]}>
								{group.group_name}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Fields */}
				<ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 40 }}>
					{currentSection.fields.map(field => (
						<View key={field.field_id} style={styles.fieldBlock}>
							<Text style={styles.label}>
								{field.name}
								{field.is_required && <Text style={{ color: 'red' }}> *</Text>}
							</Text>
							{renderField(field)}
						</View>
					))}
				</ScrollView>
			</View>
		</ViewLayout>
	);
};

const styles = StyleSheet.create({
	containerInc: {
		flex: 1,
		backgroundColor: '#fff',
		padding: 25,
	},
	container: { flex: 1, backgroundColor: '#fff', padding: 15 },
	header: {
		flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
		paddingHorizontal: 12, paddingTop: 0, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
	},
	backButton: { flexDirection: 'row', alignItems: 'center' },
	headerText: { fontSize: 16, color: '#E9A23B', marginLeft: 2 },
	headerTitle: { fontSize: 16, fontWeight: '600', color: '#222' },
	saveButton: { backgroundColor: '#E9A23B', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 16 },
	saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
	tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
	tab: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 16, marginHorizontal: 4 },
	tabSelected: { backgroundColor: '#FFE6B0' },
	tabText: { fontSize: 14, color: '#E9A23B', fontWeight: '500' },
	tabTextSelected: { color: '#E9A23B', fontWeight: '700' },
	tabError: {
		backgroundColor: '#FFE6E6',
		borderColor: '#ff3b30',
		borderWidth: 1,
	},
	tabTextError: {
		color: '#ff3b30',
	},
	form: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
	fieldBlock: { marginBottom: 18 },
	label: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 6 },
	input: {
		backgroundColor: '#F7F7F7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#eee',
	},
	radioGroup: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
	radioRow: { flexDirection: 'row', alignItems: 'center', marginRight: 18 },
	radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E9A23B', alignItems: 'center', justifyContent: 'center', marginRight: 7 },
	radioOuterSelected: { borderColor: '#E9A23B', backgroundColor: '#FFE6B0' },
	radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E9A23B' },
	radioLabel: { fontSize: 15, color: '#222' },
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: 'white',
		borderRadius: 20,
		width: '90%',
		maxWidth: 400,
		padding: 20,
	},
	modalHeader: {
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
		paddingBottom: 15,
		marginBottom: 15,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#222',
		textAlign: 'center',
	},
	datePicker: {
		height: 200,
	},
	modalFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 20,
	},
	modalButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 10,
		marginHorizontal: 5,
	},
	cancelButton: {
		backgroundColor: '#f5f5f5',
	},
	confirmButton: {
		backgroundColor: '#E9A23B',
	},
	cancelButtonText: {
		color: '#666',
		textAlign: 'center',
		fontWeight: '500',
	},
	confirmButtonText: {
		color: 'white',
		textAlign: 'center',
		fontWeight: '500',
	},
	inputError: {
		borderColor: '#ff3b30',
		borderWidth: 1,
	},
	errorText: {
		color: '#ff3b30',
		fontSize: 12,
		marginTop: 4,
		marginLeft: 4,
	},
	saveButtonDisabled: {
		opacity: 0.7,
	},
});

export default connect(mapStateToProps, mapDispatchToProps)(EditProfile);