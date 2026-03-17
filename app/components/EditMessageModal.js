import React, { useRef, useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NODE_BACKEND } from '@env';
import EmojiSelector, { Categories } from 'react-native-emoji-selector';

const API_ROOT = NODE_BACKEND;

const EditMessageModal = ({ visible, initialValue, onSave, onCancel, loading }) => {
  const [content, setContent] = useState(initialValue || '');
  const webViewRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editorLoading, setEditorLoading] = useState(true); // Loader for editor

  useEffect(() => {
    setContent(initialValue || '');
    if (visible && webViewRef.current && initialValue) {
      // Set the initial content in the editor
      webViewRef.current.injectJavaScript(`
        quill.root.innerHTML = ${JSON.stringify(initialValue)};
        true;
      `);
    }
  }, [initialValue, visible]);

  const quillHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="${API_ROOT}/quill/quill.snow.css" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          #editor { height: 100%; font-size: 15px; line-height: 1.5; }
          .ql-container { border: none !important; font-size: 15px; height: 100%; }
          .ql-toolbar { display: none !important; }
          .ql-editor { padding: 12px 0; height: 100%; }
          .ql-editor.ql-blank::before { color: #999; font-style: normal; font-size: 15px; }
          .ql-editor p { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="editor"></div>
        <script src="${API_ROOT}/quill/quill.js"></script>
        <script>
          var quill = new Quill('#editor', {
            theme: 'snow',
            placeholder: 'Edit your message...',
            modules: { toolbar: false, clipboard: { matchVisual: false } }
          });
          quill.root.innerHTML = ${JSON.stringify(initialValue || '')};
          quill.on('text-change', function(delta, oldDelta, source) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'content-change', content: quill.root.innerHTML }));
          });
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'content-change') {
        setContent(data.content);
      }
    } catch (error) {
      // ignore
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Edit Message</Text>
          <View style={styles.editorWrapper}>
            <WebView
              ref={webViewRef}
              source={{ html: quillHtml }}
              style={styles.webView}
              onMessage={handleMessage}
              keyboardDisplayRequiresUserAction={false}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              originWhitelist={["*"]}
              onLoadStart={() => setEditorLoading(true)}
              onLoadEnd={() => setEditorLoading(false)}
            />
            {editorLoading && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color="#122b46" />
              </View>
            )}
          </View>
          {showEmojiPicker && (
            <View style={styles.emojiPickerContainer}>
              <EmojiSelector
                onEmojiSelected={(emoji) => {
                  setShowEmojiPicker(false);
                  webViewRef.current?.injectJavaScript(`
                    (function() {
                      const range = quill.getSelection();
                      if (range) {
                        quill.insertText(range.index, '${emoji}', { 'emoji': true });
                        quill.setSelection(range.index + 2, 0);
                      } else {
                        const length = quill.getLength();
                        quill.insertText(length - 1, '${emoji}', { 'emoji': true });
                        quill.setSelection(length + 1, 0);
                      }
                      quill.focus();
                      true;
                    })();
                  `);
                }}
                showSearchBar={false}
                showSectionTitles={false}
                emojiSize={30}
                showPreview={true}
                columns={8}
                category={Categories.emotion}
              />
            </View>
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => setShowEmojiPicker((v) => !v)} style={{ marginRight: 10, padding: 6, borderRadius: 20, backgroundColor: '#f2f2f2', flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="emoticon-outline" size={22} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} disabled={loading}>
              <Icon name="close" size={20} color="#666" />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSave(content)}
              style={[styles.saveBtn, loading && { backgroundColor: '#8a9cb3' }]}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="content-save" size={20} color="#fff" />}
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#122b46',
    textAlign: 'center',
  },
  editorWrapper: {
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  cancelText: {
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#122b46',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  emojiPickerContainer: {
    height: 200,
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
    paddingBottom: 20
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default EditMessageModal; 