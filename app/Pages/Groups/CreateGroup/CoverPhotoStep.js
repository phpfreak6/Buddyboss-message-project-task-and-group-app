import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import agent from '@/agent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NODE_BACKEND } from '@env';
import { useNavigation } from '@react-navigation/native';

const API_ROOT = NODE_BACKEND;

const CoverPhotoStep = ({ groupId, onBack, onNext, isDirectAccess }) => {
  const navigation = useNavigation();
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPhotoUri, setCoverPhotoUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch initial data if editing an existing group
  useEffect(() => {
    const fetchGroupCoverPhoto = async () => {
      if (groupId) {
        try {
          setLoading(true);
          const response = await agent.Groups.getdetails(groupId);
          if (response?.data?.group?.coverPhoto) {
            setCoverPhoto(response.data.group.coverPhoto);
          } else {
            console.log('No cover photo found for this group yet.');
          }
        } catch (error) {
          console.error('Error fetching group cover photo:', error);
          Alert.alert('Error', 'Failed to fetch group cover photo.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchGroupCoverPhoto();
  }, [groupId]);

  const handleImagePick = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 900,
      maxWidth: 1600,
      quality: 0.8,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to pick image.');
      } else if (response.assets && response.assets[0]) {
        const selectedPhotoUri = response.assets[0].uri;
        console.log('Selected photo URI:', selectedPhotoUri);
        setCoverPhoto(selectedPhotoUri);
        setCoverPhotoUri(selectedPhotoUri);
      }
    });
  };

  const handleSaveCoverPhoto = async () => {
    if (!groupId) {
      Alert.alert('Error', 'Group ID is not available to save cover photo.');
      return;
    }
    if (!coverPhotoUri) {
      if (isDirectAccess) {
        return;
      } else {
        onNext(groupId);
      }
      return;
    }

    try {
      setLoading(true);
      
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('jwt');
      
      // Create form data
      const formData = new FormData();
      formData.append('cover_image', {
        uri: Platform.OS === 'ios' ? coverPhoto.replace('file://', '') : coverPhoto,
        type: 'image/jpeg',
        name: 'cover_photo.jpg',
      });

      // Upload to server using fetch
      const response = await fetch(`${API_ROOT}/groups/${groupId}/updateGroupCoverPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      console.log('Upload response:', data);
      
      if (data && data.isSuccess && data.data && data.data.file_url) {
        if (isDirectAccess) {
          return;
        } else {
          onNext(groupId);
        }
      } else {
        Alert.alert('Error', 'Failed to save group cover photo. Please try again.');
      }

    } catch (error) {
      console.error('Error saving group cover photo:', error);
      Alert.alert('Error', 'Failed to save group cover photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoverPhoto = async () => {
    if (!groupId) {
      Alert.alert('Error', 'Group ID is not available to remove cover photo.');
      return;
    }
    if (!coverPhoto) {
      Alert.alert('Info', 'No cover photo to remove.');
      return;
    }

    // Add confirmation prompt
    Alert.alert(
      'Remove Cover Photo',
      'Are you sure you want to remove this cover photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await agent.Groups.removeGroupCoverPhoto(groupId, { delete: true });
              
              if (response?.isSuccess && response.isSuccess == true) {
                setCoverPhoto(null);
              } else {
                Alert.alert('Error', 'Failed to remove group cover photo.');
              }
            } catch (error) {
              console.error('Error removing group cover photo:', error);
              Alert.alert('Error', 'Failed to remove group cover photo.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleBackPress = () => {
    if (isDirectAccess) {
      navigation.goBack();
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButtonBack} onPress={handleBackPress}>
          <Icon name="arrow-left" size={22} color="#122b46" />
          <Text style={styles.navBackButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepHeadingTop}>Cover Photo</Text>
        <TouchableOpacity style={styles.navButton} onPress={handleSaveCoverPhoto} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.navButtonText}>{isDirectAccess ? 'Save' : 'Next'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.stepContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#6B46C1" />
        ) : (
          <>

            <View style={styles.photoContainer}>
              {coverPhoto ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: coverPhoto }} style={styles.preview} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveCoverPhoto}
                  >
                    <Icon name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <Icon name="image-plus" size={48} color="#666" />
                  <Text style={styles.placeholderText}>No cover photo selected</Text>
                </View>
              )}

              <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
                <Icon name="upload" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload Cover Photo</Text>
              </TouchableOpacity>
            </View>

           
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  navButtonBack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#122b46',
  },
  navButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    marginHorizontal: 4,
  },
  stepContent: {
    padding: 16,
    flex: 1,
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stepHeadingTop: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 16,
    width: '100%',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  placeholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#122b46',
    padding: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  guidelines: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tips: {
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  navBackButtonText: {
    fontSize: 15,
    color: '#122b46',
    fontWeight: '500',
    marginHorizontal: 4,
  },
});

export default CoverPhotoStep; 