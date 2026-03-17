import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { RichEditor, RichToolbar } from 'react-native-pell-rich-editor';

const RichEditorComponent = () => {
  const richText = useRef();
  const [message, setMessage] = useState('');

  return (
    <View style={styles.container}>
      <RichEditor
        ref={richText}
        style={styles.richEditor}
        placeholder="Type your message..."
        onChange={text => setMessage(text)}
      />
      <RichToolbar
        editor={richText}
        actions={['bold', 'italic', 'underline']}
        style={styles.toolbar}
      />
      <TouchableOpacity style={styles.sendButton} onPress={() => {/* Handle send message */}}>
        <Text style={styles.sendButtonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Add your styles here
});

export default RichEditorComponent; 