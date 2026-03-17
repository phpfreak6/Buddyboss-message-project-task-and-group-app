import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Image } from 'react-native';
import RenderHtml from 'react-native-render-html';

const EmojiRenderer = ({ message }) => {
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
    <View>
      <ScrollView style={styles.html}>
        <RenderHtml
          contentWidth={10}
          source={{ html: formattedMessage }}
          renderers={customRenderers}
          classesStyles={styles.html} // Apply styles here for <p>, <strong>, and <em>
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  html: {
    p: {
      fontSize: 10,  // Style for <p> tags
    },
    strong: {
      fontWeight: 'bold', // Style for <strong> tags
    },
    em: {
      fontStyle: 'italic', // Style for <em> tags
    },
  },
});

export default EmojiRenderer;
