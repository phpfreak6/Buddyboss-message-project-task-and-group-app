import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import RenderHtml, { defaultHTMLElementModels, HTMLElementModel, HTMLContentModel } from 'react-native-render-html';
import VideoPlayer from './Video';
import { WebView } from 'react-native-webview';

const iframeModel = HTMLElementModel.fromCustomModel({
  tagName: 'iframe',
  contentModel: HTMLContentModel.block,
  mixedUAStyles: {
    width: '100%',
    height: 200,
  },
});

const customHTMLElementModels = {
  iframe: iframeModel,
};

// Wraps plain-text URLs in <a> tags so they become clickable. Only replaces in text content, not inside tag attributes.
const wrapPlainUrlsInAnchorTags = (html) => {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  const parts = html.split(/(<[^>]+>)/g);
  return parts
    .map((part) => {
      if (part.startsWith('<')) return part;
      return part.replace(urlRegex, '<a href="$1">$1</a>');
    })
    .join('');
};

const HtmlRenderer = ({ message }) => {
  const { width } = useWindowDimensions();  // Get the screen width


 // console.log("h-----------------------------------",message)

  const formattedMessage = wrapPlainUrlsInAnchorTags(message.replace(/\n/g, '<br/>'));

  // Memoize the renderersProps
  const renderersProps = useMemo(() => ({
    img: {
      enableExperimentalPercentWidth: true,
      initialDimensions: { width: 300, height: 200 },
    }
  }), []);

  // Memoize the custom renderers to prevent unnecessary rerenders
  const customRenderers = useMemo(() => ({
    iframe: ({ tnode }) => {
      const src = tnode?.attributes?.src;
      const iWidth =  360;
      const iHeight = 200;

      

      if (!src) return null;

      const isYouTube = /youtube\.com|youtu\.be/.test(src);
      const width = iWidth ? Number(iWidth) : 300;
      const height = iHeight ? Number(iHeight) : 200;

      if (isYouTube) {
        return (
          <View style={{ width, height }}>
            <WebView
              source={{ uri: src }}
              style={{ width: '100%', height: '100%' }}
              javaScriptEnabled
              domStorageEnabled
            />
          </View>
        );
      }

      return (
        <View style={{ width, height }}>
          <VideoPlayer source={src} style={{ width: '100%', height: '100%' }} />
        </View>
      );
    },
    div: ({ children, tnode }) => {
      // Find the <video> child node
      const videoChild = tnode.children?.find(child => child.tagName === 'video');
      const classAttr = tnode?.attributes?.class || '';

      // Skip if class contains 'ld-progress'
      if (classAttr.split(' ').includes('ld-progress')) {
        return null;
      }

      // If <video> exists, extract the src from its attributes or domNode.attribs
      let videoSrc = null;
      if (videoChild) {
        // Try direct attribute first
        videoSrc = videoChild.attributes?.src;
        // Fallback to domNode.attribs if not found
        if (!videoSrc && videoChild.init?.domNode?.attribs) {
          // Try <video src="..."> or <video><source src="..."></video>
          videoSrc = videoChild.init.domNode.attribs.src;
          // If still not found, try to find <source> in domNode.children
          if (!videoSrc && Array.isArray(videoChild.init.domNode.children)) {
            const sourceNode = videoChild.init.domNode.children.find(
              n => n.name === 'source' && n.attribs && n.attribs.src
            );
            videoSrc = sourceNode?.attribs?.src;
          }
        }
      }

      return (
        <>
          {children}
          {videoSrc && (
            <VideoPlayer source={videoSrc} style={{ width: '100%', height: 200 }} controls={true} />
          )}
        </>
      );
    },
    a: ({ tnode, TDefaultRenderer, ...props }) => {
      const href = tnode?.attributes?.href;
      if (!href) {
        return <TDefaultRenderer tnode={tnode} {...props} />;
      }
      const handlePress = async () => {
        try {
          const url = href.startsWith('http') ? href : `https://${href}`;
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
          } else {
            Alert.alert('Error', 'Cannot open this link.');
          }
        } catch (err) {
          Alert.alert('Error', 'Could not open link.');
        }
      };
      return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
          <TDefaultRenderer tnode={tnode} {...props} style={[props.style, styles.link]} />
        </TouchableOpacity>
      );
    },
  }), []); // Empty dependency array since the renderer doesn't depend on any props

  const classesStyles = useMemo(() => ({
    'pm-mention': {
      maxWidth: '90%',
      backgroundColor: '#e8f0fe',
      borderRadius: 4,
      color: '#1a73e8',
      fontWeight: '600',
      marginRight: 5,
      paddingHorizontal: 4,
      paddingVertical: 1,
      width: 'auto',
    },
  }), []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.html}>
        <RenderHtml
          contentWidth={width}
          source={{ html: formattedMessage }}
          renderers={customRenderers}
          customHTMLElementModels={customHTMLElementModels}
          tagsStyles={styles.html}
          classesStyles={classesStyles}
          renderersProps={renderersProps}
          defaultTextProps={{ selectable: true }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  html: {
    p: {
      marginVertical: 0,
      padding: 0,
      fontSize: 14,
    },
    strong: {
      fontWeight: 'bold', // Style for <strong> tags
    },
    em: {
      fontStyle: 'italic', // Style for <em> tags
    },
    a: {
      color: '#1a73e8',
      textDecorationLine: 'underline',
    },
  },
  link: {
    color: '#1a73e8',
    textDecorationLine: 'underline',
  },
});

export default HtmlRenderer;
