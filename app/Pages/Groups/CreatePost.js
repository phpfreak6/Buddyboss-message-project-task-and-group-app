import { NODE_BACKEND } from '@env';
import React, { useState, useEffect, useRef, Fragment } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import agent from '@/agent';
import PostInputBarWeb from './PostInputBarWeb';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_ROOT = NODE_BACKEND;

const CreatePost = ({ navigation, route }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const groupId = route.params?.groupId;
  const commentInputRef = useRef(null);
  const [sendingPost, setSendingPost] = useState(false);

  const handleCreatePost = async (data) => {
    try {
      setSendingPost(true);

      const formData = new FormData();

      // Append the content (Quill HTML content)
      formData.append('content', data.content);

      // Append images
      if (data.images && data.images.length > 0) {
        data.images.forEach(image => {
          formData.append('images', {
            uri: image.uri,
            type: image.type,
            name: image.fileName,
          });
        });
      }

      // Append videos
      if (data.videos && data.videos.length > 0) {
        data.videos.forEach(video => {
          formData.append('videos', {
            uri: video.uri,
            type: video.type,
            name: video.fileName,
          });
        });
      }

      // Append documents
      if (data.documents && data.documents.length > 0) {
        const flatDocuments = data.documents.flat();
        flatDocuments.forEach(document => {
          formData.append('documents', {
            uri: document.uri,
            type: document.type,
            name: document.name,
          });
        });
      }

      let token = await AsyncStorage.getItem('jwt');
      const url = `/groups/createGroupPost/${groupId}`;

      const response = await fetch(`${API_ROOT}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const responseData = await response.json();

      if (responseData?.data?.activity_id) {
        Alert.alert('Success', 'Post created successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', responseData?.message || 'Failed to create post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'An error occurred while creating the post.');
    } finally {
      setSendingPost(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
      </View>

      <PostInputBarWeb
          onSend={handleCreatePost} 
          groupId={groupId} 
          ref={commentInputRef}
          sending={sendingPost}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#122b46',
    position: 'relative',
  },
  backButton: {
    padding: 8,
    position: 'absolute',
    left: 8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
});

export default CreatePost; 