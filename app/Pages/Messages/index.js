import React, { useState, useEffect, Fragment, memo, useCallback } from 'react';
import { connect } from 'react-redux';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, FlatList, RefreshControl, SafeAreaView, ActivityIndicator } from 'react-native';
import { Button } from 'react-native-paper';  // Importing button from react-native-paper
import agent from '../../agent';
import { useNavigation } from '@react-navigation/native';
import { StatusBar, PageLoader } from '../../components';
import { useFocusEffect } from '@react-navigation/native'; 
import notifee from '@notifee/react-native';

import { LOAD_PAGE, UNREAD_COUNT_CALLING } from '../../constants';
import he from 'he';

const mapStateToProps = state => ({
  ...state,
  currentUser: state.common.currentUser,
  isLoggedIn: state.common.isLoggedIn,
  socketConnection: state.common.socket,
  pageLoaded: state.common.pageLoaded,
});
const mapDispatchToProps = dispatch => ({
  setLoadPage: (value) => dispatch({ type: LOAD_PAGE, payload: value }),
  setUnreadCountCalling: () => dispatch({ type: UNREAD_COUNT_CALLING, success: "true" })
});

const MessagesScreen = memo((props) => {
  const { currentUser, token, isLoggedIn, checkLoginValue, loationId,setLoadPage,pageLoaded,setUnreadCountCalling, socketConnection } = props;
  const [messages, setMessages] = useState([]);
  const [loaderVisible, setLoaderVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);  // Number of messages per page
  const [hasMore, setHasMore] = useState(true);

  let loaderStop = false

  const navigation = useNavigation();

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Improved navigation handling
 const navigateToScreen = (screenName, params = {}) => {
  try {
    if (!navigation) return;

    const currentRoute = navigation.getState()?.routes[navigation.getState().index];
    if (currentRoute?.name === screenName) return;

    navigation.navigate(screenName, params);
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

  const onRefresh = async () => {
    try {
      setLoadPage(true);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const stripHtmlTags = (html) => {
    return (html || '').replace(/<[^>]*>/g, '');
  };

  const decodeHtml = (html) => {
    return he.decode(stripHtmlTags(html));
  };

  useEffect(() => {
  
    if(socketConnection){

      socketConnection.on('response', (data) => {
        console.log('Received from server:', data);
      });
      socketConnection.on('sendMessageRes', (data) => {
        loaderStop = true;
        setLoadPage(true);
      });
      socketConnection.on('sendReaction', (data) => {
        loaderStop = true;
        setLoadPage(true);
      });
    }
  }, [socketConnection]);

  const fetchMessages = async (pageNumber = 1) => {
    if(loaderStop != true){
      setLoaderVisible(true)
    }
    loaderStop = false;
    
    try {
      const Response = await agent.Auth.getMessages(searchQuery, pageNumber, limit);
      if (Response && Response.data && Response.data.messages && Response.data.messages.length > 0) {
        const fetchedMessages = Response.data.messages;

        setMessages(prevMessages => {
          if (pageNumber === 1) return fetchedMessages;
        
          const allMessages = [...prevMessages, ...fetchedMessages];
          const uniqueMessages = Array.from(
            new Map(allMessages.map(message => [message.id, message])).values()
          );
        
          return uniqueMessages.sort((a, b) =>
            new Date(b.date_sent) - new Date(a.date_sent)
          );
        });
        
        setHasMore(fetchedMessages.length === limit);
      } else {
        setHasMore(false);
      }
      setRefreshing(false);
    } catch (error) { 
      console.error('Error fetching messages:', error);
    } finally {
      setLoaderVisible(false);
    }
  };

  // Handle Button Click
  const handleButtonClick = () => {
    alert('Button clicked!');
  }

  useEffect(() => {
    if(currentUser) {
      //console.log("cr",currentUser)
    }
  }, [currentUser])

  useEffect(() => {
    if(pageLoaded){
        setLoadPage(false);
        setPage(1)
        setMessages([])
        fetchMessages(1);
        setUnreadCountCalling();
    }
    
  }, [pageLoaded])

  // Debounce search: wait 2 seconds after typing stops
  useEffect(() => {
    if(searchQuery.length > 0){
      const debounceTimer = setTimeout(() => {
        setPage(1);
        setMessages([]);
        fetchMessages(1);
      }, 1100);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery]);

  const handleSearch = (text) => {

    setSearchQuery(text);
    // When cleared, reset to first page and fetch immediately; otherwise, let debounce handle it
    if (text.length === 0) {
      setPage(1);
      setMessages([]);
      fetchMessages(1);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setLoadPage(true);
      return () => {
        setLoadPage(false); // Set loading to false when the page leaves
      };
    }, [setLoadPage])
  );

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
      return messageDate.toLocaleDateString('en-US', {  year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 10; 
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  };

  // const filteredMessages = messages.filter(message => {
  //     const senderName = (message.group?.name ||
  //         message.recipients
  //             .filter(recipient => currentUser.user.id !== recipient.userData?.id)
  //             .map(recipient => recipient.userData?.display_name)
  //             .join(', ') ||
  //         message.sender ||
  //         ''); // Default to an empty string if all else fails

  //     return senderName.toLowerCase().includes(searchQuery.toLowerCase());
  // });
  const filteredMessages = messages;

  const renderMessageItem = ({ item: message }) => {
    const unreadMessages = message.recipients.filter(
      recipient => recipient.user_id === currentUser.user.id && recipient.unread_count > 0
    );

    const messageSender =
      message.userData.id === currentUser.user.id ? 'You' : message.userData.display_name;

    const lastMessageText = decodeHtml(message.message);

    const previewText =
      message.reactions && message.reactions.message
        ? decodeHtml(message.reactions.message)
        : (messageSender ? `${messageSender}: ` : '') + lastMessageText;

    return (
      <TouchableOpacity 
        key={"message-" + message.id} 
        style={styles.messageItem}
        onPress={() => navigateToScreen('ThreadScreen', { threadId: message.thread_id })}
      >
        {message.group && message.group.id ? (
          <Image source={{ uri: message.group.image }} style={styles.avatar} />
        ) : message.recipients && message.recipients.length > 2 ? (
          <Fragment key={"messagerecipients-" + message.id}>
            <View style={styles.messageImagesContainer}>
              {message.recipients.slice(0, 2).map((recipient, index) => (
                <Fragment key={recipient.id ? "recipient-" + recipient.id : "recipient-" + message.id + "-" + index}>
                  <Image 
                    source={{ uri: recipient.userData.image }} 
                    style={[styles.avatar, { marginLeft: index > 0 ? 17 : 0, top: index > 0 ? -20 : 0, width: 35, height: 35 }]} 
                  />
                </Fragment>
              ))}
            </View>
          </Fragment>
        ) : (
          <View style={styles.recipientsContainer}>
           {(() => {
              const filteredRecipients = message.recipients.filter(
                recipient => currentUser.user.id !== recipient.userData?.id
              );

              const recipientsToRender = filteredRecipients.length > 0 
                ? filteredRecipients 
                : [{ id: 'dummy', userData: { image: null } }];

              return recipientsToRender.map((recipient, index) => (
                <View key={recipient.id || index} style={styles.recipientItem}>
                  <Image 
                    source={recipient.userData?.image ? { uri: recipient.userData.image } : require('../../assets/images/icons/dummy-user.png')} 
                    style={styles.avatar} 
                  />
                </View>
              ));
            })()}
          </View>
        )}

        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            {message.group && message.group.id ? (
              <Text style={styles.sender}>{message.group.name}</Text>
            ) : message.recipients && message.recipients.length > 0 ? (
              <Text style={styles.sender}>
                {message.recipients
                  .filter(recipient => currentUser.user.id !== recipient.userData?.id)
                  .map(recipient => recipient.userData?.display_name)
                  .filter(name => name)
                  .join(', ') || 'Deleted user'}
              </Text>
            ) : (
              <Text style={styles.sender}>{message.sender}</Text>
            )}

            <Text style={styles.timestamp}>{formatDate(message.date_sent)}</Text>
          </View>

          <Text style={styles.messageText} numberOfLines={1}>
            {previewText}
          </Text>
        </View>
        {unreadMessages.length > 0 && (
          <View style={styles.unreadBadgeMain}>
             <View style={styles.unreadBadge} />
          </View>   
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#ff7a08" />
      </View>
    );
  };

  const handleEndReached = () => {
    if (!loaderVisible && hasMore && !isLoadingMore && !refreshing) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage).finally(() => {
        setIsLoadingMore(false);
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Search and Message Button */}
        <View style={styles.headerContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              keyboardType="default"
              autoCorrect={false}
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={text => handleSearch(text)}
            />
          </View>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => navigateToScreen('NewMessage')}
          >
            <Image 
              source={require('../../assets/images/icons/message-icon.png')} 
              style={styles.messageIcon}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredMessages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => "message-" + item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ff7a08']}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.0}
          ListFooterComponent={renderFooter}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={100}
          initialNumToRender={10}
        />
        <PageLoader visible={loaderVisible} setVisible={setLoaderVisible} />
      </View>
    </SafeAreaView>
  );
})

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    marginRight: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#999',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  messageImagesContainer: {
    position: 'relative',
    avatar: {
      width: 20,
      height: 20,
      position: 'absolute'
    }
  },
  messagesList: {
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sender: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '70%',
    overflow: 'hidden',
  },
  timestamp: {
    fontSize: 14,
    color: '#999',
  },
  unreadBadgeMain: {
    display: "flex",
    justifyContent: "center",
    width: 30,
  },
  unreadBadge: {
    width: 13,
    height: 13,
    backgroundColor: '#122b46',
    borderRadius: 7,
    marginLeft: 5,
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
    paddingHorizontal: 20,
  },
  messageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
  },
  newMessageButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    alignItems: 'center',
  },
  newMessageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  recipientName: {
    fontSize: 14,
    color: '#333',
  },
  loadingMoreContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MessagesScreen);
