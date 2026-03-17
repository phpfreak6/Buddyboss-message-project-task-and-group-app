import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Text,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
let DocumentPicker;
if (Platform.OS !== 'web') {
  DocumentPicker = require('react-native-document-picker');
}

import EmojiSelector, { Categories } from 'react-native-emoji-selector';


const MessageInput = ({
  isExpanded,
  setIsExpanded,
  message,
  handleMessage,
  handleSendMessage,
  setShowKeyword,
  messageInputFrom,
  replyingToMessage,
  onCancelReply,
  keyboardHeight,
  setKeyboardHeight,
  onMediaChange
}) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const inputRef = useRef(null);

  // Calculate media preview height (80px for the container + 5px margin top + 5px margin bottom)
  const hasMedia = selectedImages.length > 0 || selectedVideos.length > 0 || selectedDocuments.length > 0;
  const mediaPreviewHeight = hasMedia ? 90 : 0; // 70px item height + 10px margin vertical + 10px padding

  useEffect(() => {
    const timer = setTimeout(() => {
      //inputRef.current?.focus();
    }, 500); // Delay focus to avoid race condition

    return () => clearTimeout(timer);
  }, []);

  // Notify parent when media changes
  useEffect(() => {
    if (onMediaChange) {
      onMediaChange(hasMedia);
    }
  }, [hasMedia, onMediaChange]);

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
   // Select Video
   const handleVideoPick = () => {
    launchImageLibrary(
      { mediaType: 'video', selectionLimit: 0 },
      (response) => {
        if (response.didCancel || response.error) return;
        setSelectedVideos((prev) => [...prev, ...response.assets]);
      }
    );
  };

  // Select Document
  const handleDocumentPick = async () => {
    if (Platform.OS === 'web') {
    }else{
      try {
        const res = await DocumentPicker.pick({
          type: [DocumentPicker.types.allFiles],
        });
        console.log('Document picked:', res);
        setSelectedDocuments((prev) => [...prev, res]);
      } catch (err) {
        if (DocumentPicker.isCancel(err)) {
          console.log('User cancelled document picker');
        } else {
          console.error('DocumentPicker Error: ', err);
        }
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
      console.log('Selected images: ', newImages);
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

  const handleDeleteImage = (uri) => {
    setSelectedImages((prevImages) => prevImages.filter((image) => image.uri !== uri));
  };

  const handleSend = () => {
    if (message.trim() === '' && selectedImages.length === 0 && selectedVideos.length === 0 && selectedDocuments.length === 0) {
      Alert.alert('Please enter a message or select a file.');
      return;
    }

    

    const dataToSend = {
      message: message.trim(),
      images: selectedImages,
      videos: selectedVideos,
      documents: selectedDocuments,
    };

    handleSendMessage(dataToSend);
    handleMessage('');
    setSelectedImages([]);
    setSelectedVideos([]);
    setSelectedDocuments([]);
    setShowEmojiPicker(false);
    Keyboard.dismiss();
  };

  const handleEmojiSelect = (emoji) => {
   // console.log(emoji)
    handleMessage(message + emoji);
    setShowEmojiPicker(false);
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ 
        position: 'absolute', 
        bottom: Platform.OS === 'android' ? keyboardHeight : 0, 
        left: 0, 
        right: 0
      }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? (messageInputFrom === "NewMessage" ? 80 : 35) : 0}
      enabled={Platform.OS === 'ios'}
    >
      <View style={[styles.MaininputContainer, { 
        paddingBottom: Platform.OS === 'ios' 
          ? (messageInputFrom === "NewMessage" ? 20 : 15) 
          : (keyboardHeight > 0 ? 10 : 0)
      }]}>
        {/* Reply Preview Banner */}
        {replyingToMessage && (
          <View style={styles.replyPreviewBanner}>
            <View style={styles.replyPreviewBannerContent}>
              <View style={styles.replyPreviewBannerLeft}>
                <View style={styles.replyPreviewLine} />
                <View style={styles.replyPreviewInfo}>
                  <Text style={styles.replyPreviewLabel}>
                    Replying to {replyingToMessage.userData?.display_name || 'Unknown User'}
                  </Text>
                  <Text style={styles.replyPreviewText} numberOfLines={1}>
                    {replyingToMessage.message ? replyingToMessage.message.replace(/<[^>]*>/g, '').substring(0, 80) : 'Media'}
                    {replyingToMessage.message && replyingToMessage.message.replace(/<[^>]*>/g, '').length > 80 ? '...' : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onCancelReply}
                style={styles.replyPreviewCancel}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View >
          <View style={styles.inputContainer}>
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.MessageInput, { height: isExpanded ? 360 : 60 }]}
                placeholder="Type your message..."
                value={message}
                onChangeText={handleMessage}
                placeholderTextColor="#999"
                multiline={true}
                ref={inputRef}
              />
              <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                style={styles.iconContainer2}
              >
                <Icon
                  name={isExpanded ? 'arrow-collapse' : 'arrow-expand'}
                  size={24}
                  color="#ccc"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Preview */}
          {hasMedia && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewContainer}>
              {selectedImages.map((asset, index) => (
              <View
                key={index}
                style={styles.mediaItem}
                
              >
                <Image
                  source={{ uri: asset.uri }}
                  style={{ width: 70, height: 70 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => handleDelete(asset.uri, 'image')}
                  style={{ position: 'absolute', top: 0, right: 0 }}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}

            {selectedVideos.map((vid, index) => (
              <View key={index} style={styles.mediaItem}>
                <Icon name="video" size={70} color="green" />
                <TouchableOpacity onPress={() => handleDelete(vid.uri, 'video')} style={{ position: 'absolute', top: 0, right: 0 }}>
                  <MaterialCommunityIcons name="delete" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}

            {selectedDocuments.map((doc, index) => (
              <View key={index} style={styles.mediaItem}>
                <Icon name="file-document" size={70} color="blue" />
                <TouchableOpacity onPress={() => handleDelete(doc.uri, 'document')} style={{ position: 'absolute', top: 0, right: 0 }}>
                  <MaterialCommunityIcons name="delete" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          )}

          {/* Upload + Emoji Buttons */}
          <View style={styles.uploadOptionsContainer}>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={handleImagePick}>
                <Icon name="image" size={20} color="#122b46" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleVideoPick}>
                <Icon name="video" size={20} color="#122b46" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDocumentPick}>
                <Icon name="file-document" size={20} color="#122b46" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
                <Icon name="emoticon-outline" size={20} color="#122b46" />
              </TouchableOpacity>

              {/* Hidden icons (future features) */}
              <Icon name="video" size={24} color="#6200ee" style={{ display: 'none' }} />
              <Icon
                name="file-document"
                size={24}
                color="#6200ee"
                style={{ display: 'none' }}
              />
            </View>

            <TouchableOpacity onPress={handleSend} style={styles.submitButton}>
              <FontAwesomeIcon name="send-o" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          
        </View>
        <View>
          {showEmojiPicker && (
            <>
              <TouchableOpacity
                style={styles.emojiPickerOverlay}
                activeOpacity={1}
                onPress={() => setShowEmojiPicker(false)}
              />
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
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
    
  );
};

const styles = StyleSheet.create({
  MessageInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopColor: '#e1e1e1',
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingLeft: 10,
    marginBottom: 0,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  selectedUsersContainer: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  selectedUserText: {
    fontSize: 14,
    marginRight: 4,
  },
  removeIcon: {
    fontSize: 18,
    color: '#666',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactMessage: {
    fontSize: 14,
    color: '#999',
  },
  selectedContactItem: {
    backgroundColor: '#e0f7fa',
  },
  selectedUsersDisplay: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 16,
  },
  selectedUsersText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedUsersNames: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
  },
  iconContainer: {
    width: '70%',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  uploadOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    marginHorizontal: 0,
    backgroundColor: '#fff',
  },
  uploadButton: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 12,
    color: '#6200ee',
  },
  submitButton: {
    padding: 10,
    backgroundColor: '#122b46',
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  iconContainer2: {
    position: 'absolute',
    right: 20,
    top: 18,
  },
  emojiPickerOverlay: {
    position: 'absolute',
    top: -Dimensions.get('window').height,
    left: 0,
    right: 0,
    bottom: 136,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 9,
  },
  emojiPickerContainer: {
    position: 'absolute',
    bottom: 136,
    height: 500,
    overflow: "scroll",
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 10,
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    minHeight: 80,
    paddingHorizontal: 10,
  },
  mediaItem: {
    position: 'relative',
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ccc"
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  MaininputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  replyPreviewBanner: {
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  replyPreviewBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyPreviewBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  replyPreviewLine: {
    width: 3,
    height: 40,
    backgroundColor: '#4fc3f7',
    borderRadius: 2,
    marginRight: 8,
  },
  replyPreviewInfo: {
    flex: 1,
  },
  replyPreviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4fc3f7',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 12,
    color: '#666',
  },
  replyPreviewCancel: {
    padding: 4,
  },
});

export default MessageInput;
