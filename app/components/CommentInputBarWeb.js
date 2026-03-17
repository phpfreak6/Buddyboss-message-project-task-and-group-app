import { NODE_BACKEND } from '@env';
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Keyboard, Platform, ScrollView, Image, Alert, Animated, Text, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import EmojiSelector, { Categories } from 'react-native-emoji-selector';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { WebView } from 'react-native-webview';
import agent from '@/agent';
import DocumentPicker from 'react-native-document-picker';

const API_ROOT = NODE_BACKEND;

// Remove mock users
// const MOCK_USERS = [ ... ];

const CommentInputBarWeb = forwardRef(({ onSend, groupId, sending }, ref) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [users, setUsers] = useState([]);
  const webViewRef = useRef(null);
  const fileInputRef = useRef(null);
  const animatedHeight = useRef(new Animated.Value(50)).current;

  // Add useEffect to fetch users when mention search changes
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!groupId) return;
        
        const trimmedSearch = mentionSearch.trim();
        
        const response = await agent.Groups.getGroupMembersBySearch(groupId, 1, 10, trimmedSearch);
        
        if (response?.isSuccess && response?.data?.members && response.data.members.length > 0) {
          setUsers(response.data.members);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    };

    if (mentionSearch && groupId) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [mentionSearch, groupId]);

  const toggleExpand = () => {
    const toValue = isExpanded ? 50 : 200;
    Animated.spring(animatedHeight, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
    setIsExpanded(!isExpanded);
  };

  const quillHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="${API_ROOT}/quill/quill.snow.css" rel="stylesheet">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          }
          #editor { 
            height: 100%;
            font-size: 15px;
            line-height: 1.5;
          }
          .ql-container { 
            border: none !important;
            font-size: 15px;
            height: calc(100% - 10px);
          }
          .ql-toolbar {
            display: none !important;
          }
          .ql-editor {
            padding: 12px 0;
            height: 100%;
          }
          .ql-editor.ql-blank::before {
            color: #999;
            font-style: normal;
            font-size: 15px;
          }
          .ql-editor p {
            margin: 0;
            padding: 0;
          }
          .mention {
            color: #122b46;
            font-weight: 500;
            background-color: #e8f0fe;
            padding: 2px 4px;
            border-radius: 4px;
            margin: 0 2px;
          }
        </style>
      </head>
      <body>
        <div id="editor"></div>
        <script src="${API_ROOT}/quill/quill.js"></script>
        <script>
          var quill = new Quill('#editor', {
            theme: 'snow',
            placeholder: 'Write a comment...',
            modules: {
              toolbar: false,
              clipboard: {
                matchVisual: false
              }
            }
          });

          let mentionSearch = '';
          let mentionStartIndex = -1;

          quill.on('text-change', function(delta, oldDelta, source) {
            if (source === 'user') {
              const text = quill.getText();
              const lastAtSymbol = text.lastIndexOf('@');
              
              if (lastAtSymbol !== -1) {
                const textAfterAt = text.slice(lastAtSymbol + 1);
                const spaceIndex = textAfterAt.indexOf(' ');
                
                if (spaceIndex === -1) {
                  mentionSearch = textAfterAt;
                  mentionStartIndex = lastAtSymbol;
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mention-search',
                    search: mentionSearch,
                    index: mentionStartIndex
                  }));
                } else {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mention-search',
                    search: '',
                    index: -1
                  }));
                }
              } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'mention-search',
                  search: '',
                  index: -1
                }));
              }
            }

            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'content-change',
              content: quill.root.innerHTML
            }));
          });

          function insertMention(user) {
            if (mentionStartIndex !== -1) {
              quill.deleteText(mentionStartIndex, mentionSearch.length + 1);
              const mentionHtml = '<a class="bp-suggestions-mention" data-bb-hp-profile="' + user.id + '" href="{{mention_user_id_' + user.id + '}}" rel="nofollow" style="background-color: #e8f0fe; color: #122b46; padding: 2px 4px; border-radius: 4px; display: inline-block;">@' + user.user_login + '</a>';
              quill.clipboard.dangerouslyPasteHTML(mentionStartIndex, mentionHtml);
              quill.insertText(mentionStartIndex + user.user_login.length + 4, ' ', { 'inline': true });
              quill.setSelection(mentionStartIndex + user.user_login.length + 5);
              mentionStartIndex = -1;
              mentionSearch = '';
            }
          }

          window.insertMention = insertMention;
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    if (ref) {
      ref.current = {
        focus: () => {
          webViewRef.current?.injectJavaScript(`
            document.querySelector('.ql-editor').focus();
            true;
          `);
        }
      };
    }
  }, [ref]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'content-change') {
        setContent(data.content);
      } else if (data.type === 'mention-search') {
        setMentionSearch(data.search);
        if (data.index !== -1) {
          setShowMentions(true);
        } else {
          setShowMentions(false);
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    if (content.length === 0 && selectedImages.length === 0 && selectedVideos.length === 0 && selectedDocuments.length === 0) {
      setIsFocused(false);
    }
  };

  const handleSend = () => {
    if (content.trim() === '' && selectedImages.length === 0 && selectedVideos.length === 0 && selectedDocuments.length === 0) {
      Alert.alert('Please enter a message or select a file.');
      return;
    }

    const dataToSend = {
      message: content.trim(),
      images: selectedImages,
      videos: selectedVideos,
      documents: selectedDocuments,
    };

    onSend(dataToSend);
    setContent('');
    webViewRef.current?.injectJavaScript(`
      quill.setContents([]);
      true;
    `);
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
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.onchange = (e) => handleFileSelect(e, 'document');
      input.click();
    } else {
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

  const handleFileSelect = (event, type) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          uri: e.target.result,
          type: file.type,
          name: file.name,
          size: file.size
        };

        if (type === 'image') {
          setSelectedImages(prev => [...prev, fileData]);
        } else if (type === 'video') {
          setSelectedVideos(prev => [...prev, fileData]);
        } else {
          setSelectedDocuments(prev => [...prev, fileData]);
        }
      };
      reader.readAsDataURL(file);
    });
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
    webViewRef.current?.injectJavaScript(`
      (function() {
        try {
          const range = quill.getSelection();
          if (range) {
            quill.insertText(range.index, '${emoji} ', { 'emoji': true });
            quill.setSelection(range.index + 2, 0);
          } else {
            const length = quill.getLength();
            quill.insertText(length - 1, '${emoji} ', { 'emoji': true });
            quill.setSelection(length + 1, 0);
          }
          quill.focus();
          return true;
        } catch (error) {
          console.error('Error inserting emoji:', error);
          return false;
        }
      })();
    `);
    setShowEmojiPicker(false);
  };

  const handleMentionSelect = (user) => {
    webViewRef.current?.injectJavaScript(`
      window.insertMention(${JSON.stringify({
        id: user.ID,
        name: user.display_name,
        user_login: user.user_login,
        avatar: user.image
      })});
      quill.insertText(quill.getSelection().index, ' ');
      quill.setSelection(quill.getSelection().index + 1, 0);
      true;
    `);
    setShowMentions(false);
  };

  const filteredUsers = users;

  const hasMedia = selectedImages.length > 0 || selectedVideos.length > 0 || selectedDocuments.length > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.inputBar, hasMedia && styles.inputBarWithMedia]}>
        <View style={styles.editorContainer}>
          {showMentions && filteredUsers.length > 0 && (
            <View style={styles.mentionsContainer}>
              <ScrollView style={styles.mentionsList}>
                {filteredUsers.map((user, index) => (
                  <TouchableOpacity
                    key={`mention-${user.ID || index}`}
                    style={styles.mentionItem}
                    onPress={() => handleMentionSelect(user)}
                  >
                    <Image 
                      source={{ 
                        uri: user.image || 'https://i.pravatar.cc/150?u=' + (user.ID || index)
                      }} 
                      style={styles.mentionAvatar} 
                    />
                    <Text style={styles.mentionName}>
                      {user.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          <Animated.View style={[styles.webViewContainer, { height: animatedHeight }]}>
            <WebView
              ref={webViewRef}
              source={{ html: quillHtml }}
              style={styles.webView}
              onMessage={handleMessage}
              onFocus={handleFocus}
              onBlur={handleBlur}
              scrollEnabled={true}
              keyboardDisplayRequiresUserAction={false}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            />
          </Animated.View>
          <TouchableOpacity 
            style={styles.expandButton} 
            onPress={toggleExpand}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon 
              name={isExpanded ? "chevron-down" : "chevron-up"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
        
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
          <TouchableOpacity 
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesomeIcon name="send" size={16} color="#fff" />
            )}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderColor: '#e8e8e8',
  },
  editorContainer: {
    position: 'relative',
    marginBottom: 8,
    zIndex: 1,
  },
  webViewContainer: {
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  expandButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  inputBarWithMedia: {
    paddingBottom: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  iconBtn: {
    marginHorizontal: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  sendBtn: {
    backgroundColor: '#122b46',
    borderRadius: 24,
    padding: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#122b46',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    width: 44,
    height: 44,
  },
  sendBtnDisabled: {
    backgroundColor: '#8a9cb3',
    shadowOpacity: 0.1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  mediaPreviewContainer: {
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  mediaItem: {
    marginRight: 12,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emojiPickerContainer: {
    height: 250,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  mentionsContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -4 },
    elevation: 4,
    maxHeight: 200,
    zIndex: 9999,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    height: 200,
  },
  mentionsList: {
    maxHeight: 200,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mentionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  mentionName: {
    fontSize: 15,
    color: '#333',
  },
});

export default CommentInputBarWeb; 