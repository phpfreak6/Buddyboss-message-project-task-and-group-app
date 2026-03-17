import { NODE_BACKEND } from '@env';
import React, { useEffect, useState,Fragment,memo, useRef } from 'react';
import { connect } from 'react-redux';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert, Platform, Linking, TextInput, Keyboard } from 'react-native';
import agent from '../../agent'; // Adjust the import based on your project structure
import { useNavigation, useRoute } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RecipientsModal from './RecipientsModal'; 
import SeenRecipientsModal from './SeenRecipientsModal'; 
import EmojiRecipientsModal from './EmojiRecipientsModal'; 
import MessageRenderer from '../../components/MessageRenderer'; 
import EmojiRenderer from '../../components/EmojiRenderer'; 
import MessageInput from '../../components/MessageInput'; // Import the new component
import VideoPlayer from '../../components/Video'; // Import the new VideoPlayer component
import AsyncStorage from '@react-native-async-storage/async-storage';
//import notifee from '@notifee/react-native';
import io from 'socket.io-client';
import FastImage from 'react-native-fast-image';
let RNFS;
if (Platform.OS !== 'web') {
  RNFS = require('react-native-fs');
}
import { StatusBar, PageLoader } from '../../components';
import EditMessageModal from '../../components/EditMessageModal';

const API_ROOT = NODE_BACKEND;

const mapStateToProps = state => ({
  ...state,
  currentUser: state.common.currentUser,
  socketConnection: state.common.socket,
  isLoggedIn: state.common.isLoggedIn,
});
const mapDispatchToProps = dispatch => ({});

const ThreadScreen = memo(({ currentUser = {}, navigation, route, socketConnection }) => { 
  const { threadId, hasRefreshed } = route.params || {};
  const [threadData, setThreadData] = useState([]);
  const [groupData, setGroupData] = useState(null);
  const [recipientsData, setRecipientsData] = useState([]);
  const [page, setPage] = useState(1); // Track the current page
  const [loading, setLoading] = useState(false); 
  const [isModalVisible, setModalVisible] = useState(false); 
  const [isSeenModalVisible, setSeenModalVisible] = useState(false); 
  const [isEmojiModalVisible, setEmojiModalVisible] = useState(false); 
  const [userImages, setUserImages] = useState({}); // State to hold user images
  const [isLoadingMore, setIsLoadingMore] = useState(false); // State to track loading more status
  const scrollViewRef = React.useRef();
  const messageRefs = React.useRef({});
  const pendingScrollToMessage = React.useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [textmessage, setTextmessage] = useState('');
  let [socketMessage, setSocketMessage] = useState(false);
  const [socket, setSocket] = useState(null);
  const [threadExist, setThreadExist] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Map()); // Change to Map to store user details
  const typingTimeoutRef = React.useRef({});

  const [ImageModalVisible, setImageModalVisible] = useState(false);
  const [VideoModalVisible, setVideoModalVisible] = useState(false);

  const [loaderVisible, setLoaderVisible] = useState(true);

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);

  const [showKeyword, setShowKeyword] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [hasMedia, setHasMedia] = useState(false);

  const [seenUsers, setSeenUsers] = useState(null);
  const [showSeenList, setShowSeenList] = useState(null);
  const [emojiRecipientsList, setEmojiRecipientsList] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State to control emoji picker visibility
  const [selectedMessageId, setSelectedMessageId] = useState(null); 
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [editMessageText, setEditMessageText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState(null); // Message being replied to
  const [headerHeight, setHeaderHeight] = useState(Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 60 : 60);
  const headerRef = useRef(null);
  const [showMessageOptionsModal, setShowMessageOptionsModal] = useState(false);
  const [selectedMessageForOptions, setSelectedMessageForOptions] = useState(null);
  const [seenModalLoading, setSeenModalLoading] = useState(false);

  const isFocused = useIsFocused();

  let loaderStop = false

  const [imageLoadProgress, setImageLoadProgress] = useState({});

  const normalizeMediaUrl = (url) => {
    if (!url) return url;
    if (/^(https?:)?\/\//i.test(url) || url.startsWith('file://') || url.startsWith('content://')) {
      return url;
    }
    if (url.startsWith('/')) return `${API_ROOT}${url}`;
    return `${API_ROOT}/${url}`;
  };

  const handleImagePress = (uri) => {
    setSelectedImage(uri);
    setImageModalVisible(true);
  };

  const handleVideoPress = (uri) => {
    setVideoError(null);
    setVideoLoading(true);
    setSelectedVideo(normalizeMediaUrl(uri));
    setVideoModalVisible(true);
  };

  const handleCloseModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };
  useEffect(() => {
    if (showKeyword && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: false });
      }, 100); // slight delay to ensure layout is updated
    }
  }, [showKeyword]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setShowKeyword(true);
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setShowKeyword(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (socketConnection) {
      const handleResponse = (data) => {
        console.log('Received from server:', data);
      };

      const handleSeenUser = async (data) => {
        // Update per-message seen users based on socket event
        if (data && data.thread_id === threadId && (data.messageId || data.id)) {
          const messageId = data.messageId || data.id;
          let seenUserss = [];

          if (Array.isArray(data.seenUsers) && data.seenUsers.length > 0) {
            seenUserss = data.seenUsers
              .map(id => parseInt(id))
              .filter(userId => userId !== parseInt(currentUser.user.id));
          }

          if (seenUserss.length > 0) {
            setThreadData(prev =>
              prev.map(m =>
                m.id === messageId
                  ? { ...m, seenUsers: seenUserss }
                  : m
              )
            );
          }
        }
      };
      const handleSendReaction = async (data) => {
        if(data && data.messageId){

          getReactions(data.messageId);
          
        }
      };
  
      const handleSendMessageRes = (data) => {

       // console.log("data------",JSON.stringify(data,null,2))

        if(data && data.message && data.message.id){

          if(data.message.thread_id == threadId){

              if (data.message.sender_id && typingTimeoutRef.current[data.message.sender_id]) {
                clearTimeout(typingTimeoutRef.current[data.message.sender_id]);
                setTypingUsers(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(data.message.sender_id);
                  return newMap;
                });
              }
              setThreadData(prevThreadData => [...prevThreadData, data.message]);

              if(scrollViewRef.current) {

                setTimeout(() => {
                  //Alert.alert("scrollToEnd");
                  scrollViewRef.current.scrollToEnd({ animated: false });
                }, 400);

              }


              if(data.recipientIds && data.recipientIds.length > 0){
                socketConnection.emit('seenUser', {
                  userIds: data.recipientIds,
                  messageId: data.message.id,
                  userId: currentUser.user.id
                });
              }
          }

          
        }else{
          loaderStop = true;
          socketMessage = true;
          setPage(1);
          setSocketMessage(true);
          fetchThreadData(1);
        }


       

      };
      
      const handleEditMessageRes = (data) => {

       // console.log("data------",JSON.stringify(data,null,2))

        if(data && data.message && data.message.id){

          if(data.message.thread_id == threadId){
            setThreadData((prev) => prev.map(m => m.id === data.message.id ? { ...m, message: data.message.message } : m));
          }

          
        }else{
          loaderStop = true;
          socketMessage = true;
          setPage(1);
          setSocketMessage(true);
          fetchThreadData(1);
        }


       

      };

      const handleDeleteMessageRes = (data) => {

        if(data && data.messageIds && data.messageIds.length > 0){

          setThreadData((prev) => prev.map(m => data.messageIds.includes(m.id) ? { ...m, is_deleted: true } : m));

        }

      };

      const handleTypingStart = (data) => {
        if (data.threadId === threadId) {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(data.userId, data.typingUser);
            return newMap;
          });
          
          // Clear existing timeout for this user
          if (typingTimeoutRef.current[data.userId]) {
            clearTimeout(typingTimeoutRef.current[data.userId]);
          }
          
          // Set new timeout to remove typing indicator after 3 seconds
          typingTimeoutRef.current[data.userId] = setTimeout(() => {
            setTypingUsers(prev => {
              const newMap = new Map(prev);
              newMap.delete(data.userId);
              return newMap;
            });
          }, 3000);
        }
      };

      const handleSeenUserMultipleMessagesResponse = async (data) => {

        //console.log("data",data);
        if (
          data &&
          Array.isArray(data.messageIds) &&
          data.messageIds.length > 0 &&
          data.userId &&
          data.userId !== currentUser.user.id
        ) {
          setThreadData((prevThreadData) =>
            prevThreadData.map(m => {
              if (data.messageIds.includes(m.id)) {
                // Add data.userId to seenUsers, ensure no duplicates
                const currentSeenUsers = Array.isArray(m.seenUsers) ? m.seenUsers : [];
                // Avoid adding user twice
                const newSeenUsers = currentSeenUsers.includes(data.userId)
                  ? currentSeenUsers
                  : [...currentSeenUsers, data.userId];
                return { ...m, seenUsers: newSeenUsers };
              }
              return m;
            })
          );
        }
      };
  
      socketConnection.on('response', handleResponse);
      socketConnection.on('sendMessageRes', handleSendMessageRes);
      socketConnection.on('editMessageRes', handleEditMessageRes);
      socketConnection.on('deleteMessageRes', handleDeleteMessageRes);
      socketConnection.on('typingStart', handleTypingStart);
      socketConnection.on('seenUser', handleSeenUser);
      socketConnection.on('sendReaction', handleSendReaction);
      socketConnection.on('seenUserMultipleMessagesResponse', handleSeenUserMultipleMessagesResponse);
  
      return () => {
        socketConnection.off('response', handleResponse);
        socketConnection.off('sendMessageRes', handleSendMessageRes);
        socketConnection.off('editMessageRes', handleEditMessageRes);
        socketConnection.off('deleteMessageRes', handleDeleteMessageRes);
        socketConnection.off('typingStart', handleTypingStart);
        socketConnection.off('seenUser', handleSeenUser);
        socketConnection.off('sendReaction', handleSendReaction);
        socketConnection.off('seenUserMultipleMessagesResponse', handleSeenUserMultipleMessagesResponse);
        Object.values(typingTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [socketConnection, threadId]);

  const handleDownload = () => {
    if (selectedImage) {
      Linking.openURL(selectedImage); // This will open the image URL in the default browser
    }
  };
  const handleDownloadDocument = (document) => {
    Linking.openURL(document); 
  };

  const downloadDocument = async (url, guid) => {
    try {
      var filename = guid.split('/').pop(); // Extract filename from URL
      filename = filename.replace(/[-_ \s!@#$%^&*()+={}[\]:;'"<>?,\/\\|`~]/g, '');
      const path = `${RNFS.DownloadDirectoryPath}/${filename}`; 
      const options = {
        fromUrl: url,         // The file URL
        toFile: path,         // Destination path
        background: true,
        begin: () => console.log('Download started'),
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          console.log(`Download progress: ${progress.toFixed(2)}%`);
        },
      };
  
      const downloadResult = await RNFS.downloadFile(options).promise;
  
      if (downloadResult.statusCode === 200) {
        Alert.alert('Download Complete', `File saved to ${path}`);
      } else {
        Alert.alert('Download Failed', `Status code: ${downloadResult.statusCode}`);
      }
    } catch (error) {
      console.error('Download Error:', error);
      Alert.alert('Download Error', error.message);
    }
  };
  

 

  const fetchThreadData = async (pageNumber) => {
    if (loading) return; // Prevent multiple requests

    if(loaderStop != true){
      setLoading(true);
    }
    let oldHeight = 0;
    if (scrollViewRef.current) {
      oldHeight = contentHeight;
    }
    
    try {
      //await notifee.setBadgeCount(0);
      if(pageNumber == 1){
        if(loaderStop != true){
          setLoaderVisible(true);
        }
       
      }
      loaderStop = false;
     
      const Response = await agent.Auth.getThreadMessages(threadId, pageNumber); // Pass the page number



      if(socketMessage){
        socketMessage = false;
        setPage(1);
        setSocketMessage(false);
        setThreadData([]);
        if(scrollViewRef.current) {
     
          setTimeout(() => {
            //Alert.alert("scrollToEnd");
            scrollViewRef.current.scrollToEnd({ animated: false });
          }, 1000);
        }
         
      }
      if (Response && Response.data && Response.data.messagesData && Response.data.messagesData.recipients && Response.data.messagesData.recipients.length > 0) {
        const { recipients } = Response.data.messagesData;
        const filteredRecipients = recipients.filter(recipient => recipient.user_id !== currentUser.user.id);
        setRecipientsData(filteredRecipients);
      } 
      if (Response && Response.data && Response.data.messagesData && Response.data.messagesData.group && Response.data.messagesData.group.id) {
        const { group } = Response.data.messagesData;
        setGroupData(group);
      } 

      if (Response && Response.data && Response.data.messagesData && Response.data.messagesData.messages && Response.data.messagesData.messages.length > 0) {
        const { messages } = Response.data.messagesData;
        const sortedMessages = messages.sort((a, b) => new Date(a.date_sent) - new Date(b.date_sent)); // Sort messages by date_sent in ascending order
        
        // Debug: Check message structure for reply data
        const messagesWithReply = sortedMessages.filter(m => m.reply_to || m.replyTo || m.reply_to_message);
        if (messagesWithReply.length > 0) {
          // console.log('Messages with reply data:', messagesWithReply.map(m => ({
          //   id: m.id,
          //   reply_to: m.reply_to,
          //   replyTo: m.replyTo,
          //   reply_to_message: m.reply_to_message,
          //   replyToMessage: m.replyToMessage
          // })));
        }
        
        setThreadData(prevData => [...sortedMessages, ...prevData]); // Prepend new messages to the top

        setPage(pageNumber); 
      } 
      
      
      setLoaderVisible(false);
      setTimeout(() => {
        if (scrollViewRef.current && oldHeight > 0) {
          
          const newHeight = contentHeight;
          const scrollDiff = newHeight - (oldHeight - 1300);

          scrollViewRef.current.scrollTo({ y: scrollDiff, animated: false });
        }
      }, 10);


      

    } catch (error) {
      setLoaderVisible(false);
      console.error('Error fetching thread data:', error);
    } finally {
      setLoaderVisible(false);
      setLoading(false);
      setIsLoadingMore(false); // Set loading more to false when done
    }
  };
  const handleMessage = (query) => {
    setTextmessage(query);
    // Emit typing event
    if (socketConnection) {

      if(recipientsData && recipientsData.length > 0){
        const userIds = recipientsData.map(item => item.user_id);

       // userIds.push(currentUser.user.id)


        socketConnection.emit('typingStart', {
          threadId,
          userIds,
          typingUser: currentUser.user.display_name,
          userId: currentUser.user.id
        });
      }
      
    }
  };
  const handleSendMessage = async (messageText) => {
      const formData = new FormData(); // Create a new FormData object

      setLoaderVisible(true);

      
      // Append the message and images to the form data
      formData.append('message', messageText.message); // Append the message text
      
      // Add reply_to if replying to a message
      if (replyingToMessage && replyingToMessage.id) {
        console.log('Adding reply_to to formData:', replyingToMessage.id);
        formData.append('reply_to', replyingToMessage.id.toString());
      } else {
        console.log('No reply_to - replyingToMessage:', replyingToMessage);
      }
      
      messageText.images.forEach(image => {
        
          formData.append('images', {
              uri: image.uri,
              type: image.type,
              name: image.fileName,
          }); // Append each image to the form data
      });
      messageText.videos.forEach(video => {
        
          formData.append('videos', {
              uri: video.uri,
              type: video.type,
              name: video.fileName,
          }); // Append each image to the form data
      });
      if (messageText.documents && messageText.documents.length > 0) {
        // Flatten the array
        const flatDocuments = messageText.documents.flat();

    
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

        var url = `/messages/sendMessage/?threadId=${threadId}`;

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
          setLoaderVisible(false);
           return data;
          
        })
        .catch((error) => {
          setLoaderVisible(false);
          return error;
        });

        if(Response && Response.isSuccess && Response.data && Response.data.message_id){
          setLoaderVisible(false);
          
          // Clear reply state after successful send
          if (replyingToMessage) {
            setReplyingToMessage(null);
          }

          if (socketConnection) {

            //console.log("recipientsData", recipientsData);

            const recipientIds = recipientsData.map(recipient => recipient.user_id);
            // const userFcmTokens = recipientsData.reduce((acc, item) => {
            //                         const fcm = item.userData?.fcmToken;
            //                         if (fcm) { // ensures fcm is not null, undefined, or empty string
            //                           acc[item.user_id] = fcm;
            //                         }
            //                         return acc;
            //                       }, {});

            const fcmTokenUsers = recipientIds;
            recipientIds.push(currentUser.user.id)

            var dataMessages = {
              recipientIds,
              messageId: Response.data.message_id
            }
            socketConnection.emit('sendmessage', dataMessages);
            socketConnection.emit('fcmTokens', {fcmTokenUsers,messageId: Response.data.message_id});
            
          }

         // Alert.alert("Message send successfully");
            
        }else{
          setLoaderVisible(false);
          Alert.alert(Response.message);
        }



        //console.log("res",Response)

        
        // await agent.Auth.sendMessage(threadId, formData); // Send form data
      } catch (error) {
        setLoaderVisible(false);
          console.error('Error sending message:', error);
      }
  };

  const seenMessage = async (messageId) => {

    try {
      const Response = await agent.Auth.seenMessage(messageId);
      //getSeenUsers(messageId)

    } catch (error) { 
      console.error('Error fetching messages:', error);
    }
    
  };
  const getSeenUsers = async (messageId) => {
    setSeenModalLoading(true);
    setSeenModalVisible(true);
    setShowSeenList(null);

    try {
      const Response = await agent.Auth.getSeenUsers(messageId);
      let seenRecipients = [];

      if (Response && Response.isSuccess && Response.data && Response.data.seenMessageData && Response.data.seenMessageData.length > 0) {
        const seenUserIds = Response.data.seenMessageData.map(id => parseInt(id));

        seenRecipients = recipientsData.filter(recipient =>
          recipient.user_id !== currentUser.user.id &&
          seenUserIds.includes(recipient.user_id)
        );
      }

      setSeenUsers(seenRecipients && seenRecipients.length > 0 ? seenRecipients : null);
      setShowSeenList(seenRecipients || []);
    } catch (error) { 
      console.error('Error fetching messages:', error);
    } finally {
      setSeenModalLoading(false);
    }
  };


  const handleLoadMore = () => {
    if (loading || isLoadingMore) return; // Prevent multiple loads
    setIsLoadingMore(true); // Set loading more to true
    fetchThreadData(page + 1); // Load the next page
  };
  const fetchDataMain = async () => {
    setThreadData([]);
    fetchThreadData(page);


    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: false });
      }
    }, 1000);
  }
  

  

  useEffect(() => {
    fetchDataMain();
  }, [threadId, hasRefreshed]);

  useEffect(() => {
    if(hasRefreshed){
      navigation.setParams({ hasRefreshed: false });
    }
  }, [hasRefreshed]);

  

  useEffect(() => {
    if (threadData && threadData.length > 0) {
      const lastMessageData = threadData.at(-1);

      if (lastMessageData && lastMessageData.id) {
        // Mark the latest message as seen for current user on the server
        seenMessage(lastMessageData.id);

        // Notify other participants that this message has been seen
        if (socketConnection && recipientsData && recipientsData.length > 0) {
          const userIds = recipientsData.map(item => item.user_id);
          socketConnection.emit('seenUser', {
            userIds,
            messageId: lastMessageData.id,
            userId: currentUser.user.id
          });
        }
      }
    }

    if (threadData && threadData.length > 0 && threadExist) {
      setThreadExist(false);
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: false });
        }
      }, 100);
    }
  }, [threadId, threadData]);

  // Handle pending scroll to message after it's loaded
  useEffect(() => {
    if (pendingScrollToMessage.current && threadData.length > 0) {
      const messageId = pendingScrollToMessage.current;
      const messageIndex = threadData.findIndex(m => m.id === messageId);
      
      if (messageIndex !== -1) {
        // Message found, scroll to it
        performScrollToMessage(messageId, messageIndex);
        pendingScrollToMessage.current = null;
      }
    }
  }, [threadData]);


  const width = Dimensions.get('window').width; // Get the width of the window

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // Function to handle adding a reaction to a message
  const handleAddReaction = async (messageId, emoji) => {
    try {
      // Check if user already reacted with this emoji
      var response = await agent.Auth.addReaction(messageId, emoji);

      if (response && response.isSuccess) {
        getReactions(messageId);
        if(socketConnection){

          if(recipientsData && recipientsData.length > 0){
            const userIds = recipientsData.map(item => item.user_id);
            socketConnection.emit('sendReaction', {
              userIds,
              messageId: messageId,
              userId: currentUser.user.id
            });
          }
        }
      }
      
      // Close the emoji picker
      setShowEmojiPicker(false);
      setSelectedMessageId(null);
    } catch (error) {
      console.error('Error handling reaction:', error);
      Alert.alert('Error', 'Failed to update reaction. Please try again.');
    }
  };
  
  const getReactions = async (messageId) => {
    try {
        var reactions = await agent.Auth.getReactions(messageId);

        if(reactions && reactions.data && reactions.data.getReactionsData && reactions.data.getReactionsData.length > 0){

          setThreadData(prevThreadData => 
            prevThreadData.map(message => {
              if (message.id === messageId) {
                // Update the message's emojis with the new reaction data
                return {
                  ...message,
                  emojis: reactions.data.getReactionsData
                };
              }
              return message;
            })
          );
        }else{

          setThreadData(prevThreadData => 
            prevThreadData.map(message => {
              if (message.id === messageId) {
                // Update the message's emojis with the new reaction data
                return {
                  ...message,
                  emojis: []
                };
              }
              return message;
            })
          );
        }
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
  };
  const handleOpenReactions = async (messageId) => {
    try {
        var reactions = await agent.Auth.getReactions(messageId);

        

        if(reactions && reactions.data && reactions.data.getReactionsData && reactions.data.getReactionsData.length > 0){

          const reactionsData = reactions.data.getReactionsData;

          const userImojiData = [];
          

          reactionsData.forEach(reaction => {
              // Split the reaction into userId and emojiEntity
              const [userId, emojiEntity] = reaction.split('___');
      
              // Convert the HTML entity to an emoji
              const emoji = emojiEntity; 
      
              // Find user data from recipientsData
              var userData = recipientsData.find(r => r.user_id === parseInt(userId));

              if(!userData && parseInt(userId) === currentUser.user.id){

                userData = currentUser.user;


              }else{
                userData = userData.userData;
              }
               
              
              if(userData && userData.id){
                userImojiData.push({emoji,userData})
              }
      
          });
          if(userImojiData.length > 0){

            //console.log(userImojiData)

            setEmojiRecipientsList(userImojiData);
            setEmojiModalVisible(true);
             
          }else{
            setEmojiRecipientsList(null);
          }
         
        }
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
  };



  // Function to open emoji picker for a specific message
  const openEmojiPicker = (messageId) => {
    setSelectedMessageId(messageId);
    setShowEmojiPicker(true);
  };

  // Helper: is this message selected?
  const isMessageSelected = (id) => selectedMessageIds.includes(id);

  // Helper: does this message have seen users (excluding current user)?
  const messageHasSeenUsers = (message) => {
    if (!message || !Array.isArray(message.seenUsers) || message.seenUsers.length === 0) return false;
    const others = message.seenUsers
      .map(id => parseInt(id))
      .filter(userId => userId !== currentUser.user.id);
    return others.length > 0;
  };

  // Handle reply to message
  const handleReplyToMessage = (message) => {
    const isDeleted = !!message.is_deleted;
    if (!isDeleted) {
      console.log('Setting reply to message:', message.id, message);
      setReplyingToMessage(message);
      setSelectionMode(false);
      setSelectedMessageIds([]);
    }
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingToMessage(null);
  };

  // Helper function to perform the actual scroll
  const performScrollToMessage = (messageId, messageIndex) => {
    console.log('Performing scroll to message:', messageId, 'at index:', messageIndex);
    // Wait a bit longer if message was just loaded
    const delay = pendingScrollToMessage.current === messageId ? 600 : 300;
    
    setTimeout(() => {
      setLoaderVisible(false);
      if (!scrollViewRef.current) {
        console.log('ScrollView ref not available');
        return;
      }
      
      const messageRef = messageRefs.current[messageId];
      console.log('Message ref available:', !!messageRef);
      if (messageRef && messageRef.measureLayout) {
        // Try to use measureLayout to get exact position
        messageRef.measureLayout(
          scrollViewRef.current,
          (x, y, width, height) => {
            console.log('Measured position:', { x, y, width, height });
            // For inverted ScrollView, scroll to the measured position
            setTimeout(() => {
              if (scrollViewRef.current) {
                const scrollY = Math.max(0, y - 150);
                console.log('Scrolling to Y:', scrollY);
                // Scroll to position with some padding to center it
                scrollViewRef.current.scrollTo({ y: scrollY, animated: true });
                
                // Highlight the message after scroll animation completes
                setTimeout(() => {
                  setHighlightedMessageId(messageId);
                  // Remove highlight after 2.5 seconds
                  setTimeout(() => {
                    setHighlightedMessageId(null);
                  }, 2500);
                }, 500); // Wait for scroll animation to complete
              }
            }, 100);
          },
          (error) => {
            console.log('Error measuring layout, using fallback:', error);
            // Fallback to index-based calculation
            scrollToMessageByIndex(messageIndex, messageId);
          }
        );
      } else {
        // Fallback to index-based calculation
        scrollToMessageByIndex(messageIndex, messageId);
      }
    }, delay);
  };

  // Scroll to a specific message
  const scrollToMessage = async (messageId) => {
    if (!scrollViewRef.current) return;
    
    console.log('Scrolling to message:', messageId);
    
    // First check if message exists in current threadData
    let messageIndex = threadData.findIndex(m => m.id === messageId);
    console.log('Message index in current data:', messageIndex);
    
    // If message not found, try to load it from other pages
    if (messageIndex === -1) {
      console.log('Message not found, loading from other pages...');
      setLoaderVisible(true);
      pendingScrollToMessage.current = messageId;
      
      try {
        // Try to find the message by loading pages
        // Since older messages are on earlier pages, we'll load from page 1
        let found = false;
        let currentPage = 1;
        const maxPagesToLoad = 10; // Limit to prevent infinite loading
        let allLoadedMessages = [];
        
        while (!found && currentPage <= maxPagesToLoad) {
          const pageResponse = await agent.Auth.getThreadMessages(threadId, currentPage);
          
          if (pageResponse && pageResponse.data && pageResponse.data.messagesData && pageResponse.data.messagesData.messages) {
            const messages = pageResponse.data.messagesData.messages;
            const sortedMessages = messages.sort((a, b) => new Date(a.date_sent) - new Date(b.date_sent));
            
            // Add all messages from this page to accumulated list
            allLoadedMessages = [...allLoadedMessages, ...sortedMessages];
            
            // Check if the message we're looking for is in this page
            const foundMessage = messages.find(m => m.id === messageId);
            
            if (foundMessage) {
              found = true;
              console.log('Found message on page:', currentPage);
              break;
            }
          } else {
            // No more messages available
            break;
          }
          
          currentPage++;
        }
        
        if (found && allLoadedMessages.length > 0) {
          // Verify the message is in the loaded messages
          const messageExists = allLoadedMessages.find(m => m.id === messageId);
          if (!messageExists) {
            console.error('Message not found in loaded messages even though found flag is true');
            setLoaderVisible(false);
            pendingScrollToMessage.current = null;
            Alert.alert('Error', 'Message could not be loaded properly.');
            return;
          }
          
          // Merge loaded messages with existing threadData
          setThreadData(prevData => {
            const allMessages = [...prevData, ...allLoadedMessages];
            const uniqueMessages = Array.from(
              new Map(allMessages.map(msg => [msg.id, msg])).values()
            );
            const sorted = uniqueMessages.sort((a, b) => new Date(a.date_sent) - new Date(b.date_sent));
            
            // Double check the message is in the final array
            const finalCheck = sorted.find(m => m.id === messageId);
            console.log('Message in final threadData:', !!finalCheck);
            
            return sorted;
          });
          // Highlight will be handled by useEffect when threadData updates
        } else {
          setLoaderVisible(false);
          pendingScrollToMessage.current = null;
          Alert.alert('Message not found', 'The original message may have been deleted or is too far back.');
          return;
        }
      } catch (error) {
        setLoaderVisible(false);
        pendingScrollToMessage.current = null;
        console.error('Error loading message:', error);
        Alert.alert('Error', 'Failed to load the original message.');
        return;
      }
    } else {
      // Message already loaded, scroll to it immediately
      performScrollToMessage(messageId, messageIndex);
    }
  };

  // Fallback scroll function using index
  const scrollToMessageByIndex = (messageIndex, messageId = null) => {
    if (!scrollViewRef.current || messageIndex < 0 || messageIndex >= threadData.length) return;
    
    // For inverted ScrollView:
    // - Lower index = older message = further from visual top = need to scroll more
    // - Higher index = newer message = closer to visual top = need to scroll less
    const approximateMessageHeight = 120;
    const dateHeaderHeight = 40;
    
    // Count date headers before this message (including its own date header if it's the first of that date)
    let dateHeadersBefore = 0;
    for (let i = 0; i <= messageIndex; i++) {
      if (i === 0 || formatDate(threadData[i].date_sent) !== formatDate(threadData[i - 1].date_sent)) {
        dateHeadersBefore++;
      }
    }
    
    // Calculate position: messages before + date headers before
    const estimatedPosition = (messageIndex * approximateMessageHeight) + (dateHeadersBefore * dateHeaderHeight);
    
    setTimeout(() => {
      if (scrollViewRef.current) {
        // Scroll to the calculated position with animation
        scrollViewRef.current.scrollTo({ y: Math.max(0, estimatedPosition), animated: true });
        
        // Highlight the message after scroll animation completes
        if (messageId) {
          setTimeout(() => {
            setHighlightedMessageId(messageId);
            // Remove highlight after 2.5 seconds
            setTimeout(() => {
              setHighlightedMessageId(null);
            }, 2500);
          }, 500); // Wait for scroll animation to complete
        }
      }
    }, 200);
  };

  // Handle delete single message
  const handleDeleteMessage = async (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoaderVisible(true);
            try {
              await agent.Auth.deleteMessage(messageId);
              setThreadData((prev) => prev.map(m => m.id === messageId ? { ...m, is_deleted: true } : m));
              if (socketConnection) {
                const recipientIds = recipientsData.map(recipient => recipient.user_id);
                const fcmTokenUsers = recipientIds;
                recipientIds.push(currentUser.user.id);
                
                var dataMessages = {
                  recipientIds,
                  messageIds: [messageId]
                };
                socketConnection.emit('deletemessage', dataMessages);
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to delete message');
            }
            setLoaderVisible(false);
          }
        }
      ]
    );
  };

  // Handle edit single message
  const handleEditMessage = (message) => {
    setEditMessageText(message?.message || '');
    setSelectedMessageIds([message.id]);
    setShowEditModal(true);
  };

  // Handle long press on message
  const handleLongPressMessage = (message) => {
    const isDeleted = !!message.is_deleted;
    if (isDeleted) return;
    
    if (Platform.OS === 'android') {
      // On Android, use a custom modal since Alert.alert only shows 3 buttons
      setSelectedMessageForOptions(message);
      setShowMessageOptionsModal(true);
    } else {
      // On iOS, use Alert.alert
      if (message.userData.id === currentUser.user.id) {
        // Own message - show all options; Info only when message has seen users
        const ownOptions = [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reply', onPress: () => handleReplyToMessage(message) },
          { text: 'Edit', onPress: () => handleEditMessage(message) },
          { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMessage(message.id) },
          { text: 'Select', onPress: () => { setSelectionMode(true); setSelectedMessageIds([message.id]); } }
        ];
        if (messageHasSeenUsers(message)) {
          ownOptions.push({ text: 'Info', onPress: () => getSeenUsers(message.id) });
        }
        Alert.alert('Message Options', '', ownOptions);
      } else {
        // Other user's message - Reply and Info only when message has seen users
        const otherOptions = [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reply', onPress: () => handleReplyToMessage(message) }
        ];
        if (messageHasSeenUsers(message)) {
          otherOptions.push({ text: 'Info', onPress: () => getSeenUsers(message.id) });
        }
        Alert.alert('Message Options', '', otherOptions);
      }
    }
  };

  // Handle option selection from modal (Android)
  const handleOptionSelect = (option) => {
    setShowMessageOptionsModal(false);
    const message = selectedMessageForOptions;
    
    if (!message) return;
    
    switch (option) {
      case 'reply':
        handleReplyToMessage(message);
        break;
      case 'edit':
        if (message.userData.id === currentUser.user.id) {
          handleEditMessage(message);
        }
        break;
      case 'delete':
        if (message.userData.id === currentUser.user.id) {
          handleDeleteMessage(message.id);
        }
        break;
      case 'select':
        if (message.userData.id === currentUser.user.id) {
          setSelectionMode(true);
          setSelectedMessageIds([message.id]);
        }
        break;
      case 'info':
        getSeenUsers(message.id);
        break;
      default:
        break;
    }
    
    setSelectedMessageForOptions(null);
  };

  // Handle tap on message in selection mode
  const handleSelectMessage = (message) => {
    const isDeleted = !!message.is_deleted;
    if (!selectionMode) return;
    if (message.userData.id !== currentUser.user.id) return;
    if (isDeleted) return;
    setSelectedMessageIds((prev) => {
      if (prev.includes(message.id)) {
        // Deselect
        const next = prev.filter((id) => id !== message.id);
        if (next.length === 0) setSelectionMode(false);
        return next;
      } else {
        // Select
        return [...prev, message.id];
      }
    });
  };

  // Cancel selection mode
  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedMessageIds([]);
  };

  // Handle delete
  const handleDeleteSelected = async () => {
    Alert.alert(
      'Delete Message' + (selectedMessageIds.length > 1 ? 's' : ''),
      `Are you sure you want to delete the selected message${selectedMessageIds.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setLoaderVisible(true);
            try {
              for (const id of selectedMessageIds) {
                await agent.Auth.deleteMessage(id);
              }
              setThreadData((prev) => prev.map(m => selectedMessageIds.includes(m.id) ? { ...m, is_deleted: true } : m));
              if (socketConnection) {


                const recipientIds = recipientsData.map(recipient => recipient.user_id);
                const fcmTokenUsers = recipientIds;
                recipientIds.push(currentUser.user.id)
      
                var dataMessages = {
                  recipientIds,
                  messageIds: selectedMessageIds
                }
                //console.log("dataMessages",dataMessages);
                socketConnection.emit('deletemessage', dataMessages);
                
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to delete message(s)');
            }
            setLoaderVisible(false);
            handleCancelSelection();
          }
        }
      ]
    );
  };

  // Handle edit
  const handleEditSelected = () => {
    if (selectedMessageIds.length === 1) {
      const msg = threadData.find(m => m.id === selectedMessageIds[0]);
      setEditMessageText(msg?.message || '');
      setShowEditModal(true);
    }
  };

  // Save edit
  const handleSaveEdit = async (newContent) => {
    if (selectedMessageIds.length !== 1) return;
    setLoaderVisible(true);
    try {
      const id = selectedMessageIds[0];
      const res = await agent.Auth.editMessage(id, newContent);

      console.log("res",res);


      if (res && res.isSuccess && res.data.message_id && res.data.message) {
        setThreadData((prev) => prev.map(m => m.id === id ? { ...m, message: res.data.message } : m));
     
        if (socketConnection) {


          const recipientIds = recipientsData.map(recipient => recipient.user_id);
          const fcmTokenUsers = recipientIds;
          recipientIds.push(currentUser.user.id)

          var dataMessages = {
            recipientIds,
            messageId: id
          }
          //console.log("dataMessages",dataMessages);
          socketConnection.emit('editmessage', dataMessages);
          
        }
      } else {
        Alert.alert('Error', res?.message || 'Failed to edit message');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to edit message');
    }
    setLoaderVisible(false);
    setShowEditModal(false);
    handleCancelSelection();
  };

  if (!threadData) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View 
        ref={headerRef}
        style={styles.header}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setHeaderHeight(height + (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0));
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.middleText}>
          <View style={[styles.headerTitle, { width: 200 }]} numberOfLines={1}>
            {groupData && groupData.name 
              ? (
                <Text style={styles.headerTitle.text}>
                  {groupData.name.length > 25
                    ? groupData.name.substring(0, 25) + '...' 
                    : groupData.name 
                  }
                </Text>
              ) : (recipientsData && recipientsData.length > 0 
                ? (
                  <Text style={styles.headerTitle.text}>
                    {recipientsData.map(recipient => recipient.userData.display_name).join(', ').length > 25 
                      ? recipientsData.map(recipient => recipient.userData.display_name).join(', ').substring(0, 25) + '...' 
                      : recipientsData.map(recipient => recipient.userData.display_name).join(', ') 
                    }
                  </Text>
                ) 
                : <Text style={styles.headerTitle.text}>No recipients</Text>
              )}
          </View>
          {((groupData && groupData.name && recipientsData.length > 0) || (recipientsData && recipientsData.length > 1)) && (
            <TouchableOpacity onPress={() => setModalVisible(true)}> 
              <View>
                <Text style={[styles.recipientCount, { textAlign: 'center', alignSelf: 'center' }]}>
                  {recipientsData.length} people
                  <Ionicons name="chevron-down" size={16} color="gray" />
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity>
          {/* <Ionicons name="ellipsis-vertical" size={24} color="black" /> */}
        </TouchableOpacity>
      </View>
      {selectionMode && (
      <View style={{
        position: 'absolute',
        top: 11,
        left: 0,
        right: 0,
        zIndex: 1000,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 10,
      }}>
        <TouchableOpacity onPress={handleCancelSelection} style={{ padding: 6, borderRadius: 20, backgroundColor: '#f2f2f2', marginRight: 10 }}>
          <Ionicons name="close" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#122b46', flex: 1 }}>{selectedMessageIds.length} selected</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {selectedMessageIds.length === 1 && (
            <TouchableOpacity onPress={handleEditSelected} style={{ padding: 6, borderRadius: 20, backgroundColor: '#f2f2f2', marginRight: 16 }}>
              <Ionicons name="create-outline" size={26} color="#122b46" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleDeleteSelected} style={{ padding: 6, borderRadius: 20, backgroundColor: '#f2f2f2' }}>
            <Ionicons name="trash" size={26} color="#e53935" />
          </TouchableOpacity>
        </View>
      </View>
    )}
      <View style={{ 
        flex: 1, 
        marginTop: 10, 
        marginBottom: Platform.OS === 'ios' 
          ? (keyboardHeight > 0 ? keyboardHeight + 120 : 150) + (hasMedia ? 90 : 0) // 120px base + 90px for media preview if media exists
          : (keyboardHeight > 0 ? keyboardHeight + 150 : 150) + (hasMedia ? 90 : 0) // 150px base + 90px for media preview if media exists
      }}>
        <ScrollView 
          ref={scrollViewRef} // Attach the ref to the ScrollView
          onScroll={({ nativeEvent }) => {
            if (isCloseToTop(nativeEvent)) {
              handleLoadMore(); // Load more messages when at the top
            }
          }} 
          onContentSizeChange={(w, h) => {
            setContentHeight(h);
          }}
          scrollEventThrottle={16}
          inverted // This prop will invert the scroll direction
          style={Platform.OS === 'web' ? { height: '75vh' } : {}}
        >
          {/* Display loader when fetching more messages */}
          {isLoadingMore && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#0000ff" />
            </View>
          )}
          
          {threadData.length > 0 && Object.entries(threadData.reduce((acc, message) => {
            const messageDate = formatDate(message.date_sent);
            if (!acc[messageDate]) {
              acc[messageDate] = { date: messageDate, messages: [] };
            }
            acc[messageDate].messages.push(message);
            return acc;
          }, {})).map(([dateGroup, { messages }], index) => (
            <View key={`date-group-${dateGroup}-${index}`}>
              <Text style={styles.dateHeader}>{dateGroup}</Text>
              {messages.map((message, msgIndex) => {
                const isOwnMessage = message.userData.id === currentUser.user.id;
                const isDeleted = !!message.is_deleted;
                const selected = isMessageSelected(message.id) && !isDeleted;
                // Compute per-message status for own messages
                let perMessageStatus = null;
                if (isOwnMessage && !isDeleted) {
                  let seenUsersForMessage = [];
                  if (Array.isArray(message.seenUsers) && message.seenUsers.length > 0) {
                    seenUsersForMessage = message.seenUsers
                      .map(id => parseInt(id))
                      .filter(userId => userId !== currentUser.user.id);
                  }

                  if (seenUsersForMessage.length > 0) {
                    perMessageStatus = 'Seen';
                  } else if (
                    message.messageMeta &&
                    message.messageMeta.message_status &&
                    message.messageMeta.message_status === 'sent'
                  ) {
                    perMessageStatus = 'Sent';
                  } else {
                    perMessageStatus = null;
                  }
                }
                return (
                  <View
                    key={`message-wrapper-${message.id}-${msgIndex}`}
                    ref={(ref) => {
                      if (ref) {
                        messageRefs.current[message.id] = ref;
                      }
                    }}
                  >
                    <TouchableOpacity
                      key={`message-${message.id}-${msgIndex}`}
                      style={[
                        styles.messageContainer,
                        isOwnMessage ? styles.messageContainerRight : styles.messageContainerLeft,
                        selected && { backgroundColor: '#d0e6fd' },
                        highlightedMessageId === message.id && styles.messageHighlighted
                      ]}
                      onLongPress={() => handleLongPressMessage({ ...message, is_deleted: isDeleted })}
                      onPress={() => handleSelectMessage({ ...message, is_deleted: isDeleted })}
                      activeOpacity={selectionMode ? 0.7 : 1}
                      disabled={(!isOwnMessage && selectionMode) || isDeleted}
                    >
                    {!isOwnMessage && (
                      <View style={styles.userImageContainer}>
                        <FastImage
                          source={{ uri: message.userData.image }}
                          style={styles.userImage}
                          onLoadStart={() => setImageLoadProgress(prev => ({...prev, [message.id]: 0}))}
                          onProgress={({ nativeEvent }) => {
                            const progress = nativeEvent.loaded / nativeEvent.total;
                            setImageLoadProgress(prev => ({...prev, [message.id]: progress}));
                          }}
                          onLoadEnd={() => setImageLoadProgress(prev => ({...prev, [message.id]: 1}))}
                        />
                        {imageLoadProgress[message.id] < 1 && (
                          <View style={styles.progressOverlay}>
                            <ActivityIndicator size="small" color="#0000ff" />
                          </View>
                        )}
                      </View>
                    )}
                    <View style={[
                      styles.messageContent,
                      isOwnMessage ? styles.messageContentRight : styles.messageContentLeft
                    ]}>
                      
                      <View style={[
                        styles.messageBubble,
                        isOwnMessage ? styles.messageBubbleRight : styles.messageBubbleLeft
                      ]}>
                        {!isOwnMessage && (
                          <View style={styles.messageDisplayName}>
                            <Text style={styles.displayName}>
                              {message.userData.display_name}
                            </Text>
                          </View>
                        )}
                        {/* Reply Preview - Show quoted message if this is a reply */}
                        {((message.reply_to || message.replyTo) && (message.reply_to_message || message.replyToMessage)) && !message.is_deleted && (
                          <TouchableOpacity 
                            style={[
                              styles.messageReplyPreview,
                              isOwnMessage ? styles.messageReplyPreviewRight : styles.messageReplyPreviewLeft
                            ]}
                            onPress={() => {
                              // Scroll to original message
                              const replyToId = message.reply_to || message.replyTo;
                              if (replyToId) {
                                scrollToMessage(replyToId);
                              }
                            }}
                          >
                            {/* <View style={styles.replyPreviewLine} /> */}
                            <View style={styles.replyPreviewContent}>
                              <Text style={styles.replyPreviewSender}>
                                {(message.reply_to_message || message.replyToMessage)?.userData?.display_name || 'Unknown User'}
                              </Text>
                              <Text style={styles.replyPreviewText} numberOfLines={1}>
                                {(() => {
                                  const replyMessage = message.reply_to_message || message.replyToMessage;
                                  const messageText = replyMessage?.message || replyMessage?.content || '';
                                  return messageText ? messageText.replace(/<[^>]*>/g, '').substring(0, 100) : 'Media';
                                })()}
                                {(() => {
                                  const replyMessage = message.reply_to_message || message.replyToMessage;
                                  const messageText = replyMessage?.message || replyMessage?.content || '';
                                  return messageText && messageText.replace(/<[^>]*>/g, '').length > 100 ? '...' : '';
                                })()}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}
                        {(message.is_deleted) ? (
                          <Text style={[
                            styles.deletedMessage,
                            isOwnMessage ? styles.deletedMessageRight : styles.deletedMessageLeft
                          ]}>This message was deleted</Text>
                        ) : (message.messageMeta && message.messageMeta.group_message_group_joined && message.messageMeta.group_message_group_joined == "yes")? (
                          <Text style={[
                            styles.groupJoinedMessage,
                            isOwnMessage ? styles.groupJoinedMessageRight : styles.groupJoinedMessageLeft
                          ]}>Joined Group</Text>
                        ) : (
                          <>
                            <View style={styles.messageWrapper}>
                              <MessageRenderer message={message.message} width={width} textColor={isOwnMessage ? '#000' : undefined} />
                            </View> 
                            <View style={styles.reactionWrapper}>
                              <View style={styles.reactionsContainer}>
                              {message.emojis && message.emojis.length > 0 && (
                                  <>
                                  {Object.entries(
                                    message.emojis.reduce((acc, emojiStr) => {
                                      const [userId, emojiEntity] = emojiStr.split('___');
                                      const emoji = emojiEntity;
                                      if (!acc[emoji]) {
                                        acc[emoji] = [];
                                      }
                                     // console.log(emojiEntity)
                                      const userData = recipientsData.find(r => r.user_id === parseInt(userId)) || 
                                        (parseInt(userId) === currentUser.user.id ? currentUser.user : null);
                                      if (userData) {
                                        acc[emoji].push({
                                          userId: parseInt(userId),
                                          emoji,
                                          userName: userData.display_name
                                        });
                                      }
                                      return acc;
                                    }, {})
                                  ).map(([emoji, users]) => (
                                    <TouchableOpacity 
                                      key={`${message.id}-${emoji}`}
                                      style={[
                                        isOwnMessage ? styles.reactionBadgeRight : styles.reactionBadgeLeft,  
                                        styles.reactionBadge
                                      ]}
                                      onPress={() => handleOpenReactions(message.id)}
                                    >
                                      <Text style={[styles.reactionEmoji, isOwnMessage ? styles.reactionEmojiRight : styles.reactionEmojiLeft]}><EmojiRenderer message={emoji} width={10} /></Text>
                                      {users.length > 1 && (
                                        <Text style={[styles.reactionCount, isOwnMessage ? styles.reactionCountRight : styles.reactionCountLeft]}>{users.length}</Text>
                                      )}
                                      
                                    </TouchableOpacity>
                                  ))}
                                  </>
                              )}
                                <TouchableOpacity 
                                    style={styles.reactionButton}
                                    onPress={() => openEmojiPicker(message.id)}
                                  >
                                    <Ionicons name="happy-outline" size={20} color="#ccc" />
                                  </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.replyButton}
                                    onPress={() => handleReplyToMessage(message)}
                                  >
                                    <Ionicons name="arrow-undo-outline" size={20} color="#ccc" />
                                  </TouchableOpacity>
                              </View>
                              
                            </View>
                        

                            {message.messageMeta && message.messageMeta.gifData && message.messageMeta.gifData.mp4 && (
                              <VideoPlayer
                                key={`gif-${message.id}-${msgIndex}`}
                                source={normalizeMediaUrl(message.messageMeta.gifData.mp4)}
                                style={styles.attachmentVideo}
                                onPress={() => handleVideoPress(message.messageMeta.gifData.mp4)}
                              />
                            )}

                            {message.attachments && message.attachments.length > 0 && (
                              <View style={styles.attachmentContainer} key={`attachments-${message.id}-${msgIndex}`}>
                                {message.attachments.map((attachment, attIndex) => {
                                  if (attachment.media && attachment.media) {
                                    if (attachment.media.type && attachment.media.type.startsWith('photo')) {
                                      return (
                                        <TouchableOpacity
                                          key={`photo-${message.id}-${attIndex}`}
                                          onPress={() => handleImagePress(attachment.finalPath)}
                                        >
                                          <View style={styles.attachmentImageContainer}>
                                            <FastImage
                                              source={{ uri: attachment.finalPath }}
                                              style={styles.documentPreview}
                                              onLoadStart={() => setImageLoadProgress(prev => ({...prev, [`attachment-${message.id}-${attIndex}`]: 0}))}
                                              onProgress={({ nativeEvent }) => {
                                                const progress = nativeEvent.loaded / nativeEvent.total;
                                                setImageLoadProgress(prev => ({...prev, [`attachment-${message.id}-${attIndex}`]: progress}));
                                              }}
                                              onLoadEnd={() => setImageLoadProgress(prev => ({...prev, [`attachment-${message.id}-${attIndex}`]: 1}))}
                                            />
                                            {imageLoadProgress[`attachment-${message.id}-${attIndex}`] < 1 && (
                                              <View style={styles.progressOverlay}>
                                                <ActivityIndicator size="small" color="#0000ff" />
                                              </View>
                                            )}
                                          </View>
                                        </TouchableOpacity>
                                      );
                                    } else if (attachment.media.type && attachment.media.type.startsWith('video')) {
                                      return (
                                        <VideoPlayer
                                          key={`video-${message.id}-${attIndex}`}
                                          source={normalizeMediaUrl(attachment.finalPath)}
                                          style={styles.attachmentVideo}
                                          onPress={() => handleVideoPress(attachment.finalPath)}
                                        />
                                      );
                                    } else {
                                      return (
                                        <View key={`document-${message.id}-${attIndex}`} style={styles.documentContainer}>
                                          <Text style={styles.documentText} numberOfLines={1} ellipsizeMode="tail">
                                            Document: {attachment.media.title || 'Unnamed Document'}
                                          </Text>
                                          <TouchableOpacity onPress={() => handleDownloadDocument(attachment.finalPath)}>
                                            <Text style={styles.downloadButton}>Download</Text> 
                                          </TouchableOpacity>
                                        </View>
                                      );
                                    }
                                  }
                                  return null;
                                })}
                              </View>
                            )}
                          </>
                        )}
                      </View>
                      <View style={[
                        styles.messageFooter,
                        isOwnMessage ? styles.messageFooterRight : styles.messageFooterLeft
                      ]}>
                        <Text style={styles.messageTime}>
                          {new Date(message.date_sent).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </Text>
                        {isOwnMessage && perMessageStatus && (
                          <View style={styles.messageStatusContainer}>
                            {perMessageStatus === 'Seen' ? (
                              <TouchableOpacity
                                onPress={() => {
                                  getSeenUsers(message.id);
                                }}
                              >
                                <Text style={[styles.messageStatusText, styles.messageSeenColor]}>{perMessageStatus}</Text>
                              </TouchableOpacity>
                            ) : (
                              <Text style={styles.messageStatusText}>{perMessageStatus}</Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
        
        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {Array.from(typingUsers.values()).length === 1 
                ? `${Array.from(typingUsers.values())[0]} is typing...` 
                : `${Array.from(typingUsers.values()).join(', ')} are typing...`}
            </Text>
          </View>
        )}
      </View>

      <MessageInput 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
          message={textmessage} 
          handleMessage={handleMessage} 
          handleSendMessage={handleSendMessage} 
          setShowKeyword={setShowKeyword} 
          messageInputFrom={"ThreadScreen"}
          replyingToMessage={replyingToMessage}
          onCancelReply={handleCancelReply}
          keyboardHeight={keyboardHeight}
          setKeyboardHeight={setKeyboardHeight}
          onMediaChange={setHasMedia}
        />

      {/* Use the RecipientsModal component */}
      <RecipientsModal  
        visible={isModalVisible} 
        recipientsData={recipientsData} 
        onClose={() => setModalVisible(false)} // Close modal function
      />
      <SeenRecipientsModal  
        visible={isSeenModalVisible} 
        recipientsData={showSeenList}
        loading={seenModalLoading}
        onClose={() => setSeenModalVisible(false)} // Close modal function
      />
      <EmojiRecipientsModal  
        visible={isEmojiModalVisible} 
        recipientsData={emojiRecipientsList} 
        onClose={() => setEmojiModalVisible(false)} // Close modal function
      />
      <PageLoader visible={loaderVisible} setVisible={setLoaderVisible} />
      <Modal visible={ImageModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
            <Text style={styles.closeText}>✖</Text>
          </TouchableOpacity>
          {selectedImage && (
              <Fragment>
                <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="contain" />
                <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
                  <Text style={styles.downloadText}>Download</Text>
                </TouchableOpacity>
              </Fragment>
          )}
        </View>
      </Modal>
      <Modal visible={VideoModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setVideoModalVisible(false);
              setSelectedVideo(null);
              setVideoLoading(false);
              setVideoError(null);
            }}
          >
            <Text style={styles.closeText}>✖</Text>
          </TouchableOpacity>
          {selectedVideo && (
            <View style={styles.fullScreenVideoContainer}>
              {videoLoading && (
                <View style={styles.videoLoadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
              {videoError && (
                <View style={styles.videoErrorOverlay}>
                  <Text style={styles.videoErrorText}>Failed to load video</Text>
                  <Text style={styles.videoErrorSubText} numberOfLines={2}>{selectedVideo}</Text>
                </View>
              )}
              <VideoPlayer
                source={selectedVideo}
                style={styles.fullScreenVideo}
                controls={true}
                autoPlay={true}
                resizeMode="contain"
                onLoadStart={() => {
                  setVideoLoading(true);
                  setVideoError(null);
                }}
                onLoad={() => {
                  setVideoLoading(false);
                  setVideoError(null);
                }}
                onError={(e) => {
                  setVideoLoading(false);
                  setVideoError(e);
                  console.log('Modal video error', { url: selectedVideo, error: e });
                }}
              />
            </View>
          )}
        </View>
      </Modal>
      
      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <View style={styles.emojiPickerContainer}>
          <View style={styles.emojiPickerContent}>
            <View style={styles.emojiPickerHeader}>
              <Text style={styles.emojiPickerTitle}>Add Reaction</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ maxHeight: 300 }}
              contentContainerStyle={styles.emojiGrid}
              showsVerticalScrollIndicator={true}
            >
              {[
                '👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '🎉', '💯', '🤔', '🤯', '🤩', '🤗', '🤓',
                '🤑', '🤒', '🤕', '🤖', '👊', '🤝', '🤷', '🤦', '😡', '😷', '😅', '😆', '😋', '😃', '😄',
                '😁', '😺', '😸', '😹', '😻', '😽', '🙀', '🙃', '🦄', '🌈', '🍕', '🍀', '🚀', '💥', '🎶',
                '🎂', '🍔', '🍟', '🍺','🌞','🌚','🌙','⭐','✨','☀️','⚡','🌊','🌵','🌸','🌺','🌻','🌼','🌟','🍦','🍉','🍇','🍓','🍒','🥑','🍌','🍎','🍏','🍊','🍋',
                '🥕','🍆','🍅','🥚','🍖','🧀','🍩','🍫','🍪','🍰','🧁','🥧','🍣','🍤','🍱','🍛','🍜','🍝','🍲','🍥','🍢',
                '🥂','🍷','🍸','🥃','🍻','🥤','🥛','🍼','☕','🫖','🍵',
                '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🦁','🐨','🐯',
                '🎃','🎄','🎆','🎇','🎈','🎁','🛒','🧸','🎨','🎤','🎧','🎬','🎹','🎮','🎲','🤹','🧩',
                '✈️','🚁','🚂','🚃','🚄','🚗','🚕','🚌','🚙','🏎️','🚓','🚑','🚒','🚚','🚜','⛵','🚢','🛳️','⚓',
                '🏅','🥉','🏆','🎖️','🏵️','🎗️','🎯'
              ].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiButton}
                  onPress={() => handleAddReaction(selectedMessageId, emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <EditMessageModal
        visible={showEditModal}
        initialValue={threadData.find(m => m.id === selectedMessageIds[0])?.message || ''}
        onSave={handleSaveEdit}
        onCancel={() => setShowEditModal(false)}
        loading={loaderVisible}
      />
      
      {/* Message Options Modal for Android */}
      <Modal
        visible={showMessageOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMessageOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMessageOptionsModal(false)}
        >
          <View style={styles.messageOptionsModal}>
            <Text style={styles.messageOptionsTitle}>Message Options</Text>
            {selectedMessageForOptions && selectedMessageForOptions.userData.id === currentUser.user.id ? (
              <>
                <TouchableOpacity
                  style={styles.messageOptionButton}
                  onPress={() => handleOptionSelect('reply')}
                >
                  <Ionicons name="arrow-undo-outline" size={20} color="#122b46" />
                  <Text style={styles.messageOptionText}>Reply</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.messageOptionButton}
                  onPress={() => handleOptionSelect('edit')}
                >
                  <Ionicons name="create-outline" size={20} color="#122b46" />
                  <Text style={styles.messageOptionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.messageOptionButton, styles.messageOptionButtonDestructive]}
                  onPress={() => handleOptionSelect('delete')}
                >
                  <Ionicons name="trash" size={20} color="#e53935" />
                  <Text style={[styles.messageOptionText, styles.messageOptionTextDestructive]}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.messageOptionButton}
                  onPress={() => handleOptionSelect('select')}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#122b46" />
                  <Text style={styles.messageOptionText}>Select</Text>
                </TouchableOpacity>
                {messageHasSeenUsers(selectedMessageForOptions) && (
                  <TouchableOpacity
                    style={styles.messageOptionButton}
                    onPress={() => handleOptionSelect('info')}
                  >
                    <Ionicons name="information-circle-outline" size={20} color="#122b46" />
                    <Text style={styles.messageOptionText}>Info</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.messageOptionButton}
                  onPress={() => handleOptionSelect('reply')}
                >
                  <Ionicons name="arrow-undo-outline" size={20} color="#122b46" />
                  <Text style={styles.messageOptionText}>Reply</Text>
                </TouchableOpacity>
                {messageHasSeenUsers(selectedMessageForOptions) && (
                  <TouchableOpacity
                    style={styles.messageOptionButton}
                    onPress={() => handleOptionSelect('info')}
                  >
                    <Ionicons name="information-circle-outline" size={20} color="#122b46" />
                    <Text style={styles.messageOptionText}>Info</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            <TouchableOpacity
              style={[styles.messageOptionButton, styles.messageOptionButtonCancel]}
              onPress={() => setShowMessageOptionsModal(false)}
            >
              <Text style={styles.messageOptionTextCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

// Helper function to determine if the user is at the top of the scroll view
const isCloseToTop = ({ layoutMeasurement, contentOffset, contentSize }) => {
  const paddingToTop = 20; // Adjust as needed
  return contentOffset.y <= paddingToTop; // Detect when close to the top
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#f5f5f5',
    marginTop: Platform.OS === 'ios' ? 0 : 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    fontSize: 16,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    text: {
      textAlign: 'center',
    }
  },
  recipientCount: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingVertical: 2,
  },
  messageContainerLeft: {
    justifyContent: 'flex-start',
    paddingLeft: 10,
    paddingRight: 10,
  },
  messageContainerRight: {
    justifyContent: 'flex-end',
    paddingLeft: 10,
    paddingRight: 5,
  },
  messageHighlighted: {
    backgroundColor: '#d0e6fd',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d0e6fd',
    padding: 4,
  },
  userImageContainer: {
    position: 'relative',
    width: 36,
    height: 36,
    marginRight: 8,
  },
  userImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  messageContent: {
    flexShrink: 1,
    alignSelf: 'flex-start',
  },
  messageContentLeft: {
    alignItems: 'flex-start',
    maxWidth: '90%',
  },
  messageContentRight: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  messageBubbleLeft: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: '#d7ebf8',
    borderTopRightRadius: 4,
    marginRight: 4,
    color: '#fff',
  },
  messageDate: {
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  messageFooterLeft: {
    justifyContent: 'flex-start',
  },
  messageFooterRight: {
    justifyContent: 'flex-end',
  },
  deletedMessage: {
    padding: 10,
    color: "#666",
    fontStyle: 'italic',
  },
  deletedMessageLeft: {
    backgroundColor: "#fff",
  },
  deletedMessageRight: {
    backgroundColor: "#d7ebf8",
  },
  groupJoinedMessage: {
    padding: 10,
    color: "#666",
    fontStyle: 'italic',
  },
  groupJoinedMessageLeft: {
    backgroundColor: "#b4b4b424",
  },
  groupJoinedMessageRight: {
    backgroundColor: "#b4b4b424",
  },
  webView: {
    marginTop: 5,
    fontSize: 40,
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  displayName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginHorizontal: 4,
  },
  messageStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 5,
    width: "100%",
    gap: 10
  },
  attachmentImageContainer: {
    position: 'relative',
  },
  attachmentImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginRight: 5,
  },
  attachmentVideo: {
    width: 250,
    height: 200,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: "#ccc"
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentPreview: {
    width: 250,
    height: 250,
    borderRadius: 12,
    marginTop: 4,
  },
  documentText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
    marginRight: 10,
    fontWeight: '500',
  },
  downloadButton: {
    backgroundColor: '#122b46',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    color: '#ffffff',
  },
  downloadText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
  fullScreenVideoContainer: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  videoErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 3,
  },
  videoErrorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  videoErrorSubText: {
    color: '#ddd',
    fontSize: 12,
    textAlign: 'center',
  },
  fullScreenVideo: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999999,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 30,
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    textAlign: 'center',
    lineHeight: 40,
  },
  typingIndicator: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 5,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  messageStatusMain: {
    position: "absolute",
    width: "100%",
  },
  messageSeenColor:{
    color: "#4fc3f7"
  },
  messageStatusText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  },
  reactionWrapper: {
    marginTop: 4,
  },
  reactionButton: {
    padding: 0,
    marginLeft: 0,
  },
  replyButton: {
    padding: 0,
    marginLeft: 8,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 30,
    borderWidth: 1,
  },
  reactionBadgeLeft: {
    borderColor: '#90CAF9',
    backgroundColor: '#fff',
  },
  reactionBadgeRight: {
    borderColor: '#90CAF9',
    backgroundColor: '#E3F2FD',
  },
  reactionEmoji: {
    fontSize: 14,
    marginTop: Platform.OS === 'ios' ? 4 : 0,
  },
  reactionCount: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '700',
    lineHeight: 16,
    marginLeft: 5,
  },
  emojiPickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  emojiPickerContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 10,
  },
  emojiButton: {
    width: '18%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emojiText: {
    fontSize: 24,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  replyPreviewBanner: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  replyPreviewBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyPreviewBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  replyPreviewInfo: {
    flex: 1,
  },
  replyPreviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4fc3f7',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 12,
    color: '#666',
  },
  replyPreviewCancel: {
    padding: 4,
  },
  messageReplyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  messageReplyPreviewLeft: {
    borderLeftWidth: 3,
    borderLeftColor: '#4fc3f7',
  },
  messageReplyPreviewRight: {
    borderLeftWidth: 3,
    borderLeftColor: '#4fc3f7',
  },
  replyPreviewContent: {
  },
  replyPreviewSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4fc3f7',
    marginBottom: 2,
  },
  messageDisplayName: {
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  messageOptionsModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
  },
  messageOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  messageOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageOptionButtonDestructive: {
    borderBottomColor: '#f0f0f0',
  },
  messageOptionButtonCancel: {
    marginTop: 8,
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  messageOptionText: {
    fontSize: 16,
    color: '#122b46',
    marginLeft: 12,
  },
  messageOptionTextDestructive: {
    color: '#e53935',
  },
  messageOptionTextCancel: {
    fontSize: 16,
    color: '#122b46',
    fontWeight: '600',
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ThreadScreen);
