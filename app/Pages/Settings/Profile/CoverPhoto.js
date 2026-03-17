import { NODE_BACKEND } from '@env';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform, Alert } from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ViewLayout } from '@/Pages/Layouts';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import agent from '@/agent';

import { APP_LOAD } from '@/constants';

const mapStateToProps = state => ({
    ...state,
    currentUser: state.common.currentUser,
});
const mapDispatchToProps = dispatch => ({
	onLoad: (payload, token) => dispatch({ type: APP_LOAD, payload, token, skipTracking: true }),
});

const API_ROOT = NODE_BACKEND;

const CoverPhoto = ({ navigation, currentUser, onLoad }) => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const pickImage = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                includeBase64: false,
                maxHeight: 400,
                maxWidth: 1600,
                quality: 0.8,
            });

            if (result.assets && result.assets[0]) {
                await uploadCoverPhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            alert('Failed to pick image. Please try again.');
        }
    };

    const uploadCoverPhoto = async (uri) => {
        try {
            setUploading(true);
            
            // Get token from AsyncStorage
            const token = await AsyncStorage.getItem('jwt');
            
            // Create form data
            const formData = new FormData();
            formData.append('cover_photo', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                type: 'image/jpeg',
                name: 'cover_photo.jpg',
            });

            // Upload to server using fetch
            const response = await fetch(`${API_ROOT}/users/updateCoverPhoto`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();
            
            if (data && data.isSuccess && data.data && data.data.file_url) {
                var payload = await agent.Auth.current();
                onLoad(payload, token);
                navigation.navigate('Profile', { refresh: true });
            } else {
                alert('Failed to upload profile photo. Please try again.');
            }
        } catch (error) {
            console.error('Error uploading cover photo:', error);
            alert('An error occurred while uploading. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Cover Photo',
            'Are you sure you want to delete your cover photo?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: deleteCoverPhoto,
                },
            ],
            { cancelable: true }
        );
    };

    const deleteCoverPhoto = async () => {
        try {
            setDeleting(true);
            const response = await agent.Auth.deleteCoverPhoto({delete: true});
            
            if (response && response.isSuccess) {
                const token = await AsyncStorage.getItem('jwt');
                var payload = await agent.Auth.current();
                onLoad(payload, token);
                navigation.navigate('Profile', { refresh: true });
            } else {
                alert('Failed to delete cover photo. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting cover photo:', error);
            alert('An error occurred while deleting. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <ViewLayout noMargin={true}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="chevron-left" size={24} color="#000" />
                        <Text style={styles.headerText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cover Photo</Text>
                    <View style={{ width: 50 }} />
                </View>

                <View style={styles.content}>
                    <View style={styles.coverContainer}>
                        <Image 
                            source={currentUser.user?.cover_image 
                                ? { uri: currentUser.user.cover_image } 
                                : require('@/assets/images/63230be995da2-bp-cover-image.png')
                            } 
                            style={styles.coverImage}
                        />
                        {(uploading || deleting) && (
                            <View style={styles.uploadingOverlay}>
                                <ActivityIndicator size="large" color="#fff" />
                                <Text style={styles.uploadingText}>
                                    {uploading ? 'Uploading...' : 'Deleting...'}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={styles.uploadButton}
                            onPress={pickImage}
                            disabled={uploading || deleting}
                        >
                            <Icon name="camera" size={24} color="#fff" />
                            <Text style={styles.uploadButtonText}>
                                {uploading ? 'Uploading...' : 'Change Cover Photo'}
                            </Text>
                        </TouchableOpacity>

                        {currentUser.user?.cover_image && (
                            <TouchableOpacity 
                                style={styles.deleteButton}
                                onPress={handleDelete}
                                disabled={uploading || deleting}
                            >
                                <Icon name="delete" size={24} color="#fff" />
                                <Text style={styles.deleteButtonText}>
                                    {deleting ? 'Deleting...' : 'Delete Cover Photo'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={styles.helpText}>
                        Recommended size: 1600 x 400 pixels
                    </Text>
                </View>
            </View>
        </ViewLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 16,
        marginLeft: 4,
        color: '#000',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    coverContainer: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
    },
    coverImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingText: {
        color: '#fff',
        marginTop: 8,
        fontSize: 16,
    },
    buttonContainer: {
        gap: 12,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E9A23B',
        paddingVertical: 12,
        borderRadius: 8,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 8,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF3B30',
        paddingVertical: 12,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 8,
    },
    helpText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 16,
    },
});

export default connect(mapStateToProps,mapDispatchToProps)(CoverPhoto); 