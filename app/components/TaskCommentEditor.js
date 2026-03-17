/**
 * TaskCommentEditor – reusable rich comment input using Quill in WebView.
 * Same implementation as CommentInputBarWeb (Quill, no ProseMirror): content-change,
 * mention-search, insertMention. Uses projectUsers for mentions (client-side filter).
 */
import { NODE_BACKEND } from '@env';
import React, { useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Text,
  TextInput,
  Keyboard,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import EmojiSelector, { Categories } from 'react-native-emoji-selector';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { WebView } from 'react-native-webview';
import DocumentPicker from 'react-native-document-picker';

const API_ROOT = NODE_BACKEND;
const PLACEHOLDER_DEFAULT = 'Add a comment';

const extractMentionsFromHtml = (html) => {
  if (!html || typeof html !== 'string') return [];
  const mentionsMap = {};
  const regex =
    /<span[^>]*class=\"[^\"]*(?:pm-mention|mention)[^\"]*\"[^>]*data-mention-id=\"([^\"]+)\"[^>]*data-mention-name=\"([^\"]*)\"[^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const idRaw = match[1];
    const name = match[2] || '';
    const idNum = parseInt(idRaw, 10);
    const id = Number.isNaN(idNum) ? idRaw : idNum;
    if (!mentionsMap[id]) {
      mentionsMap[id] = { id, name };
    }
  }
  return Object.values(mentionsMap);
};

function getQuillHtml(placeholder) {
  const safePlaceholder = (placeholder || PLACEHOLDER_DEFAULT)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link href="${API_ROOT}/quill/quill.snow.css" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    #editor { min-height: 88px; max-height: 220px; font-size: 15px; line-height: 1.4; }
    .ql-container { border: none !important; font-size: 15px; min-height: 88px; max-height: 220px; }
    .ql-toolbar { display: none !important; }
    .ql-editor { padding: 8px 0; min-height: 80px; max-height: 212px; line-height: 1.4; color: #202124; caret-color: #1a73e8; -webkit-user-select: text; user-select: text; }
    .ql-editor.ql-blank::before { color: #9aa0a6; font-style: normal; font-size: 15px; content: '${safePlaceholder}'; }
    .ql-editor p { margin: 0 0 2px 0; padding: 0; width: fit-content; max-width: 100%; }
    .ql-editor p:last-child { margin-bottom: 0; }
    .pm-mention { color: #122b46; font-weight: 500; background-color: #e8f0fe; padding: 1px 4px; border-radius: 4px; margin: 0; display: inline; width: fit-content; }
  </style>
</head>
<body>
  <div id="editor"></div>
  <script src="${API_ROOT}/quill/quill.js"></script>
  <script>
    // Custom inline blot for mentions, based on your snippet:
    // <span class="pm-mention" data-mention-id="..." data-mention-name="...">@value</span>
    (function() {
      const Inline = Quill.import('blots/inline');

      class MentionBlot extends Inline {
        static create(data) {
          const node = super.create();
          const id = data && data.id != null ? String(data.id) : '';
          const value = (data && data.value != null ? String(data.value) : '').trim();
          const type = data && data.type ? String(data.type) : 'user';
          node.setAttribute('class', 'pm-mention');
          node.setAttribute('data-mention-id', id);
          node.setAttribute('data-mention-name', value);
          node.setAttribute('data-type', type);
          node.innerText = '@' + value;
          node.contentEditable = false;
          return node;
        }

        static formats(node) {
          return {
            id: node.getAttribute('data-mention-id'),
            value: node.getAttribute('data-mention-name'),
            type: node.getAttribute('data-type') || 'user',
          };
        }
      }

      MentionBlot.blotName = 'mention';
      MentionBlot.tagName = 'span';
      MentionBlot.className = 'pm-mention';

      Quill.register(MentionBlot);
    })();

    const quill = new Quill('#editor', {
      theme: 'snow',
      placeholder: '${safePlaceholder}',
      modules: { toolbar: false, clipboard: { matchVisual: false } },
    });

    let mentionSearch = '';
    let mentionStartIndex = -1;

    // Detect \"@\" and send search string up to React Native (similar to your MENTION_TRIGGER / content flow)
    quill.on('text-change', function (delta, oldDelta, source) {
      if (source !== 'user') return;

      const text = quill.getText();
      const lastAt = text.lastIndexOf('@');

      if (lastAt !== -1) {
        const afterAt = text.slice(lastAt + 1);
        const spaceIdx = afterAt.indexOf(' ');
        if (spaceIdx === -1) {
          mentionSearch = afterAt;
          mentionStartIndex = lastAt;
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'mention-search',
              search: mentionSearch,
              index: mentionStartIndex,
            }),
          );
        } else {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'mention-search', search: '', index: -1 }),
          );
        }
      } else {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'mention-search', search: '', index: -1 }),
        );
      }

      // Always send current HTML content as well
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'content-change',
          content: quill.root.innerHTML,
        }),
      );
    });

    // Notify React Native when editor gains focus (tap/click) so parent can scroll to bottom.
    quill.on('selection-change', function(range, oldRange, source) {
      if (range && source === 'user') {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'focus',
          }),
        );
      }
    });

    // Also listen for direct taps/clicks on the editor container itself.
    var editorEl = document.getElementById('editor');
    if (editorEl) {
      var notifyFocus = function() {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'focus',
          }),
        );
      };
      editorEl.addEventListener('mousedown', notifyFocus);
      editorEl.addEventListener('touchstart', notifyFocus);
    }

    // Insert mention at exact position: prefer current selection (cursor after "@query"), else use tracked @ index
    function insertMention(user) {
      const range = quill.getSelection();
      const id = user.id != null ? user.id : user.ID;
      const value = String(
        (user.user_login != null ? user.user_login : user.display_name || user.name) || '',
      ).trim();
      const queryLen = mentionSearch ? mentionSearch.length : 0;
      const deleteLen = queryLen + 1; // @ + query
      let startPos;

      if (range != null && range.index >= deleteLen) {
        // Cursor is after "@query" – derive position from current selection
        startPos = range.index - deleteLen;
      } else if (mentionStartIndex >= 0) {
        // Fallback when focus was lost (e.g. tapped dropdown): use tracked @ position
        startPos = mentionStartIndex;
      } else {
        return;
      }

      startPos = Math.max(0, startPos);
      quill.deleteText(startPos, deleteLen);
      quill.insertEmbed(startPos, 'mention', { id: id, value: value, type: 'user' });
      quill.insertText(startPos + 1, '');
      quill.setSelection(startPos + 2, 0);

      mentionStartIndex = -1;
      mentionSearch = '';
    }

    window.insertMention = insertMention;

    // Expose HTML + clear helpers for React Native
    window.getEditorHtml = function () {
      return quill.root.innerHTML;
    };

    window.clearEditor = function () {
      quill.setContents([]);
      mentionStartIndex = -1;
      mentionSearch = '';
    };
  </script>
</body>
</html>
`;
}

const TaskCommentEditor = forwardRef(({
  projectUsers = [],
  currentUser,
  onSubmit,
  placeholder = PLACEHOLDER_DEFAULT,
  submitting = false,
  showAttachments = true,
  submitLabel = 'Comment',
  onRequestScrollToBottom,
  initialValue = '',
  onCancel,
  containerStyle,
  onEditorReady,
}, ref) => {
  const [content, setContent] = useState(initialValue || '');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const webViewRef = useRef(null);
  const editorActiveRef = useRef(false);
  const initialValueRef = useRef(initialValue);

  const quillHtml = useMemo(() => getQuillHtml(placeholder), [placeholder]);

  // Sync initialValue for edit mode (e.g. when switching to edit a comment)
  React.useEffect(() => {
    initialValueRef.current = initialValue || '';
    if (initialValue != null && initialValue !== '') {
      setContent(initialValue);
    }
  }, [initialValue]);

  const handleMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'content-change') {
          setContent(data.content || '');
          editorActiveRef.current = true;
          setTimeout(() => {
            editorActiveRef.current = false;
          }, 2000);
          // While typing in the comment box, keep the modal scrolled to the bottom.
          if (onRequestScrollToBottom) {
            onRequestScrollToBottom();
          }
        } else if (data.type === 'mention-search') {
          setMentionSearch(data.search || '');
          setShowMentions(data.index !== -1);
        } else if (data.type === 'focus') {
          editorActiveRef.current = true;
          setTimeout(() => {
            editorActiveRef.current = false;
          }, 2000);
          // Also scroll whenever the editor gains focus.
          if (onRequestScrollToBottom) {
            onRequestScrollToBottom();
          }
        }
      } catch (e) {}
    },
    [onRequestScrollToBottom]
  );

  // Safety net: when keyboard appears shortly after editor activity,
  // ensure the modal is scrolled to the bottom.
  React.useEffect(() => {
    if (!onRequestScrollToBottom) return;

    const eventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(eventName, () => {
      if (editorActiveRef.current) {
        setTimeout(() => {
          onRequestScrollToBottom();
        }, 50);
      }
    });

    return () => {
      sub.remove();
    };
  }, [onRequestScrollToBottom]);

  const filteredUsers = useMemo(() => {
    if (!mentionSearch.trim()) return projectUsers.slice(0, 50);
    const q = mentionSearch.trim().toLowerCase();
    return projectUsers
      .filter(
        (u) =>
          (u.user_login && u.user_login.toLowerCase().includes(q)) ||
          (u.display_name && u.display_name.toLowerCase().includes(q)) ||
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.user_email && u.user_email.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [projectUsers, mentionSearch]);

  const handleMentionSelect = useCallback((user) => {
    const payload = {
      id: user.id ?? user.ID,
      name: user.display_name ?? user.name,
      user_login: user.user_login ?? user.name,
      avatar: user.image ?? user.avatar_url,
    };
    webViewRef.current?.injectJavaScript(`
      window.insertMention(${JSON.stringify(payload)});
      true;
    `);
    setShowMentions(false);
    setMentionSearch('');
  }, []);

  const handleEmojiSelect = useCallback((emoji) => {
    const escaped = JSON.stringify(emoji);
    webViewRef.current?.injectJavaScript(`
      (function() {
        try {
          var q = typeof quill !== 'undefined' ? quill : null;
          if (!q) return false;
          var r = q.getSelection();
          var idx = r ? r.index : (q.getLength() - 1);
          q.insertText(idx, ${escaped} + ' ');
          q.setSelection(idx + 2, 0);
          q.focus();
          return true;
        } catch (e) { return false; }
      })();
    `);
    setShowEmojiPicker(false);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = (content || '').replace(/<[^>]*>/g, '').trim();
    const hasMedia = selectedImages.length > 0 || selectedDocuments.length > 0;
    if (!trimmed && !hasMedia) {
      Alert.alert('', 'Please enter a comment or add an attachment.');
      return;
    }
    webViewRef.current?.injectJavaScript(`
      (function() {
        var html = typeof window.getEditorHtml === 'function' ? window.getEditorHtml() : '';
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'submit', html: html }));
        true;
      })();
    `);
  }, [content, selectedImages.length, selectedDocuments.length]);

  const clearEditorContent = useCallback(() => {
    setContent('');
    setShowMentions(false);
    setMentionSearch('');
    setSelectedImages([]);
    setSelectedDocuments([]);
    webViewRef.current?.injectJavaScript(`
      if (typeof window.clearEditor === 'function') window.clearEditor();
      true;
    `);
  }, []);

  useImperativeHandle(ref, () => ({
    clearEditor: clearEditorContent,
  }), [clearEditorContent]);

  const onBridgeMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'submit') {
          const htmlContent = data.html || '';
          const textContent = (htmlContent || '').replace(/<[^>]*>/g, '').trim();
          const mentions = extractMentionsFromHtml(htmlContent);
          setShowMentions(false);
          setMentionSearch('');
          Keyboard.dismiss();
          if (onSubmit) {
            onSubmit({
              content: textContent,
              htmlContent: htmlContent || textContent,
              attachments: [...selectedImages, ...selectedDocuments],
              mentions,
            });
          }
        }
      } catch (e) {}
    },
    [onSubmit, selectedImages, selectedDocuments]
  );

  const onMessage = useCallback(
    (e) => {
      handleMessage(e);
      onBridgeMessage(e);
    },
    [handleMessage, onBridgeMessage]
  );

  const hasContent =
    (content || '').replace(/<[^>]*>/g, '').trim().length > 0 ||
    selectedImages.length > 0 ||
    selectedDocuments.length > 0 ||
    (initialValueRef.current || '').replace(/<[^>]*>/g, '').trim().length > 0;

  const onWebViewLoadEnd = useCallback(() => {
    const raw = initialValueRef.current;
    if (raw && typeof raw === 'string') {
      const payload = JSON.stringify(raw);
      webViewRef.current?.injectJavaScript(`
        (function() {
          try {
            var q = typeof quill !== 'undefined' ? quill : null;
            if (!q) return;
            q.root.innerHTML = ${payload};
          } catch (e) {}
        })();
        true;
      `);
      setTimeout(() => onEditorReady?.(), 150);
    } else {
      onEditorReady?.();
    }
  }, [onEditorReady]);

  const pickImages = useCallback(() => {
    Alert.alert('Add image', 'Choose source', [
      { text: 'Camera', onPress: () => launchCamera({ mediaType: 'photo', includeBase64: false }, handleImageResponse) },
      { text: 'Gallery', onPress: () => launchImageLibrary({ mediaType: 'photo', includeBase64: false, selectionLimit: 0 }, handleImageResponse) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const handleImageResponse = useCallback((res) => {
    if (res.didCancel || res.error || !res.assets?.length) return;
    setSelectedImages((prev) => [...prev, ...res.assets]);
  }, []);

  const pickDocuments = useCallback(async () => {
    try {
      const res = await DocumentPicker.pick({ type: [DocumentPicker.types.allFiles] });
      const files = Array.isArray(res) ? res : [res];
      setSelectedDocuments((prev) => [...prev, ...files]);
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) console.error(e);
    }
  }, []);

  const removeAttachment = useCallback((uri, kind) => {
    if (kind === 'image') setSelectedImages((prev) => prev.filter((a) => a.uri !== uri));
    else setSelectedDocuments((prev) => prev.filter((d) => d.uri !== uri));
  }, []);

  const insertAt = useCallback(() => {
    webViewRef.current?.injectJavaScript(`
      (function() {
        try {
          var q = typeof quill !== 'undefined' ? quill : null;
          if (!q) return false;
          var r = q.getSelection();
          var idx = r ? r.index : (q.getLength() - 1);
          q.insertText(idx, '@');
          q.setSelection(idx + 1, 0);
          q.focus();
          return true;
        } catch (e) { return false; }
      })();
    `);
  }, []);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.editorWrap}>
        {currentUser && (
          <View style={styles.avatarWrap}>
            {currentUser.image || currentUser.avatar_url ? (
              <Image source={{ uri: currentUser.image || currentUser.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {(currentUser.display_name || currentUser.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.editorRight}>
          <View style={[styles.webViewWrap, showMentions && styles.webViewBehindMentions]}>
            <WebView
              ref={webViewRef}
              source={{ html: quillHtml }}
              style={styles.webView}
              onMessage={onMessage}
              onLoadEnd={onWebViewLoadEnd}
              scrollEnabled
              keyboardDisplayRequiresUserAction={false}
              nestedScrollEnabled
              pointerEvents={showMentions ? 'none' : 'auto'}
            />
          </View>
          {/* Mention list shown in popup modal */}
          <Modal
            visible={showMentions}
            transparent
            animationType="fade"
            onRequestClose={() => setShowMentions(false)}
          >
            <View style={styles.mentionModalOverlay}>
              <TouchableOpacity
                style={styles.mentionModalBackdrop}
                activeOpacity={1}
                onPress={() => setShowMentions(false)}
              />
              <View style={styles.mentionModalContent} pointerEvents="box-none">
                <View style={styles.mentionModalHeader}>
                  <Text style={styles.mentionModalTitle}>Select user to mention</Text>
                  <TouchableOpacity
                    style={styles.mentionModalClose}
                    onPress={() => setShowMentions(false)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Icon name="close" size={24} color="#5f6368" />
                  </TouchableOpacity>
                </View>
                <View style={styles.mentionModalSearchWrap}>
                  <Icon name="magnify" size={20} color="#9aa0a6" style={styles.mentionModalSearchIcon} />
                  <TextInput
                    style={styles.mentionModalSearchInput}
                    placeholder="Search users by name or email..."
                    placeholderTextColor="#9aa0a6"
                    value={mentionSearch}
                    onChangeText={setMentionSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                  />
                </View>
                {filteredUsers.length > 0 ? (
                <FlatList
                  data={filteredUsers}
                  keyExtractor={(user, index) => (user.ID ?? user.id ?? index).toString()}
                  style={styles.mentionModalList}
                  keyboardShouldPersistTaps="always"
                  renderItem={({ item: user }) => (
                    <Pressable
                      style={({ pressed }) => [styles.mentionItem, pressed && styles.mentionItemPressed]}
                      onPress={() => handleMentionSelect(user)}
                    >
                      {user.image || user.avatar_url ? (
                        <Image source={{ uri: user.image || user.avatar_url }} style={styles.mentionAvatar} />
                      ) : (
                        <View style={[styles.mentionAvatar, styles.mentionAvatarPlaceholder]}>
                          <Text style={styles.mentionAvatarLetter}>
                            {(user.display_name || user.name || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.mentionName} numberOfLines={1}>
                        {user.display_name || user.name || user.user_login}
                      </Text>
                    </Pressable>
                  )}
                />
                ) : (
                  <View style={styles.mentionModalEmpty}>
                    <Text style={styles.mentionModalEmptyText}>No users found</Text>
                    <Text style={styles.mentionModalEmptyHint}>Try a different search</Text>
                  </View>
                )}
              </View>
            </View>
          </Modal>
          {showAttachments && (selectedImages.length > 0 || selectedDocuments.length > 0) && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow}>
              {selectedImages.map((asset, i) => (
                <View key={'img-' + i} style={styles.mediaItem}>
                  <Image source={{ uri: asset.uri }} style={styles.mediaThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.mediaRemove} onPress={() => removeAttachment(asset.uri, 'image')}>
                    <Icon name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {selectedDocuments.map((doc, i) => (
                <View key={'doc-' + i} style={styles.mediaItem}>
                  <Icon name="file-document" size={40} color="#666" />
                  <TouchableOpacity style={styles.mediaRemove} onPress={() => removeAttachment(doc.uri, 'document')}>
                    <Icon name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <View style={styles.toolbar}>
            <View style={styles.toolbarLeft}>
              {showAttachments && (
                <>
                  <TouchableOpacity style={styles.toolbarBtn} onPress={pickImages}>
                    <Icon name="image" size={20} color="#5f6368" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolbarBtn} onPress={pickDocuments}>
                    <Icon name="file-document" size={20} color="#5f6368" />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.toolbarBtn} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
                <Icon name="emoticon-outline" size={20} color="#5f6368" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarBtn} onPress={insertAt}>
                <Icon name="at" size={20} color="#5f6368" />
              </TouchableOpacity>
            </View>
            <View style={styles.toolbarRight}>
              {/* {onCancel != null && (
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )} */}
              <TouchableOpacity
                style={[styles.submitBtn, (!hasContent || submitting) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!hasContent || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>{submitLabel}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      {showEmojiPicker && (
        <View style={styles.emojiPickerContainer}>
          <EmojiSelector
            onEmojiSelected={handleEmojiSelect}
            showSearchBar={false}
            showSectionTitles={false}
            emojiSize={30}
            showPreview
            columns={8}
            category={Categories.emotion}
          />
        </View>
      )}
    </View>
  );
});

TaskCommentEditor.displayName = 'TaskCommentEditor';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -1 },
    elevation: 2,
  },
  editorWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  editorRight: { flex: 1, minWidth: 0, position: 'relative', zIndex: 1 },
  webViewWrap: { flex: 1, minHeight: 88 },
  webView: { backgroundColor: 'transparent', minHeight: 88, maxHeight: 224 },
  webViewBehindMentions: { zIndex: 0, elevation: 0 },
  mentionsContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    minHeight: 120,
    maxHeight: 240,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  mentionsList: { minHeight: 120, maxHeight: 240 },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mentionItemPressed: { backgroundColor: '#f0f4f8' },
  mentionAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  mentionAvatarPlaceholder: { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  mentionAvatarLetter: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  mentionName: { fontSize: 15, color: '#202124', flex: 1 },
  mentionModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mentionModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  mentionModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  mentionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  mentionModalTitle: { fontSize: 16, fontWeight: '600', color: '#202124' },
  mentionModalClose: { padding: 4 },
  mentionModalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    backgroundColor: '#f8f9fa',
  },
  mentionModalSearchIcon: { marginRight: 8 },
  mentionModalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#202124',
    paddingVertical: 10,
    paddingRight: 8,
  },
  mentionModalEmpty: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  mentionModalEmptyText: { fontSize: 15, color: '#5f6368', marginBottom: 4 },
  mentionModalEmptyHint: { fontSize: 13, color: '#9aa0a6' },
  mentionModalList: { maxHeight: 320 },
  mediaRow: { marginTop: 6, marginBottom: 4 },
  mediaItem: {
    width: 70,
    height: 60,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  mediaThumb: { width: 70, height: 60 },
  mediaRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    minHeight: 40,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    justifyContent: 'center',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  toolbarBtn: {
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, color: '#5f6368' },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#1a73e8',
  },
  submitBtnDisabled: { backgroundColor: '#dadce0', opacity: 0.9 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  emojiPickerContainer: {
    height: 250,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
});

export default TaskCommentEditor;
