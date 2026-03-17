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
  FlatList,
  Text,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import agent from '@/agent';
import { WebView } from 'react-native-webview';

let DocumentPicker;
if (Platform.OS !== 'web') {
  DocumentPicker = require('react-native-document-picker');
}

import EmojiSelector, { Categories } from 'react-native-emoji-selector';

const EDITOR_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
        body {
            margin: 0;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: #333;
            background-color: transparent;
            height: 100%;
            overflow: hidden;
        }
        #editor {
            min-height: 100px;
            max-height: 180px;
            outline: none;
            -webkit-user-select: text;
            user-select: text;
            background-color: transparent;
            overflow-y: scroll;
            padding-right: 8px;
            scrollbar-width: thin;
            scrollbar-color: #888 #f1f1f1;
        }
        #editor::-webkit-scrollbar {
            width: 8px;
            display: block;
        }
        #editor::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        #editor::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
            border: 1px solid #666;
        }
        #editor::-webkit-scrollbar-thumb:hover {
            background: #666;
        }
        #editor::-webkit-scrollbar-corner {
            background: #f1f1f1;
        }
        #editor:empty:before {
            content: "What's on your mind?";
            color: #999;
        }
    </style>
</head>
<body>
    <div id="editor" contenteditable="true" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></div>
    <script>
        const editor = document.getElementById('editor');
        
        editor.addEventListener('input', function() {
            window.ReactNativeWebView.postMessage(editor.innerHTML);
        });

        editor.addEventListener('keydown', function(e) {
            if (e.key === '@') {
                window.ReactNativeWebView.postMessage('@');
            }
        });

        editor.addEventListener('paste', function(e) {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });
    </script>
</body>
</html>
`;

const PostInput = ({
  content,
  setContent,
  handleCreatePost,
  loading,
  groupId
}) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editorHeight, setEditorHeight] = useState(600);
  const [plainText, setPlainText] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const inputRef = useRef(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setEditorHeight(180);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setEditorHeight(600);
      }
    );

    return () => {
      clearTimeout(timer);
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    if (showUserList) {
      console.log("fetching users");
      fetchUsers();
    }
  }, [showUserList, searchQuery]);

  const fetchUsers = async () => {
    try {
      const response = await agent.Groups.getGroupMembersBySearch(groupId,1,10,searchQuery);
      console.log("response--------------------------------", JSON.stringify(response,null,2));
      if (response && response.data && response.data.members && response.data.members.length > 0) {
        setUsers(response.data.members);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data;
    setContent(message);
    
    const strippedMessage = message.replace(/<[^>]*>/g, ''); // remove HTML tags and trim whitespace
    const lastAtIndex = strippedMessage.lastIndexOf('@');
    const lastSpaceIndex = strippedMessage.lastIndexOf(' ');

    // Only proceed if last @ is after the last space
    if (lastAtIndex > lastSpaceIndex) {
      const textAfterAt = strippedMessage.slice(lastAtIndex + 1);

      // Check if space follows @ (e.g. "@ ") — in that case, cancel
      if (textAfterAt.startsWith(' ')) {
        setSearchQuery('');
        setShowUserList(false);
        return;
      }

      const spaceIndex = textAfterAt.indexOf(' ');
      const mentionQuery = spaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, spaceIndex);

      setSearchQuery(mentionQuery);

      if (!showUserList && mentionQuery.length > 0) {
        setShowUserList(true);
      }
    } else {
      // No @ after the last space — don't show suggestions
      setSearchQuery('');
      setShowUserList(false);
    }
  };

  const handleTextChange = (text) => {
    setPlainText(text);
    setContent(text);
    
    const lastAtIndex = text.lastIndexOf('@');
    const lastSpaceIndex = text.lastIndexOf(' ');

    if (lastAtIndex > lastSpaceIndex) {
      const textAfterAt = text.slice(lastAtIndex + 1);
      
      if (textAfterAt.startsWith(' ')) {
        setSearchQuery('');
        setShowUserList(false);
        return;
      }

      const spaceIndex = textAfterAt.indexOf(' ');
      const mentionQuery = spaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, spaceIndex);

      setSearchQuery(mentionQuery);

      if (!showUserList && mentionQuery.length > 0) {
        setShowUserList(true);
      }
    } else {
      setSearchQuery('');
      setShowUserList(false);
    }
  };

  const handleSelectionChange = (event) => {
    setSelection(event.nativeEvent.selection);
  };

  const handleUserSelect = (user) => {
    if (Platform.OS === 'ios') {
      if (!webViewRef.current) return;

      const script = `
        (function() {
          const editor = document.getElementById('editor');
          const selection = window.getSelection();
          const range = selection.getRangeAt(0);
          
          // Get all text nodes in the editor
          const textNodes = [];
          const walk = document.createTreeWalker(
            editor,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          
          let node;
          while (node = walk.nextNode()) {
            textNodes.push(node);
          }
          
          // Find the text node containing the cursor
          let cursorNode = range.startContainer;
          let cursorOffset = range.startOffset;
          
          // Find the last @ before cursor
          let lastAtIndex = -1;
          let lastAtNode = null;
          
          for (let i = 0; i < textNodes.length; i++) {
            const textNode = textNodes[i];
            const text = textNode.textContent;
            
            if (textNode === cursorNode) {
              // Search in current node up to cursor position
              const atIndex = text.lastIndexOf('@', cursorOffset);
              if (atIndex !== -1) {
                lastAtIndex = atIndex;
                lastAtNode = textNode;
                break;
              }
            } else if (textNode.compareDocumentPosition(cursorNode) & Node.DOCUMENT_POSITION_FOLLOWING) {
              // Search in previous nodes
              const atIndex = text.lastIndexOf('@');
              if (atIndex !== -1) {
                lastAtIndex = atIndex;
                lastAtNode = textNode;
              }
            }
          }
          
          if (lastAtNode && lastAtIndex !== -1) {
            // Create a new range to select the text to replace
            const newRange = document.createRange();
            newRange.setStart(lastAtNode, lastAtIndex);
            newRange.setEnd(range.endContainer, range.endOffset);
            
            // Create text node for @ symbol
            const atSymbol = document.createTextNode('@');
            
            // Create text node for username
            const username = document.createTextNode('${user.user_login}');
            
            // Create mention element with inline styles
            const mentionElement = document.createElement('a');
            mentionElement.className = 'bp-suggestions-mention';
            mentionElement.setAttribute('data-bb-hp-profile', ${user.ID});
            mentionElement.href = '{{mention_user_id_${user.ID}}}';
            mentionElement.setAttribute('rel', 'nofollow');
            mentionElement.style.color = '#122b46';
            mentionElement.style.textDecoration = 'none';
            mentionElement.style.fontWeight = '500';
            mentionElement.style.backgroundColor = '#e8f0fe';
            mentionElement.style.display = 'inline';
            mentionElement.style.padding = '0 2px';
            mentionElement.style.borderRadius = '2px';
            mentionElement.appendChild(atSymbol);
            mentionElement.appendChild(username);
            
            // Replace the text with mention
            newRange.deleteContents();
            newRange.insertNode(mentionElement);
            
            // Add space after mention
            const space = document.createTextNode(' ');
            mentionElement.parentNode.insertBefore(space, mentionElement.nextSibling);
            
            // Move cursor after space
            range.setStartAfter(space);
            range.setEndAfter(space);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Update content
            editor.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })();
      `;

      webViewRef.current.injectJavaScript(script);
    } else {
      // For Android, replace the @mention text with the selected user
      const lastAtIndex = plainText.lastIndexOf('@');
      const lastSpaceIndex = plainText.lastIndexOf(' ');
      
      if (lastAtIndex > lastSpaceIndex) {
        const textAfterAt = plainText.slice(lastAtIndex + 1);
        const spaceIndex = textAfterAt.indexOf(' ');
        const mentionQuery = spaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, spaceIndex);
        
        const newText = plainText.slice(0, lastAtIndex) + '@' + user.user_login + ' ' + plainText.slice(lastAtIndex + mentionQuery.length + 1);
        setPlainText(newText);
        setContent(newText);
      }
    }
    
    setShowUserList(false);
    setSelectedUsers(prev => [...prev, user]);
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/40' }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.display_name}</Text>
        <Text style={styles.userFullName}>{item.first_name}</Text>
      </View>
    </TouchableOpacity>
  );

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
    console.log('Emoji selected:', emoji);
    console.log('Platform:', Platform.OS);
    console.log('Current text:', plainText);
    console.log('Selection:', selection);

    // Hide emoji picker immediately when emoji is selected
    setShowEmojiPicker(false);
    Keyboard.dismiss();

    if (Platform.OS === 'ios') {
      if (!webViewRef.current) return;

      const script = `
        (function() {
          const editor = document.getElementById('editor');
          const selection = window.getSelection();
          const range = selection.getRangeAt(0);
          
          // Create text node for emoji
          const emojiNode = document.createTextNode('${emoji}');
          
          // Insert emoji at cursor position
          range.insertNode(emojiNode);
          
          // Move cursor after emoji
          range.setStartAfter(emojiNode);
          range.setEndAfter(emojiNode);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Update content
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        })();
      `;

      webViewRef.current.injectJavaScript(script);
    } else {
      try {
        // For Android, insert emoji at cursor position
        const cursorPosition = selection.start;
        console.log('Cursor position:', cursorPosition);
        
        const newText = plainText.slice(0, cursorPosition) + emoji + plainText.slice(cursorPosition);
        console.log('New text:', newText);
        
        setPlainText(newText);
        setContent(newText);
        
        // Update selection to be after the inserted emoji
        const newPosition = cursorPosition + emoji.length;
        setSelection({ start: newPosition, end: newPosition });
        
        // Force focus back to input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } catch (error) {
        console.error('Error inserting emoji:', error);
      }
    }
  };

  const handlePost = () => {
    if (content.trim() === '' && selectedImages.length === 0 && selectedVideos.length === 0 && selectedDocuments.length === 0) {
      Alert.alert('Error', 'Please enter some content or select a file.');
      return;
    }

    const dataToSend = {
      content: content.trim(),
      images: selectedImages,
      videos: selectedVideos,
      documents: selectedDocuments,
    };

    handleCreatePost(dataToSend);
  };

  const handleOutsidePress = () => {
    if (showUserList) {
      setShowUserList(false);
    }
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  };

  const isContentEmpty = (content) => {
    if (!content) return true;
    const strippedContent = content.replace(/<[^>]*>/g, '').trim();
    return strippedContent === '';
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {(showUserList || showEmojiPicker) && (
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={handleOutsidePress}
          />
        )}

        {Platform.OS === 'ios' ? (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: EDITOR_HTML }}
            style={[styles.editor, { height: editorHeight }]}
            onMessage={handleWebViewMessage}
            keyboardDisplayRequiresUserAction={true}
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={false}
          />
        ) : (
          <TextInput
            ref={inputRef}
            style={[styles.androidEditor, { height: editorHeight }]}
            value={plainText}
            onChangeText={handleTextChange}
            onSelectionChange={handleSelectionChange}
            selection={selection}
            placeholder="What's on your mind?"
            placeholderTextColor="#999"
            multiline={true}
            textAlignVertical="top"
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        {showUserList && (
          <View style={styles.userListContainer}>
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item?.ID?.toString() || Math.random().toString()}
              keyboardShouldPersistTaps="handled"
              style={styles.userList}
            />
          </View>
        )}

        {/* Media Preview */}
        {(selectedImages.length > 0 || selectedVideos.length > 0 || selectedDocuments.length > 0) && (
          <View style={styles.mediaPreviewWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewContainer}>
              {selectedImages.map((asset, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image
                    source={{ uri: asset.uri }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => handleDelete(asset.uri, 'image')}
                    style={styles.deleteButton}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))}

              {selectedVideos.map((vid, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Icon name="video" size={70} color="green" />
                  <TouchableOpacity onPress={() => handleDelete(vid.uri, 'video')} style={styles.deleteButton}>
                    <MaterialCommunityIcons name="delete" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))}

              {selectedDocuments.map((doc, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Icon name="file-document" size={70} color="blue" />
                  <TouchableOpacity onPress={() => handleDelete(doc.uri, 'document')} style={styles.deleteButton}>
                    <MaterialCommunityIcons name="delete" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Upload + Emoji Buttons */}
        <View style={styles.uploadOptionsContainer}>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={handleImagePick} style={styles.iconButton}>
              <Icon name="image" size={24} color="#122b46" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleVideoPick} style={styles.iconButton}>
              <Icon name="video" size={24} color="#122b46" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDocumentPick} style={styles.iconButton}>
              <Icon name="file-document" size={24} color="#122b46" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEmojiPicker(!showEmojiPicker)} style={styles.iconButton}>
              <Icon name="emoticon-outline" size={24} color="#122b46" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={handlePost} 
            style={[styles.postButton, isContentEmpty(content) && styles.postButtonDisabled]}
            disabled={loading || isContentEmpty(content)}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesomeIcon name="send-o" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {showEmojiPicker && (
          <View style={styles.emojiPickerContainer}>
            <EmojiSelector
              onEmojiSelected={handleEmojiSelect}
              showSearchBar={false}
              showSectionTitles={false}
              showHistory={false}
              showTabs={true}
              emojiSize={30}
              showPreview={true}
              columns={8}
              category={Categories.emotion}
              theme="light"
              style={styles.emojiSelector}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editor: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mediaPreviewWrapper: {
    backgroundColor: '#f8f9fa',
    padding: 12,
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  mediaItem: {
    position: 'relative',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mediaImage: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 20,
    backgroundColor: '#fff',
  },
  iconButton: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postButton: {
    backgroundColor: '#122b46',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emojiPickerContainer: {
    position: 'absolute',
    bottom: 0,
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
    zIndex: 1000,
  },
  emojiSelector: {
    flex: 1,
    height: 300,
  },
  userListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    maxHeight: 120,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userList: {
    flex: 1,
    maxHeight: 200,
    backgroundColor: '#fff',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
    backgroundColor: '#fff',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#fff',
  },
  userFullName: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#fff',
  },
  androidEditor: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 999,
  },
});

export default PostInput; 