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
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_ROOT = NODE_BACKEND;

const AddGroupPhoto = ({ navigation, route }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const { groupId } = route.params;

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
      selectionLimit: 0, // 0 means unlimited
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick images');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        setSelectedImages(prevImages => [...prevImages, ...response.assets]);
      }
    });
  };

  const handleCamera = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    ImagePicker.launchCamera(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', 'Failed to take photo');
        return;
      }

      if (response.assets && response.assets[0]) {
        setSelectedImages(prevImages => [...prevImages, response.assets[0]]);
      }
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('Error', 'Please select at least one image');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      // Append images
      selectedImages.forEach(image => {
        formData.append('images', {
          uri: image.uri,
          type: image.type,
          name: image.fileName,
        });
      });

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
        Alert.alert('Success', 'Photos uploaded successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', responseData?.message || 'Failed to upload photos. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Error', 'An error occurred while uploading the photos.');
    } finally {
      setLoading(false);
    }
  };

  const renderSelectedImage = ({ item, index }) => (
    <View style={styles.imagePreviewItem}>
      <Image
        source={{ uri: item.uri }}
        style={styles.imagePreview}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={() => removeImage(index)}
      >
        <Icon name="close-circle" size={24} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Photos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {selectedImages.length > 0 ? (
          <View style={styles.selectedImagesContainer}>
            <FlatList
              data={selectedImages}
              renderItem={renderSelectedImage}
              keyExtractor={(_, index) => index.toString()}
              numColumns={3}
              scrollEnabled={false}
            />
            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={handleImagePicker}
            >
              <Icon name="image-plus" size={24} color="#122b46" />
              <Text style={styles.addMoreText}>Add More Photos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePickerContainer}>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={handleImagePicker}
            >
              <Icon name="image-plus" size={48} color="#122b46" />
              <Text style={styles.imagePickerText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={handleCamera}
            >
              <Icon name="camera" size={48} color="#122b46" />
              <Text style={styles.imagePickerText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write something about your photos, to be shown on your timeline"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />
          <Text style={styles.characterCount}>{caption.length}/500</Text>
        </View>

        <TouchableOpacity
          style={[styles.uploadButton, (selectedImages.length === 0 || loading) && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={selectedImages.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>
              Upload {selectedImages.length} Photo{selectedImages.length !== 1 ? 's' : ''}
            </Text>
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
  imagePickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    minHeight: 300,
  },
  imagePickerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 24,
    width: '100%',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 16,
    color: '#122b46',
  },
  selectedImagesContainer: {
    marginBottom: 24,
  },
  imagePreviewItem: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 4,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
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

export default AddGroupPhoto; 