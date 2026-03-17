import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Image } from 'react-native';
import RenderHtml from 'react-native-render-html';

const MessageRenderer = ({ message }) => {
  const { width } = useWindowDimensions();  // Get the screen width

  const formattedMessage = message.replace(/\n/g, '<br/>');

  // Memoize the custom renderers to prevent unnecessary rerenders
  const customRenderers = useMemo(() => ({
    img: ({ src, alt }) => {
      return (
        <Image
          source={{ uri: src }}
          style={{ width: 100, height: 100, resizeMode: 'contain' }}
          alt={alt}
        />
      );
    },
  }), []); // Empty dependency array since the renderer doesn't depend on any props

  return (
    <View style={styles.container}>
      <ScrollView style={styles.html}>
        <RenderHtml
          contentWidth={width}
          source={{ html: formattedMessage }}
          renderers={customRenderers}
          tagsStyles={styles.html}
          defaultTextProps={{ selectable: true }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 10,
    width: '95%',
  },
  html: {
    p: {
      marginVertical: 0,
      padding: 0,
      fontSize: 14,
      userSelect: 'text',
    },
    strong: {
      fontWeight: 'bold', 
      userSelect: 'text',
    },
    em: {
      fontStyle: 'italic', 
      userSelect: 'text',
    },
    span: {
      userSelect: 'text',
    }
  },
});

export default MessageRenderer;
