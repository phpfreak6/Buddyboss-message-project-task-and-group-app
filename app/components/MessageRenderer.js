import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Image, TouchableOpacity } from 'react-native';
import RenderHtml from 'react-native-render-html';

const linkifyHtml = (input) => {
  if (!input) return '';
  const withBasicFormatting = input.replace(/\n/g, '<br/>').replace(/\\'/g, "'");
  const parts = withBasicFormatting.split(/(<[^>]+>)/g);
  return parts
    .map((part) => {
      if (part.startsWith('<')) return part;
      return part.replace(/((?:https?:\/\/|www\.)[^\s<]+)/g, (rawUrl) => {
        const href = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
        return `<a href="${href}">${rawUrl}</a>`;
      });
    })
    .join('');
};

const MessageRenderer = ({ message, textColor }) => {
  const { width } = useWindowDimensions();

  const formattedMessage = useMemo(() => linkifyHtml(message), [message]);

  const customRenderers = useMemo(() => ({
    img: ({ tnode }) => {
      const src = tnode.attributes.src;
      const alt = tnode.attributes.alt;
       const className = tnode.attributes.class || '';
      if (!src) return null;
      const isEmoji = className.includes('emoji');
      return (
        <TouchableOpacity style={isEmoji ? styles.emojiContainer : styles.attachmentContainer}>
          <Image
            source={{ uri: src }}
            style={isEmoji ? styles.emojiImage : styles.imageAttachment}
            accessibilityLabel={alt}
          />
          {/* <View style={styles.attachmentOverlay}>
            <Text style={styles.iconText}>🖼️</Text>
          </View> */}
        </TouchableOpacity>
      );
    },
    video: ({ src }) => {
      return (
        <TouchableOpacity style={styles.attachmentContainer}>
          <View style={styles.videoContainer}>
            <Image
              source={{ uri: src }}
              style={styles.videoThumbnail}
            />
            <View style={styles.videoOverlay}>
              <Text style={styles.playButton}>▶️</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    document: ({ src, title }) => {
      return (
        <TouchableOpacity style={styles.documentContainer}>
          <View style={styles.documentIcon}>
            <Text style={styles.documentIconText}>📄</Text>
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle} numberOfLines={1}>
              {title || 'Document'}
            </Text>
            <Text style={styles.documentType}>PDF Document</Text>
          </View>
          <Text style={styles.chevronText}>›</Text>
        </TouchableOpacity>
      );
    },
  }), []);

  const htmlStyles = useMemo(() => ({
    ...styles.html,
    p: {
      ...styles.html.p,
      color: textColor || styles.html.p.color,
    },
    strong: {
      ...styles.html.strong,
      color: textColor || styles.html.strong.color,
    },
    em: {
      ...styles.html.em,
      color: textColor || styles.html.em.color,
    },
    span: {
      ...styles.html.span,
      color: textColor || styles.html.span.color,
    },
  }), [textColor]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.html}>
        <RenderHtml
          contentWidth={width}
          source={{ html: formattedMessage }}
          renderers={customRenderers}
          tagsStyles={htmlStyles}
          defaultTextProps={{ selectable: true, style: { color: textColor } }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
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
    },
    a: {
      color: '#1e90ff',
      textDecorationLine: 'underline',
      userSelect: 'text',
    }
  },
  attachmentContainer: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  emojiContainer: {
    marginVertical: 8,
    borderRadius: 12,
  },
  imageAttachment: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  emojiImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  attachmentOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  iconText: {
    fontSize: 20,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    fontSize: 40,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  documentIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 24,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  documentType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chevronText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
});

export default MessageRenderer;
