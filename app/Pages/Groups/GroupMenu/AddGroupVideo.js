import { NODE_BACKEND } from '@env';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_ROOT = NODE_BACKEND;

const AddGroupVideo = ({ navigation, route }) => {
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const { groupId } = route.params;

  const handleVideoPicker = () => {
    const options = {
      mediaType: 'video',
      includeBase64: false,
      maxDuration: 300, // 5 minutes max
      quality: 1,
      selectionLimit: 0, // 0 means unlimited
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick videos');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        setSelectedVideos([...selectedVideos, ...response.assets]);
      }
    });
  };

  const handleCamera = () => {
    const options = {
      mediaType: 'video',
      includeBase64: false,
      maxDuration: 300, // 5 minutes max
      quality: 1,
    };

    ImagePicker.launchCamera(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', 'Failed to record video');
        return;
      }

      if (response.assets && response.assets[0]) {
        setSelectedVideos([...selectedVideos, response.assets[0]]);
      }
    });
  };

  const removeVideo = (index) => {
    const newVideos = [...selectedVideos];
    newVideos.splice(index, 1);
    setSelectedVideos(newVideos);
  };

  const handleUpload = async () => {
    if (selectedVideos.length === 0) {
      Alert.alert('Error', 'Please select at least one video');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      // Append all videos
      selectedVideos.forEach((video, index) => {
        formData.append('videos', {
          uri: video.uri,
          type: video.type,
          name: video.fileName,
        });
      });

      // Append caption if provided
      if(caption){
        formData.append('content', caption);
      }else{
        formData.append('content', ' ');
      }

      let token = await AsyncStorage.getItem('jwt');
      const url = `/groups/createGroupPost/${groupId}`;

      const response = await fetch(`${API_ROOT}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const responseData = await response.json();

      if (responseData?.data?.activity_id) {
        Alert.alert('Success', 'Videos uploaded successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', responseData?.message || 'Failed to upload videos. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading videos:', error);
      Alert.alert('Error', 'An error occurred while uploading the videos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Videos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {selectedVideos.length > 0 ? (
          <View style={styles.selectedVideosContainer}>
            {selectedVideos.map((video, index) => (
              <View key={index} style={styles.videoPreviewContainer}>
                <View style={styles.videoPreview}>
                  <Image
                    source={{ uri: video.uri }}
                    style={styles.videoThumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.videoOverlay}>
                    <Icon name="play-circle" size={48} color="#fff" />
                  </View>
                  <TouchableOpacity
                    style={styles.removeVideoButton}
                    onPress={() => removeVideo(index)}
                  >
                    <Icon name="close-circle" size={24} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={handleVideoPicker}
            >
              <Icon name="video-plus" size={24} color="#122b46" />
              <Text style={styles.addMoreText}>Add More Videos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.videoPickerContainer}>
            <TouchableOpacity
              style={styles.videoPickerButton}
              onPress={handleVideoPicker}
            >
              <Icon name="video-plus" size={48} color="#122b46" />
              <Text style={styles.videoPickerText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.videoPickerButton}
              onPress={handleCamera}
            >
              <Icon name="video" size={48} color="#122b46" />
              <Text style={styles.videoPickerText}>Record Video</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write something about your videos, to be shown on your timeline"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />
          <Text style={styles.characterCount}>{caption.length}/500</Text>
        </View>

        <TouchableOpacity
          style={[styles.uploadButton, (selectedVideos.length === 0 || loading) && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={selectedVideos.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload Videos</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    backgroundColor: '#122b46',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  videoPickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    minHeight: 300,
  },
  videoPickerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 24,
    width: '100%',
  },
  videoPickerText: {
    marginTop: 8,
    fontSize: 16,
    color: '#122b46',
  },
  selectedVideosContainer: {
    marginBottom: 24,
  },
  videoPreviewContainer: {
    marginBottom: 16,
  },
  videoPreview: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  removeVideoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  addMoreText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#122b46',
  },
  captionContainer: {
    marginTop: 24,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    color: '#666',
    marginTop: 4,
  },
  uploadButton: {
    backgroundColor: '#122b46',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddGroupVideo; 