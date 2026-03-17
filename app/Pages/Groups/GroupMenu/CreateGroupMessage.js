import { NODE_BACKEND } from '@env';
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import agent from '@/agent';
import MessageInputBarWeb from '../MessageInputBarWeb';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_ROOT = NODE_BACKEND;

const CreateGroupMessage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId, groupName } = route.params;
  const [sendingMessage, setSendingMessage] = useState(false);
  const messageInputRef = useRef(null);
  const insets = useSafeAreaInsets();

  const handleCreateMessage = async (data) => {
    if (!data.content.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }


      const formData = new FormData(); 

      setSendingMessage(true);

        
      formData.append('message', data.content); 
      formData.append('group_id', groupId); 

      data.images.forEach(image => {
          
            formData.append('images', {
                uri: image.uri,
                type: image.type,
                name: image.fileName,
            }); 
      });
      data.videos.forEach(video => {
        
          formData.append('videos', {
              uri: video.uri,
              type: video.type,
              name: video.fileName,
          }); 
      });
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

      

      try {

        

        let token = await AsyncStorage.getItem('jwt');

        var url = `/messages/createGroupMessage/`;

        const Response = await fetch(`${API_ROOT}${url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        })
        .then((response) => response.json())
        .then((data) => {
          setSendingMessage(false);
           return data;
          
        })
        .catch((error) => {
          setSendingMessage(false);
          return error;
        });
        console.log("Response----------------", Response);

        if(Response && Response.isSuccess && Response.data && Response.data.thread_id){
          
          navigation.navigate('ThreadScreen', { threadId: Response.data.thread_id });

            
        }else{
          setSendingMessage(false);
          Alert.alert(Response);
        }



        //console.log("res",Response)

        
        // await agent.Auth.sendMessage(threadId, formData); // Send form data
      } catch (error) {
        setSendingMessage(false);
          console.error('Error sending message:', error);
      }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Message</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Group Info */}
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{groupName}</Text>
        </View>

        {/* Message Input */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
          <MessageInputBarWeb
            onSend={handleCreateMessage}
            groupId={groupId}
            ref={messageInputRef}
            sending={sendingMessage}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#122b46',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#122b46',
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  groupInfo: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});

export default CreateGroupMessage; 