import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 15px;
            line-height: 1.5;
            color: #222;
            background-color: transparent;
        }
        #content {
            width: 100%;
            min-height: 100%;
            padding: 0;
            margin: 0;
        }
        a {
            color: #122b46;
            text-decoration: none;
        }
        img {
            max-width: 100%;
            border-radius: 8px;
            margin: 8px 0;
        }
        .bp-suggestions-mention {
            color: #122b46;
            text-decoration: none;
            font-weight: 500;
            background-color: #e8f0fe;
            display: inline;
            padding: 0 2px;
            border-radius: 2px;
        }
        p {
            margin: 0;
            padding: 0;
            margin-bottom: 8px;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: #f5f5f5;
            padding: 8px;
            border-radius: 4px;
            margin: 4px 0;
            font-family: monospace;
        }
        code {
            font-family: monospace;
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
        }
        blockquote {
            border-left: 4px solid #e0e0e0;
            margin: 4px 0;
            padding: 4px 8px;
            color: #666;
            background-color: #f9f9f9;
            border-radius: 0 4px 4px 0;
        }
        ul, ol {
            margin: 4px 0;
            padding-left: 20px;
        }
        li {
            margin: 2px 0;
        }
        h1, h2, h3, h4, h5, h6 {
            margin: 12px 0 4px 0;
            color: #122b46;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
        }
        th, td {
            border: 1px solid #e0e0e0;
            padding: 6px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
        }
    </style>
</head>
<body>
    <div id="content"></div>
    <script>
        function setContent() {
            const content = "{{content}}";
            const contentDiv = document.getElementById('content');
            if (contentDiv) {
                contentDiv.innerHTML = content;
                // Notify React Native about content height
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'contentHeight',
                    height: contentDiv.offsetHeight
                }));
            }
        }
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setContent);
        } else {
            setContent();
        }
    </script>
</body>
</html>
`;

const HTMLContentViewer = ({ content, style }) => {
  const [contentHeight, setContentHeight] = useState(100);
  const webViewRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup WebView when component unmounts
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
      }
    };
  }, []);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'contentHeight') {
        setContentHeight(data.height);
      }
    } catch (error) {
      console.warn('Error parsing message:', error);
    }
  };

  // Properly escape the content for JavaScript string
  const escapedContent = content
    ? content
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/"/g, '\\"')
    : '';

  const htmlContent = HTML_TEMPLATE.replace('{{content}}', escapedContent);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={[styles.webview, { height: contentHeight }]}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webview: {
    backgroundColor: 'transparent',
    width: '100%',
  },
});

export default HTMLContentViewer; 