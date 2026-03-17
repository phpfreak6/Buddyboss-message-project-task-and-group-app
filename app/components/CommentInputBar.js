import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard, Platform, ScrollView, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import EmojiSelector, { Categories } from 'react-native-emoji-selector';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
let DocumentPicker;
if (Platform.OS !== 'web') {
  DocumentPicker = require('react-native-document-picker');
}

const CommentInputBar = forwardRef(({ onSend }, ref) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (ref) {
      ref.current = {
        focus: () => {
          inputRef.current?.focus();
        }
      };
    }
  }, [ref]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    if (text.length === 0 && selectedImages.length === 0 && selectedVideos.length === 0 && selectedDocuments.length === 0) {
      setIsFocused(false);
    }
  };

  const handleSend = () => {
    if (text.trim() === '' && selectedImages.length === 0 && selectedVideos.length === 0 && selectedDocuments.length === 0) {
      Alert.alert('Please enter a message or select a file.');
      return;
    }

    const dataToSend = {
      message: text.trim(),
      images: selectedImages,
      videos: selectedVideos,
      documents: selectedDocuments,
    };

    onSend(dataToSend);
    setText('');
    setSelectedImages([]);
    setSelectedVideos([]);
    setSelectedDocuments([]);
    setShowEmojiPicker(false);
    Keyboard.dismiss();
  };

  const handleImagePick = () => {
    Alert.alert(
      'Select Image Source',
      'Choose an option to select an image',
      [
        {
          text: 'Camera',
          onPress: () =>
            launchCamera({ mediaType: 'photo', includeBase64: false }, handleResponse),
        },
        {
          text: 'Gallery',
          onPress: () =>
            launchImageLibrary(
              { mediaType: 'photo', includeBase64: false, selectionLimit: 0 },
              handleResponse
            ),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleVideoPick = () => {
    launchImageLibrary(
      { mediaType: 'video', selectionLimit: 0 },
      (response) => {
        if (response.didCancel || response.error) return;
        setSelectedVideos((prev) => [...prev, ...response.assets]);
      }
    );
  };

  const handleDocumentPick = async () => {
    if (Platform.OS === 'web') {
      return;
    }
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      setSelectedDocuments((prev) => [...prev, res]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled document picker');
      } else {
        console.error('DocumentPicker Error: ', err);
      }
    }
  };

  const handleResponse = (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.error) {
      console.log('ImagePicker Error: ', response.error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } else if (!response.assets || !Array.isArray(response.assets)) {
      console.log('Invalid response format:', response);
      Alert.alert('Error', 'Invalid response from image picker. Please try again.');
    } else {
      const newImages = response.assets.map((asset) => asset);
      setSelectedImages((prevImages) => [...prevImages, ...newImages]);
    }
  };

  const handleDelete = (uri, type) => {
    if (type === 'image') {
      setSelectedImages((prev) => prev.filter((img) => img.uri !== uri));
    } else if (type === 'video') {
      setSelectedVideos((prev) => prev.filter((vid) => vid.uri !== uri));
    } else if (type === 'document') {
      setSelectedDocuments((prev) => prev.filter((doc) => doc.uri !== uri));
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText(text + emoji);
  };

  const hasMedia = selectedImages.length > 0 || selectedVideos.length > 0 || selectedDocuments.length > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.inputBar, hasMedia && styles.inputBarWithMedia]}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Write a comment..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline
        />
        
        {hasMedia && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewContainer}>
            {selectedImages.map((asset, index) => (
              <View key={index} style={styles.mediaItem}>
                <Image
                  source={{ uri: asset.uri }}
                  style={{ width: 70, height: 70 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => handleDelete(asset.uri, 'image')}
                  style={{ position: 'absolute', top: 0, right: 0 }}
                >
                  <Icon name="delete" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}

            {selectedVideos.map((vid, index) => (
              <View key={index} style={styles.mediaItem}>
                <Icon name="video" size={70} color="green" />
                <TouchableOpacity onPress={() => handleDelete(vid.uri, 'video')} style={{ position: 'absolute', top: 0, right: 0 }}>
                  <Icon name="delete" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}

            {selectedDocuments.map((doc, index) => (
              <View key={index} style={styles.mediaItem}>
                <Icon name="file-document" size={70} color="blue" />
                <TouchableOpacity onPress={() => handleDelete(doc.uri, 'document')} style={{ position: 'absolute', top: 0, right: 0 }}>
                  <Icon name="delete" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.bottomRow}>
          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleImagePick}>
              <Icon name="image" size={22} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleVideoPick}>
              <Icon name="video" size={22} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleDocumentPick}>
              <Icon name="file-document" size={22} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Icon name="emoticon-outline" size={22} color="#888" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <FontAwesomeIcon name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {showEmojiPicker && (
        <View style={styles.emojiPickerContainer}>
          <EmojiSelector
            onEmojiSelected={handleEmojiSelect}
            showSearchBar={false}
            showSectionTitles={false}
            emojiSize={30}
            showPreview={true}
            columns={8}
            category={Categories.emotion}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inputBar: {
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputBarWithMedia: {
    paddingBottom: 8,
  },
  textInput: {
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    color: '#222',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    marginHorizontal: 2,
    padding: 4,
  },
  sendBtn: {
    backgroundColor: '#122b46',
    borderRadius: 20,
    padding: 10,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F5A623',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  mediaPreviewContainer: {
    marginVertical: 8,
  },
  mediaItem: {
    marginRight: 10,
    position: 'relative',
  },
  emojiPickerContainer: {
    height: 250,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
});

export default CommentInputBar; 